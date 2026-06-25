const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Log JWT_SECRET status at startup (without exposing the actual secret)
console.log(`[Backend] JWT_SECRET configured: ${JWT_SECRET ? 'Yes' : 'No'} (using ${process.env.JWT_SECRET ? 'environment variable' : 'default'})`);

app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Function to calculate next due date
function getNextDueDate(currentDate, recurrence) {
  const date = new Date(currentDate);
  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'semi-annually':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.toISOString().split('T')[0];
}

// Function to process fixed dues
async function processFixedDues() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.execute(
      'SELECT * FROM fixed_dues WHERE due_date = ? AND is_paid = FALSE',
      [today]
    );
    for (const due of rows) {
      const transId = uuidv4();
      const last_modified = Date.now();
      await pool.execute(
        'INSERT INTO transactions (id, user_id, type, description, amount, category, date, source, source_id, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [transId, due.user_id, 'expense', `Fixed due: ${due.name}`, due.amount, due.name, today, 'fixed-due', due.id, last_modified]
      );
      const nextDue = getNextDueDate(today, due.recurrence);
      await pool.execute(
        'UPDATE fixed_dues SET is_paid = TRUE, paid_date = ?, due_date = ? WHERE id = ?',
        [today, nextDue, due.id]
      );
      sendEvent(due.user_id, { entity: 'transactions', action: 'insert', id: transId });
      sendEvent(due.user_id, { entity: 'fixed_dues', action: 'update', id: due.id });
    }
  } catch (error) {
    console.error('Error processing fixed dues:', error);
  }
}

// SSE clients keyed by user id
const clients = new Map();

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

// Rate limiting for auth errors to prevent log spam
const authErrorLogs = new Map();
const AUTH_ERROR_LOG_INTERVAL = 60000; // Log same error at most once per minute

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = bearerToken || req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (error) {
    // Rate limit error logging to prevent spam
    const errorKey = error.name;
    const now = Date.now();
    const lastLogTime = authErrorLogs.get(errorKey) || 0;

    if (now - lastLogTime > AUTH_ERROR_LOG_INTERVAL) {
      console.error(`[Auth] ${error.name}: ${error.message} (from ${req.method} ${req.path})`);
      authErrorLogs.set(errorKey, now);
    }

    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function sendEvent(userId, event) {
  const userClients = clients.get(userId);
  if (!userClients) return;
  const message = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of userClients) {
    res.write(message);
  }
}

// Database connection check endpoint
app.get('/api/db-check', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ status: 'connected' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ status: 'disconnected', error: error.message });
  }
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await pool.execute(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [id, normalizedEmail, passwordHash]
    );

    const token = generateToken({ id, email: normalizedEmail });
    res.status(201).json({ token, user: { id, email: normalizedEmail } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// SSE endpoint
app.get('/api/events', authenticate, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write('data: {"status":"connected"}\n\n');

  const userId = req.user.id;
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);

  req.on('close', () => {
    const set = clients.get(userId);
    if (set) {
      set.delete(res);
      if (!set.size) {
        clients.delete(userId);
      }
    }
  });
});

function buildUpdatedSinceClause(columnName, updatedSince) {
  if (!updatedSince) return { clause: '', params: [] };
  const date = new Date(Number(updatedSince));
  if (Number.isNaN(date.valueOf())) return { clause: '', params: [] };
  return { clause: ` AND ${columnName} >= ?`, params: [date] };
}

// Protected routes middleware helper
function withAuth(handler) {
  return (req, res) => authenticate(req, res, () => handler(req, res));
}

// Transactions routes
app.get(
  '/api/transactions',
  withAuth(async (req, res) => {
    try {
      console.log(`[Backend] Fetching transactions for user ${req.user.id}`);
      const { clause, params } = buildUpdatedSinceClause('last_modified', req.query.updated_since);
      const [rows] = await pool.execute(
        `SELECT * FROM transactions WHERE user_id = ? AND deleted = FALSE${clause} ORDER BY date DESC`,
        [req.user.id, ...params]
      );
      console.log(`[Backend] Found ${rows.length} transactions for user ${req.user.id}`);
      if (rows.length > 0) {
        console.log(`[Backend] Sample transaction:`, JSON.stringify(rows[0], null, 2));
      }
      res.json(rows);
    } catch (error) {
      console.error('[Backend] Error fetching transactions:', error);
      console.error('[Backend] Error message:', error.message);
      res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
    }
  })
);

app.post(
  '/api/transactions',
  withAuth(async (req, res) => {
    try {
      const { type, description, amount, category, date, source, source_id } = req.body;
      const id = req.body.id || uuidv4();
      const last_modified = Date.now();

      console.log(`[Backend] Creating transaction: ${id} for user ${req.user.id}`);
      console.log(`[Backend] Data:`, { type, description, amount, category, date, source, source_id });

      await pool.execute(
        'INSERT INTO transactions (id, user_id, type, description, amount, category, date, source, source_id, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, req.user.id, type, description, amount, category, date, source || 'transaction', source_id || null, last_modified]
      );

      console.log(`[Backend] Transaction ${id} created successfully`);

      sendEvent(req.user.id, { entity: 'transactions', action: 'insert', id });
      res.status(201).json({ id });
    } catch (error) {
      console.error('[Backend] Error creating transaction:', error);
      console.error('[Backend] Error message:', error.message);
      console.error('[Backend] Error code:', error.code);
      res.status(500).json({
        error: 'Failed to create transaction',
        details: error.message,
        code: error.code
      });
    }
  })
);

app.put(
  '/api/transactions/:id',
  withAuth(async (req, res) => {
    try {
      const { type, description, amount, category, date, source, source_id } = req.body;
      const last_modified = Date.now();
      const [result] = await pool.execute(
        'UPDATE transactions SET type = ?, description = ?, amount = ?, category = ?, date = ?, source = ?, source_id = ?, last_modified = ? WHERE id = ? AND user_id = ?',
        [type, description, amount, category, date, source || 'transaction', source_id || null, last_modified, req.params.id, req.user.id]
      );
      if (!result.affectedRows) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      sendEvent(req.user.id, { entity: 'transactions', action: 'update', id: req.params.id });
      res.json({ message: 'Transaction updated' });
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  })
);

app.delete(
  '/api/transactions/:id',
  withAuth(async (req, res) => {
    try {
      const last_modified = Date.now();
      const [result] = await pool.execute(
        'UPDATE transactions SET deleted = TRUE, last_modified = ? WHERE id = ? AND user_id = ? AND deleted = FALSE',
        [last_modified, req.params.id, req.user.id]
      );
      if (!result.affectedRows) {
        // Check if transaction exists but is already deleted
        const [checkRows] = await pool.execute(
          'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
          [req.params.id, req.user.id]
        );
        if (checkRows.length > 0) {
          // Transaction exists but already deleted - return success
          return res.json({ message: 'Transaction already deleted' });
        }
        // Transaction doesn't exist
        return res.status(404).json({ error: 'Transaction not found' });
      }
      sendEvent(req.user.id, { entity: 'transactions', action: 'delete', id: req.params.id });
      res.json({ message: 'Transaction deleted' });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  })
);

// Fixed dues routes
app.get(
  '/api/fixed-dues',
  withAuth(async (req, res) => {
    try {
      console.log(`[Backend] Fetching fixed dues for user ${req.user.id}`);
      const [rows] = await pool.execute('SELECT * FROM fixed_dues WHERE user_id = ?', [req.user.id]);
      console.log(`[Backend] Found ${rows.length} fixed dues for user ${req.user.id}`);
      if (rows.length > 0) {
        // Log is_paid values to debug
        rows.forEach(row => {
          console.log(`[Backend] Fixed due ${row.id}: is_paid=${row.is_paid} (type: ${typeof row.is_paid})`);
        });
        console.log(`[Backend] Sample fixed due:`, JSON.stringify(rows[0], null, 2));
      }
      res.json(rows);
    } catch (error) {
      console.error('[Backend] Error fetching fixed dues:', error);
      console.error('[Backend] Error message:', error.message);
      res.status(500).json({ error: 'Failed to fetch fixed dues', details: error.message });
    }
  })
);

app.post(
  '/api/fixed-dues',
  withAuth(async (req, res) => {
    try {
      const { name, amount, recurrence, start_date, end_date, due_date, is_paid, paid_date } = req.body;
      const id = req.body.id || uuidv4();

      const normalizeDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : null;
      const normStartDate = normalizeDate(start_date);
      const normEndDate = normalizeDate(end_date);
      const normDueDate = normalizeDate(due_date);
      const normPaidDate = normalizeDate(paid_date);

      console.log(`[Backend] Creating fixed due: ${id} for user ${req.user.id}`);
      console.log(`[Backend] Data:`, { name, amount, recurrence, start_date: normStartDate, end_date: normEndDate, due_date: normDueDate, is_paid, paid_date: normPaidDate });

      await pool.execute(
        'INSERT INTO fixed_dues (id, user_id, name, amount, recurrence, start_date, end_date, due_date, is_paid, paid_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, req.user.id, name, amount, recurrence, normStartDate, normEndDate, normDueDate, !!is_paid, normPaidDate]
      );

      console.log(`[Backend] Fixed due ${id} created successfully`);

      // Update fixed due if initial due is today (not past, to avoid auto-marking historical dues as paid)
      const today = new Date().toISOString().split('T')[0];
      if (normDueDate === today && !is_paid) {
        await pool.execute(
          'UPDATE fixed_dues SET is_paid = TRUE, paid_date = ? WHERE id = ?',
          [today, id]
        );
        sendEvent(req.user.id, { entity: 'fixed_dues', action: 'update', id });
      }

      sendEvent(req.user.id, { entity: 'fixed_dues', action: 'insert', id });
      res.status(201).json({ id });
    } catch (error) {
      console.error('[Backend] Error creating fixed due:', error);
      console.error('[Backend] Error message:', error.message);
      console.error('[Backend] Error code:', error.code);
      console.error('[Backend] SQL state:', error.sqlState);
      res.status(500).json({
        error: 'Failed to create fixed due',
        details: error.message,
        code: error.code
      });
    }
  })
);

app.put(
  '/api/fixed-dues/:id',
  withAuth(async (req, res) => {
    try {
      const { name, amount, recurrence, start_date, end_date, due_date, is_paid, paid_date } = req.body;

      const normalizeDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : null;
      const normStartDate = normalizeDate(start_date);
      const normEndDate = normalizeDate(end_date);
      const normDueDate = normalizeDate(due_date);
      const normPaidDate = normalizeDate(paid_date);

      // Fetch previous state to check for paid -> unpaid transition
      const [prevRows] = await pool.execute('SELECT is_paid, due_date FROM fixed_dues WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      if (prevRows.length === 0) {
        return res.status(404).json({ error: 'Fixed due not found' });
      }
      const prevIsPaid = Boolean(prevRows[0].is_paid);
      const prevDueDate = prevRows[0].due_date;

      // Explicitly handle is_paid - ensure false is preserved, not converted to truthy
      // is_paid can be boolean false, 0, '0', 'false', or null/undefined
      let isPaidValue = false;
      if (is_paid === true || is_paid === 1 || is_paid === '1' || is_paid === 'true') {
        isPaidValue = true;
      } else if (is_paid === false || is_paid === 0 || is_paid === '0' || is_paid === 'false' || is_paid === null || is_paid === undefined) {
        isPaidValue = false;
      }
      // Default to false if not explicitly true

      console.log(`[Backend] Updating fixed due ${req.params.id}: prev_is_paid=${prevIsPaid}, new_is_paid=${is_paid} (raw) -> ${isPaidValue} (processed)`);
      console.log(`[Backend] Normalized dates: start_date=${normStartDate}, end_date=${normEndDate}, due_date=${normDueDate}, paid_date=${normPaidDate}`);

      const [result] = await pool.execute(
        'UPDATE fixed_dues SET name = ?, amount = ?, recurrence = ?, start_date = ?, end_date = ?, due_date = ?, is_paid = ?, paid_date = ? WHERE id = ? AND user_id = ?',
        [name, amount, recurrence, normStartDate, normEndDate, normDueDate, isPaidValue, normPaidDate, req.params.id, req.user.id]
      );
      if (!result.affectedRows) {
        return res.status(404).json({ error: 'Fixed due not found' });
      }

      // Verify the update by reading it back
      const [verifyRows] = await pool.execute('SELECT is_paid, due_date FROM fixed_dues WHERE id = ?', [req.params.id]);
      if (verifyRows.length > 0) {
        console.log(`[Backend] Verified fixed due ${req.params.id} is_paid=${verifyRows[0].is_paid}, due_date=${verifyRows[0].due_date} in database`);
      }

      // If transitioning from paid to unpaid, delete the current period's transaction
      if (prevIsPaid && !isPaidValue) {
        console.log(`[Backend] Paid -> Unpaid transition for ${req.params.id}, deleting current transaction for date ${prevDueDate}`);
        const [deleteResult] = await pool.execute(
          'DELETE FROM transactions WHERE source = ? AND source_id = ? AND date = ?',
          ['fixed-due', req.params.id, prevDueDate]
        );
        if (deleteResult.affectedRows > 0) {
          console.log(`[Backend] Deleted ${deleteResult.affectedRows} transaction(s) for current period`);
          sendEvent(req.user.id, { entity: 'transactions', action: 'delete', id: req.params.id }); // Approximate, since multiple possible
        }
      }

      // Delete existing future transactions (date > previous due_date) to avoid duplicates
      const today = new Date().toISOString().split('T')[0];
      await pool.execute(
        'DELETE FROM transactions WHERE source = ? AND source_id = ? AND date > ?',
        ['fixed-due', req.params.id, prevDueDate]
      );

      // Generate new future transactions starting from the next due date after previous due_date
      // Skip current period if unpaid; always start from next for consistency
      let nextDueDate = getNextDueDate(prevDueDate, recurrence);
      let currentDate = new Date(nextDueDate);
      for (let i = 0; i < 12; i++) {
        const transDate = currentDate.toISOString().split('T')[0];
        // Only generate if future date (not recreating current)
        if (transDate > today) {
          const transId = uuidv4();
          const last_modified = Date.now();
          await pool.execute(
            'INSERT INTO transactions (id, user_id, type, description, amount, category, date, source, source_id, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [transId, req.user.id, 'expense', `Fixed due: ${name}`, amount, name, transDate, 'fixed-due', req.params.id, last_modified]
          );
          sendEvent(req.user.id, { entity: 'transactions', action: 'insert', id: transId });
        }
        currentDate = new Date(getNextDueDate(transDate, recurrence));
      }

      // Don't auto-mark as paid on update - respect the explicit is_paid value from the client
      // The is_paid value is already set in the UPDATE query above
      // This allows users to manually mark items as unpaid even if due date has passed

      sendEvent(req.user.id, { entity: 'fixed_dues', action: 'update', id: req.params.id });
      res.json({ message: 'Fixed due updated' });
    } catch (error) {
      console.error('Error updating fixed due:', error);
      console.error('[Backend] Error message:', error.message);
      console.error('[Backend] Error code:', error.code);
      console.error('[Backend] SQL state:', error.sqlState);
      res.status(500).json({ error: 'Failed to update fixed due', details: error.message });
    }
  })
);

app.delete(
  '/api/fixed-dues/:id',
  withAuth(async (req, res) => {
    try {
      const [result] = await pool.execute('DELETE FROM fixed_dues WHERE id = ? AND user_id = ?', [
        req.params.id,
        req.user.id,
      ]);
      if (!result.affectedRows) {
        return res.status(404).json({ error: 'Fixed due not found' });
      }
      sendEvent(req.user.id, { entity: 'fixed_dues', action: 'delete', id: req.params.id });
      res.json({ message: 'Fixed due deleted' });
    } catch (error) {
      console.error('Error deleting fixed due:', error);
      res.status(500).json({ error: 'Failed to delete fixed due' });
    }
  })
);

// Vibes salary routes
app.get(
  '/api/vibes-salary',
  withAuth(async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM vibes_salary WHERE user_id = ?', [req.user.id]);
      res.json(rows[0] || null);
    } catch (error) {
      console.error('Error fetching vibes salary:', error);
      res.status(500).json({ error: 'Failed to fetch vibes salary' });
    }
  })
);

app.post(
  '/api/vibes-salary',
  withAuth(async (req, res) => {
    try {
      const { expected_amount, payments } = req.body;
      const id = req.body.id || uuidv4();
      await pool.execute(
        'INSERT INTO vibes_salary (id, user_id, expected_amount, payments) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE expected_amount = VALUES(expected_amount), payments = VALUES(payments)',
        [id, req.user.id, expected_amount || 0, JSON.stringify(payments || [])]
      );
      sendEvent(req.user.id, { entity: 'vibes_salary', action: 'upsert', id });
      res.status(201).json({ id });
    } catch (error) {
      console.error('Error creating vibes salary:', error);
      res.status(500).json({ error: 'Failed to save vibes salary' });
    }
  })
);

app.put(
  '/api/vibes-salary',
  withAuth(async (req, res) => {
    try {
      const { expected_amount, payments } = req.body;
      const [result] = await pool.execute(
        'UPDATE vibes_salary SET expected_amount = ?, payments = ? WHERE user_id = ?',
        [expected_amount || 0, JSON.stringify(payments || []), req.user.id]
      );
      if (!result.affectedRows) {
        return res.status(404).json({ error: 'Vibes salary not found' });
      }
      sendEvent(req.user.id, { entity: 'vibes_salary', action: 'update' });
      res.json({ message: 'Vibes salary updated' });
    } catch (error) {
      console.error('Error updating vibes salary:', error);
      res.status(500).json({ error: 'Failed to update vibes salary' });
    }
  })
);

// Bullion holdings routes
app.get(
  '/api/bullion-holdings',
  withAuth(async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM bullion_holdings WHERE user_id = ?', [req.user.id]);
      res.json(rows[0] || null);
    } catch (error) {
      console.error('Error fetching bullion holdings:', error);
      res.status(500).json({ error: 'Failed to fetch bullion holdings' });
    }
  })
);

app.post(
  '/api/bullion-holdings',
  withAuth(async (req, res) => {
    try {
      const { gold, silver, platinum, palladium } = req.body;
      const id = req.body.id || uuidv4();
      await pool.execute(
        'INSERT INTO bullion_holdings (id, user_id, gold, silver, platinum, palladium) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE gold = VALUES(gold), silver = VALUES(silver), platinum = VALUES(platinum), palladium = VALUES(palladium)',
        [id, req.user.id, gold || 0, silver || 0, platinum || 0, palladium || 0]
      );
      sendEvent(req.user.id, { entity: 'bullion_holdings', action: 'upsert', id });
      res.status(201).json({ id });
    } catch (error) {
      console.error('Error saving bullion holdings:', error);
      res.status(500).json({ error: 'Failed to save bullion holdings' });
    }
  })
);

app.put(
  '/api/bullion-holdings',
  withAuth(async (req, res) => {
    try {
      const { gold, silver, platinum, palladium } = req.body;
      const [result] = await pool.execute(
        'UPDATE bullion_holdings SET gold = ?, silver = ?, platinum = ?, palladium = ? WHERE user_id = ?',
        [gold || 0, silver || 0, platinum || 0, palladium || 0, req.user.id]
      );
      if (!result.affectedRows) {
        return res.status(404).json({ error: 'Bullion holdings not found' });
      }
      sendEvent(req.user.id, { entity: 'bullion_holdings', action: 'update' });
      res.json({ message: 'Bullion holdings updated' });
    } catch (error) {
      console.error('Error updating bullion holdings:', error);
      res.status(500).json({ error: 'Failed to update bullion holdings' });
    }
  })
);

// Money holdings routes
app.get(
  '/api/money-holdings',
  withAuth(async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM money_holdings WHERE user_id = ?', [req.user.id]);
      res.json(rows[0] || null);
    } catch (error) {
      console.error('Error fetching money holdings:', error);
      res.status(500).json({ error: 'Failed to fetch money holdings' });
    }
  })
);

app.post(
  '/api/money-holdings',
  withAuth(async (req, res) => {
    try {
      const { holdings, bill_counts } = req.body;
      const id = req.body.id || uuidv4();
      const last_modified = Date.now();
      await pool.execute(
        'INSERT INTO money_holdings (id, user_id, holdings, bill_counts, last_modified) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE holdings = VALUES(holdings), bill_counts = VALUES(bill_counts), last_modified = VALUES(last_modified)',
        [id, req.user.id, JSON.stringify(holdings || {}), JSON.stringify(bill_counts || {}), last_modified]
      );
      sendEvent(req.user.id, { entity: 'money_holdings', action: 'upsert', id });
      res.status(201).json({ id, last_modified });
    } catch (error) {
      console.error('Error saving money holdings:', error);
      res.status(500).json({ error: 'Failed to save money holdings' });
    }
  })
);

app.put(
  '/api/money-holdings',
  withAuth(async (req, res) => {
    try {
      const { holdings, bill_counts } = req.body;
      const last_modified = Date.now();
      const [result] = await pool.execute(
        'UPDATE money_holdings SET holdings = ?, bill_counts = ?, last_modified = ? WHERE user_id = ?',
        [JSON.stringify(holdings || {}), JSON.stringify(bill_counts || {}), last_modified, req.user.id]
      );
      if (!result.affectedRows) {
        return res.status(404).json({ error: 'Money holdings not found' });
      }
      sendEvent(req.user.id, { entity: 'money_holdings', action: 'update' });
      res.json({ message: 'Money holdings updated', last_modified });
    } catch (error) {
      console.error('Error updating money holdings:', error);
      res.status(500).json({ error: 'Failed to update money holdings' });
    }
  })
);

// User settings routes
app.get(
  '/api/user-settings',
  withAuth(async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
      res.json(rows[0] || { theme: 'light' });
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  })
);

app.post(
  '/api/user-settings',
  withAuth(async (req, res) => {
    try {
      const { theme } = req.body;
      const last_modified = Date.now();
      await pool.execute(
        'INSERT INTO user_settings (user_id, theme, last_modified) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE theme = VALUES(theme), last_modified = VALUES(last_modified)',
        [req.user.id, theme || 'light', last_modified]
      );
      sendEvent(req.user.id, { entity: 'user_settings', action: 'upsert', id: req.user.id });
      res.status(201).json({ success: true, last_modified });
    } catch (error) {
      console.error('Error saving user settings:', error);
      res.status(500).json({ error: 'Failed to save user settings' });
    }
  })
);

// Test items routes
app.get(
  '/api/test-items',
  withAuth(async (req, res) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM test_items WHERE user_id = ? ORDER BY last_modified DESC',
        [req.user.id]
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching test items:', error);
      res.status(500).json({ error: 'Failed to fetch test items' });
    }
  })
);

app.post(
  '/api/test-items',
  withAuth(async (req, res) => {
    try {
      const { name, description, date, deleted } = req.body;
      const id = req.body.id || uuidv4();
      const last_modified = Date.now();
      await pool.execute(
        'INSERT INTO test_items (id, user_id, name, description, date, last_modified, deleted) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, req.user.id, name, description || '', date, last_modified, !!deleted]
      );
      sendEvent(req.user.id, { entity: 'test_items', action: 'insert', id });
      res.status(201).json({ id, last_modified });
    } catch (error) {
      console.error('Error creating test item:', error);
      res.status(500).json({ error: 'Failed to create test item' });
    }
  })
);

app.put(
  '/api/test-items/:id',
  withAuth(async (req, res) => {
    try {
      const { name, description, date, deleted } = req.body;
      const last_modified = Date.now();
      const [result] = await pool.execute(
        'UPDATE test_items SET name = ?, description = ?, date = ?, deleted = ?, last_modified = ? WHERE id = ? AND user_id = ?',
        [name, description || '', date, !!deleted, last_modified, req.params.id, req.user.id]
      );
      if (!result.affectedRows) {
        return res.status(404).json({ error: 'Test item not found' });
      }
      sendEvent(req.user.id, { entity: 'test_items', action: 'update', id: req.params.id });
      res.json({ id: req.params.id, last_modified });
    } catch (error) {
      console.error('Error updating test item:', error);
      res.status(500).json({ error: 'Failed to update test item' });
    }
  })
);

app.delete(
  '/api/test-items/:id',
  withAuth(async (req, res) => {
    try {
      const last_modified = Date.now();
      const [result] = await pool.execute(
        'UPDATE test_items SET deleted = TRUE, last_modified = ? WHERE id = ? AND user_id = ?',
        [last_modified, req.params.id, req.user.id]
      );
      if (!result.affectedRows) {
        return res.status(404).json({ error: 'Test item not found' });
      }
      sendEvent(req.user.id, { entity: 'test_items', action: 'delete', id: req.params.id });
      res.json({ message: 'Test item deleted successfully' });
    } catch (error) {
      console.error('Error deleting test item:', error);
      res.status(500).json({ error: 'Failed to delete test item' });
    }
  })
);

// Schedule daily fixed dues processing at midnight
cron.schedule('0 0 * * *', processFixedDues);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
