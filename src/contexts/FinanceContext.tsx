import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/dexie';
import { dexieSync } from '../lib/dexiesync';
import { API_BASE_URL } from '../lib/apiClient';
import { format } from 'date-fns';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
  source?: 'transaction' | 'fixed-due' | 'vibes-salary' | 'salary';
  source_id?: string;
}

export interface FixedDue {
  id: string;
  name: string;
  amount: number;
  recurrence:
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'annually';
  startDate: string;
  endDate: string;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
}

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  lastGeneratedDate?: string;
  nextDueDate: string;
  active: boolean;
}

export interface CreateFixedDue extends Omit<FixedDue, 'id' | 'dueDate'> { }

export interface VibesSalary {
  expectedAmount: number;
  startDate?: string;
  monthlyExpectedAmounts?: Record<string, number>; // YYYY-MM -> amount
  payments: {
    id: string;
    amount: number;
    date: string;
    notes?: string;
  }[];
}

export interface Salary {
  expectedAmount: number;
  startDate?: string;
  monthlyExpectedAmounts?: Record<string, number>; // YYYY-MM -> amount
  payments: {
    id: string;
    amount: number;
    date: string;
    notes?: string;
  }[];
}

export interface BullionItem {
  id: string;
  type: string;
  form: string;
  quantity: number;
  amount: number; // Total weight
  weightPerUnit: number;
  unit: string;
  purity: string;
  pureOunces: number;
  coinType?: string;
}

export type BullionHoldings = BullionItem[];

export interface BullionHistoryPoint {
  timestamp: number;
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
}

export interface MoneyHoldings {
  holdings: Record<string, number>;
  billCounts: Record<string, Record<number, number>>;
  activeCurrencies: string[];
  currencyData?: Array<{
    code: string;
    name: string;
    symbol: string;
    denominations: number[];
    exchangeRateToUsd: number;
  }>;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  historyStartDate?: number;
}



interface FinanceContextType {
  transactions: Transaction[];
  fixedDues: FixedDue[];
  vibesSalary: VibesSalary;
  bullionHoldings: BullionHoldings;
  moneyHoldings: MoneyHoldings;
  userSettings: UserSettings;
  recurringTransactions: RecurringTransaction[];

  addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id'>) => Promise<void>;
  updateRecurringTransaction: (id: string, transaction: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (
    id: string,
    transaction: Partial<Transaction>
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteAllTransactions: () => Promise<void>;
  addFixedDue: (due: CreateFixedDue) => Promise<void>;
  updateFixedDue: (id: string, due: Partial<FixedDue>) => Promise<void>;
  deleteFixedDue: (id: string) => Promise<void>;
  deleteAllFixedDues: () => Promise<void>;
  updateVibesSalary: (salary: Partial<VibesSalary>) => Promise<void>;
  addVibesSalaryPayment: (
    payment: Omit<VibesSalary['payments'][0], 'id'>
  ) => Promise<void>;
  updateVibesSalaryPayment: (
    paymentId: string,
    payment: Partial<VibesSalary['payments'][0]>
  ) => Promise<void>;
  deleteVibesSalaryPayment: (paymentId: string) => Promise<void>;
  syncSalaryToTransactions: (updatedSalary?: VibesSalary) => Promise<number>;
  salary: Salary;
  updateSalary: (salary: Partial<Salary>) => Promise<void>;
  addSalaryPayment: (
    payment: Omit<Salary['payments'][0], 'id'>
  ) => Promise<void>;
  updateSalaryPayment: (
    paymentId: string,
    payment: Partial<Salary['payments'][0]>
  ) => Promise<void>;
  deleteSalaryPayment: (paymentId: string) => Promise<void>;
  syncGeneralSalaryToTransactions: (updatedSalary?: Salary) => Promise<number>;
  updateBullionHoldings: (
    holdings: BullionHoldings
  ) => Promise<{ success: boolean; error?: string }>;
  updateMoneyHoldings: (
    holdings: MoneyHoldings
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserSettings: (
    settings: Partial<UserSettings>
  ) => Promise<{ success: boolean; error?: string }>;

  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getTotalBalance: () => number;
  syncData: (force?: boolean) => Promise<void>;
  bullionPrices: Record<string, number>;
  bullionHistory: BullionHistoryPoint[];
  refreshBullionPrices: () => Promise<void>;
  setBullionRefreshInterval: (ms: number) => void;
  getHistoryLogs: (entityId?: string, entityType?: string) => Promise<any[]>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }): ReactNode {
  const { user, token } = useAuth();

  const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedDues, setFixedDues] = useState<FixedDue[]>([]);
  const [vibesSalary, setVibesSalary] = useState<VibesSalary>({
    expectedAmount: 0,
    payments: [],
  });
  const [salary, setSalary] = useState<Salary>({
    expectedAmount: 0,
    payments: [],
  });
  const [bullionHoldings, setBullionHoldings] = useState<BullionHoldings>([]);
  const [moneyHoldings, setMoneyHoldings] = useState<MoneyHoldings>({
    holdings: {},
    billCounts: {},
    activeCurrencies: [],
  });
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: 'light',
    historyStartDate: 0,
  });
  const [bullionPrices, setBullionPrices] = useState<Record<string, number>>({
    gold: 2050,
    silver: 25.5,
    platinum: 980,
    palladium: 1420,
  });
  const [bullionHistory, setBullionHistory] = useState<BullionHistoryPoint[]>([]);
  const [bullionRefreshInterval, setBullionRefreshInterval] = useState(60 * 1000);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [userIp, setUserIp] = useState<string>('');

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIp(data.ip);
      } catch (error) {
        console.warn('[FinanceContext] Failed to fetch IP address:', error);
      }
    };
    fetchIp();
  }, []);

  const addHistoryLog = async (params: {
    entity_id: string;
    entity_type: 'transaction' | 'fixed-due' | 'vibes-salary' | 'salary' | 'bullion-holdings' | 'money-holdings';
    action: 'add' | 'update' | 'delete';
    before?: any;
    after?: any;
  }) => {
    if (!user) return;
    const logId = generateId();
    await db.history_logs.add({
      id: logId,
      user_id: user.uid,
      entity_id: params.entity_id,
      entity_type: params.entity_type,
      action: params.action,
      before: params.before ? JSON.stringify(params.before) : undefined,
      after: params.after ? JSON.stringify(params.after) : undefined,
      timestamp: Date.now(),
      ip_address: userIp,
      dirty: 1,
      synced: 0,
    });
    // We don't force sync here to avoid excessive network calls, 
    // it will be synced with the main entity change or the next sync cycle.
  };

  const getHistoryLogs = async (entityId?: string, entityType?: string) => {
    if (!user) return [];

    // Using simple approach: get all and then filter
    let allLogs = await db.history_logs.where('user_id').equals(user.uid).toArray();

    if (entityId) {
      allLogs = allLogs.filter(log => log.entity_id === entityId);
    }

    if (entityType) {
      allLogs = allLogs.filter(log => log.entity_type === entityType);
    }

    const startDate = userSettings.historyStartDate || 0;
    return allLogs
      .filter(log => log.timestamp >= startDate)
      .sort((a, b) => b.timestamp - a.timestamp);
  };


  const addRecurringTransaction = async (transaction: Omit<RecurringTransaction, 'id'>) => {
    if (!user) return;
    const id = generateId();
    await db.recurring_transactions.add({
      id,
      user_id: user.uid,
      ...transaction,
      type: transaction.type,
      frequency: transaction.frequency,
      start_date: transaction.startDate,
      next_due_date: transaction.nextDueDate,
      active: 1,
      synced: 0,
      dirty: 1,
      last_modified: Date.now()
    } as any);
    setRecurringTransactions(prev => [...prev, { ...transaction, id, active: true }]);
    try { await syncData(true); } catch (e) { console.warn(e) }
  };

  const updateRecurringTransaction = async (id: string, transaction: Partial<RecurringTransaction>) => {
    if (!user) return;
    const updateData: any = { dirty: 1, synced: 0, last_modified: Date.now() };
    if (transaction.active !== undefined) updateData.active = transaction.active ? 1 : 0;
    if (transaction.nextDueDate) updateData.next_due_date = transaction.nextDueDate;
    if (transaction.lastGeneratedDate) updateData.last_generated_date = transaction.lastGeneratedDate;
    if (transaction.startDate) updateData.start_date = transaction.startDate;

    await db.recurring_transactions.update(id, updateData);
    setRecurringTransactions(prev => prev.map(r => r.id === id ? { ...r, ...transaction } : r));
    try { await syncData(true); } catch (e) { console.warn(e) }
  };

  const deleteRecurringTransaction = async (id: string) => {
    if (!user) return;
    await db.recurring_transactions.update(id, { deleted: 1, dirty: 1, last_modified: Date.now() });
    setRecurringTransactions(prev => prev.filter(r => r.id !== id));
    try { await syncData(true); } catch (e) { console.warn(e) }
  };

  // Sync lock to prevent multiple simultaneous syncs
  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);
  const SYNC_COOLDOWN = 2000; // Minimum 2 seconds between syncs

  // Ref to track latest fixedDues state to avoid stale closures in loadLocalData
  const fixedDuesRef = useRef<FixedDue[]>([]);
  useEffect(() => {
    fixedDuesRef.current = fixedDues;
  }, [fixedDues]);

  // Track recently updated fixed dues to prevent loadLocalData from overwriting them
  const recentlyUpdatedDuesRef = useRef<Map<string, { isPaid: boolean; timestamp: number; fullData?: FixedDue }>>(new Map());
  const RECENT_UPDATE_WINDOW = 60000; // 60 seconds - don't overwrite updates within this window
  const isUpdatingRef = useRef<Set<string>>(new Set()); // Track which dues are currently being updated

  // Load data from Dexie (filtered by user_id)
  const loadLocalData = async () => {
    if (!user) {
      // Guest mode: load from localStorage
      const localTransactions = localStorage.getItem('guestTransactions');
      if (localTransactions) {
        setTransactions(JSON.parse(localTransactions));
      }
      const localFixedDues = localStorage.getItem('guestFixedDues');
      if (localFixedDues) {
        setFixedDues(JSON.parse(localFixedDues));
      }
      const localVibesSalary = localStorage.getItem('guestVibesSalary');
      if (localVibesSalary) {
        setVibesSalary(JSON.parse(localVibesSalary));
      }
      const localSalary = localStorage.getItem('guestSalary');
      if (localSalary) {
        setSalary(JSON.parse(localSalary));
      }
      const localHoldings = localStorage.getItem('bullionHoldings');
      if (localHoldings) {
        setBullionHoldings(JSON.parse(localHoldings));
      }
      const localMoneyHoldings = localStorage.getItem('moneyHoldings');
      if (localMoneyHoldings) {
        setMoneyHoldings(JSON.parse(localMoneyHoldings));
      }
      const localUserSettings = localStorage.getItem('userSettings');
      if (localUserSettings) {
        setUserSettings(JSON.parse(localUserSettings));
      }
      return;
    }

    try {
      console.log('[FinanceContext] loadLocalData for user:', user?.uid);
      if (!user?.uid) {
        console.error('[FinanceContext] loadLocalData: user.uid is missing!', user);
        return;
      }

      const [trans, dues, vibesSalaryData, salaryData, holdings, money, settings, recurring] = await Promise.all([
        db.transactions.where('user_id').equals(user.uid).toArray(),
        db.fixed_dues.where('user_id').equals(user.uid).toArray(),
        db.vibes_salary.where('user_id').equals(user.uid).first(),
        db.salary.where('user_id').equals(user.uid).first(),
        db.bullion_holdings.where('user_id').equals(user.uid).first(),
        db.money_holdings.where('user_id').equals(user.uid).first(),
        db.user_settings.where('user_id').equals(user.uid).first(),
        db.recurring_transactions.where('user_id').equals(user.uid).toArray(),
      ]);

      setTransactions(trans.filter(t => !Boolean(t.deleted)).map(t => ({
        id: t.id,
        type: t.type as 'income' | 'expense',
        description: t.description || '',
        amount: t.amount || 0,
        category: t.category || '',
        date: t.date || '',
        source: t.source as 'transaction' | 'fixed-due' | 'vibes-salary' | 'salary',
        source_id: t.source_id,
      })));

      // Filter out deleted records (deleted can be boolean or number 0/1)
      const activeDues = dues.filter(d => {
        const deleted = Boolean(d.deleted);
        return !deleted;
      });

      console.log(`[loadLocalData] Loading ${activeDues.length} fixed dues from database (total: ${dues.length}, deleted: ${dues.length - activeDues.length})`);

      // Get current state to preserve dirty local changes
      // Use ref to get the latest state value (avoids stale closure)
      const currentState = fixedDuesRef.current;
      const dirtyDueIds = new Set(
        activeDues
          .filter(d => Boolean(d.dirty))
          .map(d => d.id)
      );

      const mappedDues = activeDues.map(d => {
        // If this due is dirty (has unsent local changes) OR was recently updated, preserve the state value
        // This prevents loadLocalData from overwriting local changes with stale server data
        const recentUpdate = recentlyUpdatedDuesRef.current.get(d.id);
        const isRecentlyUpdated = recentUpdate && (Date.now() - recentUpdate.timestamp) < RECENT_UPDATE_WINDOW;
        const isCurrentlyUpdating = isUpdatingRef.current.has(d.id);

        if (dirtyDueIds.has(d.id) || isRecentlyUpdated || isCurrentlyUpdating) {
          const currentDue = currentState.find(cd => cd.id === d.id);
          if (currentDue) {
            // ALWAYS use the current state's FULL data for dirty or recently updated records
            // This ensures user's recent changes are never overwritten, including all fields
            const reason = isCurrentlyUpdating ? 'currently updating' : (dirtyDueIds.has(d.id) ? 'dirty' : 'recently updated');
            console.log(`[loadLocalData] Preserving local ${reason} change for ${d.id}: using full state data`);

            let preservedDueDate = currentDue.dueDate || '';
            if (currentDue.recurrence === 'monthly' && preservedDueDate) {
              const due = new Date(preservedDueDate);
              const year = due.getFullYear();
              const month = due.getMonth();
              const lastDay = new Date(year, month + 1, 0).getDate();
              preservedDueDate = new Date(year, month, lastDay).toISOString().split('T')[0];
            }

            // Use the full current state data - this preserves name, amount, dates, etc.
            return {
              id: currentDue.id,
              name: currentDue.name || '',
              amount: currentDue.amount || 0,
              recurrence: currentDue.recurrence || 'monthly' as FixedDue['recurrence'],
              startDate: currentDue.startDate || '',
              endDate: currentDue.endDate || '',
              dueDate: preservedDueDate,
              isPaid: Boolean(currentDue.isPaid),
              paidDate: currentDue.paidDate,
            };
          } else if (isRecentlyUpdated && recentUpdate && recentUpdate.fullData) {
            // Use the tracked recent update full data if state doesn't have it yet
            console.log(`[loadLocalData] Using recent update full data for ${d.id}`);
            return recentUpdate.fullData;
          } else {
            console.warn(`[loadLocalData] Dirty/recent record ${d.id} not found in current state, using db value`);
          }
        }

        // Clean up old recent updates (older than window)
        if (recentUpdate && (Date.now() - recentUpdate.timestamp) >= RECENT_UPDATE_WINDOW) {
          recentlyUpdatedDuesRef.current.delete(d.id);
        }

        // Properly convert is_paid from database (can be boolean, number 0/1, or string '0'/'1')
        // Check both is_paid and isPaid fields, defaulting to false if not explicitly true
        // This ensures we handle null, undefined, 0, '0', false correctly
        let isPaidValue = false;
        if (d.is_paid !== undefined && d.is_paid !== null) {
          isPaidValue = Boolean(d.is_paid);
        } else if (d.isPaid !== undefined && d.isPaid !== null) {
          isPaidValue = Boolean(d.isPaid);
        }
        // If both are undefined/null, isPaidValue remains false (default)

        // Ensure all required fields have values - log if any are missing
        if (!d.name || d.amount === undefined || d.amount === null || !d.due_date) {
          console.warn(`[loadLocalData] Fixed due ${d.id} has missing fields:`, {
            name: d.name,
            amount: d.amount,
            due_date: d.due_date,
            is_paid: d.is_paid,
          });
        }

        let dueDateValue = d.due_date || '';
        if (d.recurrence === 'monthly' && dueDateValue) {
          const [yearStr, monthStr] = dueDateValue.split('-').slice(0, 2);
          const year = parseInt(yearStr, 10);
          const month = parseInt(monthStr, 10) - 1;
          const lastDay = new Date(year, month + 1, 0).getDate();
          dueDateValue = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
        }

        return {
          id: d.id,
          name: d.name || '',
          amount: d.amount || 0,
          recurrence: (d.recurrence || 'monthly') as FixedDue['recurrence'],
          startDate: d.start_date || '',
          endDate: d.end_date || '',
          dueDate: dueDateValue,
          isPaid: isPaidValue, // Always a boolean true or false
          paidDate: d.paid_date,
        };
      });

      console.log(`[loadLocalData] Mapped ${mappedDues.length} fixed dues to UI format (${dirtyDueIds.size} dirty)`);
      if (mappedDues.length > 0) {
        console.log(`[loadLocalData] Sample fixed due:`, JSON.stringify(mappedDues[0], null, 2));
      }

      setFixedDues(mappedDues);
      console.log(`[loadLocalData] State updated with ${mappedDues.length} fixed dues`);

      if (vibesSalaryData && !Boolean(vibesSalaryData.deleted)) {
        setVibesSalary({
          expectedAmount: vibesSalaryData.expected_amount || 0,
          startDate: vibesSalaryData.start_date || '2023-05-01',
          monthlyExpectedAmounts: vibesSalaryData.monthly_expected_amounts || {},
          payments: vibesSalaryData.payments || [],
        });
      }

      if (salaryData && !Boolean(salaryData.deleted)) {
        setSalary({
          expectedAmount: salaryData.expected_amount || 0,
          startDate: salaryData.start_date || '2023-05-01',
          monthlyExpectedAmounts: salaryData.monthly_expected_amounts || {},
          payments: salaryData.payments || [],
        });
      }

      if (holdings && !Boolean(holdings.deleted)) {
        if (holdings.items) {
          try {
            const rawItems = JSON.parse(holdings.items);
            // Migrate legacy bullion items if needed
            const migratedItems = rawItems.map((item: any) => ({
              ...item,
              quantity: item.quantity !== undefined ? item.quantity : 1,
              weightPerUnit: item.weightPerUnit !== undefined ? item.weightPerUnit : item.amount,
              amount: item.amount !== undefined ? item.amount : 0,
            }));
            setBullionHoldings(migratedItems);
            // Load bullion history from Dexie (last 7 days @ 1-min intervals = 10080 points)
            const history = await db.bullion_history.orderBy('timestamp').reverse().limit(10080).toArray();
            setBullionHistory(history.reverse());
          } catch (e) {
            console.error('Error parsing bullion items or loading history:', e);
            setBullionHoldings([]);
          }
        } else {
          // Legacy fallback
          setBullionHoldings([
            { id: 'gold', type: 'Gold', form: 'Bar', quantity: 1, amount: holdings.gold || 0, weightPerUnit: holdings.gold || 0, unit: 'oz', purity: '24', pureOunces: holdings.gold || 0 },
            { id: 'silver', type: 'Silver', form: 'Bar', quantity: 1, amount: holdings.silver || 0, weightPerUnit: holdings.silver || 0, unit: 'oz', purity: '24', pureOunces: holdings.silver || 0 },
            { id: 'platinum', type: 'Platinum', form: 'Bar', quantity: 1, amount: holdings.platinum || 0, weightPerUnit: holdings.platinum || 0, unit: 'oz', purity: '24', pureOunces: holdings.platinum || 0 },
            { id: 'palladium', type: 'Palladium', form: 'Bar', quantity: 1, amount: holdings.palladium || 0, weightPerUnit: holdings.palladium || 0, unit: 'oz', purity: '24', pureOunces: holdings.palladium || 0 },
          ]);
        }
      }

      // Load money holdings
      if (money && !Boolean(money.deleted)) {
        const validHoldings = JSON.parse(money.holdings || '{}');
        const validBillCounts = JSON.parse(money.bill_counts || '{}');
        const validActiveCurrencies = JSON.parse(money.active_currencies || '[]');
        const validCurrencyData = money.currency_data ? JSON.parse(money.currency_data) : undefined;
        setMoneyHoldings({
          holdings: validHoldings || {},
          billCounts: validBillCounts || {},
          activeCurrencies: Array.isArray(validActiveCurrencies) ? validActiveCurrencies : [],
          currencyData: validCurrencyData,
        });
      }

      if (settings && !Boolean(settings.deleted)) {
        setUserSettings({
          theme: (settings.theme as 'light' | 'dark' | 'system') || 'light',
        });
        // Apply theme immediately
        const isDark = settings.theme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('dark', isDark);
      }

      setRecurringTransactions(recurring.filter(r => !Boolean(r.deleted)).map(r => ({
        id: r.id,
        type: r.type as 'income' | 'expense',
        description: r.description,
        amount: r.amount,
        category: r.category,
        frequency: r.frequency as RecurringTransaction['frequency'],
        startDate: r.start_date,
        lastGeneratedDate: r.last_generated_date,
        nextDueDate: r.next_due_date,
        active: Boolean(r.active),
      })));

      // Check for due recurring transactions to generate logic
      const activeRecurring = recurring.filter(r => !Boolean(r.deleted) && Boolean(r.active));
      const today = new Date().toISOString().split('T')[0];
      let generatedCount = 0;

      for (const r of activeRecurring) {
        if (r.next_due_date <= today) {
          // Time to generate!
          console.log(`[FinanceContext] Generating recurring transaction for ${r.description} due on ${r.next_due_date}`);

          const newTxnId = generateId();
          await db.transactions.add({
            id: newTxnId,
            user_id: user.uid,
            type: r.type,
            description: r.description,
            amount: r.amount,
            category: r.category,
            date: r.next_due_date, // Transaction date is the due date
            source: 'transaction', // Simple transaction from recurring
            synced: 0,
            dirty: 1,
            last_modified: Date.now(),
          });

          // Calculate next due date
          const currentDueDate = new Date(r.next_due_date);
          let nextDate = new Date(currentDueDate);
          switch (r.frequency) {
            case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
            case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
            case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
            case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
          }
          const nextDueDateStr = nextDate.toISOString().split('T')[0];

          await db.recurring_transactions.update(r.id, {
            last_generated_date: r.next_due_date,
            next_due_date: nextDueDateStr,
            dirty: 1,
            synced: 0,
            last_modified: Date.now()
          });
          generatedCount++;
        }
      }

      if (generatedCount > 0) {
        // Reload if we generated stuff
        // Actually, we should just call loadLocalData again or update state manually to avoid loop
        // But strict loop protection inside effect prevents easy recursion.
        // Let's just log for now and maybe trigger a soft refresh?
        // Simplest is to just let the user see it on next load or refresh, but better to update state now.
        // We can't easily call loadLocalData recursively here safely. 
        // However, since we define trans/recurring above, we can just append to them?
        // Too complex. Let's rely on standard state updates if we can.
        console.log(`[FinanceContext] generated ${generatedCount} recurring transactions.`);
      }


    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadLocalData();

    if (!user || !token) {
      return;
    }



    const refreshFromRemote = async () => {
      try {
        if (!navigator.onLine) return;

        // Prevent multiple simultaneous syncs if one is already adding to queue
        if (isSyncingRef.current) return;

        console.log('[FinanceContext] Real-time update detected, syncing...');
        // We use syncData(true) (full sync) to ensure consistency
        await syncData(true);
      } catch (error) {
        console.error('[FinanceContext] Auto-sync error:', error);
      }
    };

    // Initialize Real-Time Listener
    let unsubscribe = () => { };
    if (user && user.uid) {
      console.log('[FinanceContext] Subscribing to real-time changes...');
      unsubscribe = dexieSync.subscribeToChanges(user.uid, refreshFromRemote);
    }

    // Initial sync on mount
    refreshFromRemote();

    return () => {
      unsubscribe();
    };

  }, [user, token]);

  const addTransaction = async (
    transaction: Omit<Transaction, 'id'>
  ): Promise<void> => {
    if (!user) {
      // Guest mode
      const newTransaction: Transaction = {
        ...transaction,
        id: generateId(),
      };
      setTransactions((prev) => {
        const updated = [newTransaction, ...prev];
        localStorage.setItem('guestTransactions', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    const id = generateId();
    await db.transactions.add({
      id,
      user_id: user.uid,
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      source: transaction.source,
      source_id: transaction.source_id ?? null,
      synced: 0,
      dirty: 1,
      last_modified: Date.now(),
    });

    await addHistoryLog({
      entity_id: id,
      entity_type: 'transaction',
      action: 'add',
      after: { ...transaction, id },
    });

    setTransactions((prev) => [{ ...transaction, id }, ...prev]);
    // Force immediate sync to ensure new transaction appears on other devices instantly
    try {
      await syncData(true);
    } catch (error: any) {
      // Don't throw auth redirect errors - transaction is saved locally, redirect will happen
      if (error?.isAuthRedirect) {
        // Auth redirect is happening, transaction is saved locally, will sync after re-login
        // Don't throw - let the calling code know it succeeded locally
        return;
      }
      // Don't throw network errors - transaction is saved locally, will sync when server is back online
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network error') || errorMsg.includes('CONNECTION_REFUSED') || errorMsg.includes('Failed to fetch')) {
        console.warn('[FinanceContext] Network error during sync, transaction saved locally:', errorMsg);
        return;
      }
      // Re-throw other errors
      throw error;
    }
  };

  const updateTransaction = async (
    id: string,
    transaction: Partial<Transaction>
  ) => {
    if (!user) {
      // Guest mode
      setTransactions((prev) => {
        const updated = prev.map((t) =>
          t.id === id ? { ...t, ...transaction } : t
        );
        localStorage.setItem('guestTransactions', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    const oldTxn = transactions.find(t => t.id === id);

    await db.transactions.update(id, {
      ...transaction,
      dirty: 1,
      last_modified: Date.now(),
    });

    await addHistoryLog({
      entity_id: id,
      entity_type: 'transaction',
      action: 'update',
      before: oldTxn,
      after: { ...oldTxn, ...transaction },
    });

    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...transaction } : t)));
    // Force immediate sync to ensure transaction update appears on other devices instantly
    try {
      await syncData(true);
    } catch (error: any) {
      // Don't throw auth redirect errors - update is saved locally, redirect will happen
      if (!error?.isAuthRedirect) {
        throw error;
      }
      // Auth redirect is happening, update is saved locally, will sync after re-login
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) {
      // Guest mode
      setTransactions((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        localStorage.setItem('guestTransactions', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    const oldTxn = transactions.find(t => t.id === id);

    // Mark as deleted locally first
    await db.transactions.update(id, { deleted: 1, dirty: 1, last_modified: Date.now() });

    await addHistoryLog({
      entity_id: id,
      entity_type: 'transaction',
      action: 'delete',
      before: oldTxn,
    });

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Force immediate sync to ensure transaction deletion appears on other devices instantly
    try {
      await syncData(true);
    } catch (error: any) {
      // Don't throw auth redirect errors - deletion is saved locally, redirect will happen
      const errorMsg = error?.message || String(error);
      const isAuthError = error?.isAuthRedirect ||
        errorMsg.includes('Invalid or expired token') ||
        errorMsg.includes('Session expired') ||
        error?.status === 401;

      if (isAuthError) {
        // Auth redirect is happening, deletion is saved locally, will sync after re-login
        return;
      }

      // If sync fails, the transaction is already deleted locally
      // Check if it's a network error (will retry later) or a real error
      if (!errorMsg.includes('Network error') && !errorMsg.includes('CONNECTION_REFUSED')) {
        // For non-network errors, re-throw so the UI can show an error
        // The transaction will remain marked as dirty and will retry on next sync
        throw error;
      }
      // Network errors are OK - will sync when connection is restored
    }
  };

  const deleteAllTransactions = async () => {
    if (!user) {
      setTransactions([]);
      localStorage.setItem('guestTransactions', JSON.stringify([]));
      return;
    }

    // Mark all as deleted in Dexie
    const transToDelete = await db.transactions.where('user_id').equals(user.uid).toArray();
    await Promise.all(transToDelete.map(t => db.transactions.update(t.id, { deleted: 1, dirty: 1, last_modified: Date.now() })));
    setTransactions([]);

    // Force immediate sync to ensure deletions appear on other devices instantly
    try {
      await syncData(true);
    } catch (error: any) {
      // Don't throw auth redirect errors - deletions are saved locally, redirect will happen
      if (error?.isAuthRedirect) {
        return; // Auth redirect is happening, deletions are saved locally, will sync after re-login
      }
      // Don't throw network errors - deletions are saved locally, will sync when server is back online
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network error') || errorMsg.includes('CONNECTION_REFUSED') || errorMsg.includes('Failed to fetch')) {
        console.warn('[FinanceContext] Network error during sync, all transaction deletions saved locally:', errorMsg);
        return;
      }
      // Re-throw other errors
      throw error;
    }
  };

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEndOfMonth = (year: number, month: number): string => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  };

  const generateRecurringDates = (
    startDate: string,
    endDate: string,
    recurrence:
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'quarterly'
      | 'semi-annually'
      | 'annually'
  ): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = formatLocalDate(start);
    const endStr = formatLocalDate(end);

    if (startStr > endStr) return [];

    if (recurrence === 'monthly') {
      let year = start.getFullYear();
      let month = start.getMonth();

      let currentDateStr = getEndOfMonth(year, month);

      // If current end of month is before start, move to next month
      if (currentDateStr < startStr) {
        month = (month + 1) % 12;
        if (month === 0) year++;
        currentDateStr = getEndOfMonth(year, month);
      }

      while (currentDateStr <= endStr) {
        dates.push(currentDateStr);

        month = (month + 1) % 12;
        if (month === 0) year++;
        currentDateStr = getEndOfMonth(year, month);
      }
    } else {
      let current = new Date(start);

      while (formatLocalDate(current) <= endStr) {
        dates.push(formatLocalDate(current));

        switch (recurrence) {
          case 'daily':
            current.setDate(current.getDate() + 1);
            break;
          case 'weekly':
            current.setDate(current.getDate() + 7);
            break;
          case 'quarterly':
            current.setMonth(current.getMonth() + 3);
            break;
          case 'semi-annually':
            current.setMonth(current.getMonth() + 6);
            break;
          case 'annually':
            current.setFullYear(current.getFullYear() + 1);
            break;
        }
      }
    }

    return dates;
  };

  const addFixedDue = async (due: Omit<FixedDue, 'id'>) => {
    const recurringDates = generateRecurringDates(
      due.startDate,
      due.endDate,
      due.recurrence
    );

    if (!user) {
      // Guest mode
      const newFixedDues: FixedDue[] = recurringDates.map((date) => ({
        ...due,
        dueDate: date,
        id: generateId(),
      }));
      setFixedDues((prev) => {
        const updated = [...newFixedDues, ...prev];
        localStorage.setItem('guestFixedDues', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    const duesToAdd = recurringDates.map((date) => ({
      id: generateId(),
      user_id: user.uid,
      name: due.name,
      amount: due.amount,
      recurrence: due.recurrence,
      start_date: due.startDate,
      end_date: due.endDate,
      due_date: date,
      // Explicitly convert isPaid to boolean/number for database
      is_paid: due.isPaid ? 1 : 0,
      isPaid: Boolean(due.isPaid),
      paid_date: due.paidDate || null,
      synced: 0,
      dirty: 1,
      last_modified: Date.now(),
    } as any));

    await Promise.all(duesToAdd.map(dueData => db.fixed_dues.add(dueData)));

    for (const dueData of duesToAdd) {
      await addHistoryLog({
        entity_id: dueData.id,
        entity_type: 'fixed-due',
        action: 'add',
        after: {
          id: dueData.id,
          name: dueData.name,
          amount: dueData.amount,
          recurrence: dueData.recurrence,
          startDate: dueData.start_date,
          endDate: dueData.end_date,
          dueDate: dueData.due_date,
          isPaid: Boolean(dueData.is_paid),
          paidDate: dueData.paid_date,
        },
      });
    }

    setFixedDues((prev) => [...duesToAdd.map(d => {
      // Convert is_paid to boolean properly - check is_paid first, fallback to isPaid
      const isPaidValue = d.is_paid !== undefined
        ? Boolean(d.is_paid)
        : Boolean(d.isPaid);

      return {
        id: d.id,
        name: d.name,
        amount: d.amount,
        recurrence: d.recurrence,
        startDate: d.start_date,
        endDate: d.end_date,
        dueDate: d.due_date,
        isPaid: isPaidValue || false,
        paidDate: d.paid_date,
      } as FixedDue;
    }), ...prev]);
    // Force immediate sync to ensure new fixed dues appear on other devices instantly
    await syncData(true);
  };

  const updateFixedDue = async (id: string, due: Partial<FixedDue>) => {
    if (!user) {
      // Guest mode
      setFixedDues((prev) => {
        const updated = prev.map((d) => (d.id === id ? { ...d, ...due } : d));
        localStorage.setItem('guestFixedDues', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    // Mark as updating to prevent loadLocalData from overwriting
    isUpdatingRef.current.add(id);

    // Get existing due from database to preserve fields that aren't being updated
    const existingDue = await db.fixed_dues.get(id);
    if (!existingDue) {
      console.warn(`[updateFixedDue] Fixed due ${id} not found in database`);
      isUpdatingRef.current.delete(id);
      return;
    }

    // Explicitly convert isPaid to boolean - handle all cases including false
    let isPaidBoolean: boolean;
    if (due.isPaid !== undefined) {
      // Convert to boolean: true if it's true, 1, or '1', otherwise false
      isPaidBoolean = Boolean(due.isPaid);
    } else {
      // If not provided, keep existing value from database
      isPaidBoolean = Boolean(existingDue.is_paid) || false;
    }

    // Only update fields that are explicitly provided, preserve all others from existing due
    const updateData: any = {
      dirty: 1,
      last_modified: Date.now(),
    };

    // Only include fields that are actually being updated
    if (due.name !== undefined) updateData.name = due.name;
    else updateData.name = existingDue.name;

    if (due.amount !== undefined) updateData.amount = due.amount;
    else updateData.amount = existingDue.amount;

    if (due.recurrence !== undefined) updateData.recurrence = due.recurrence;
    else updateData.recurrence = existingDue.recurrence;

    if (due.startDate !== undefined) updateData.start_date = due.startDate;
    else updateData.start_date = existingDue.start_date;

    if (due.endDate !== undefined) updateData.end_date = due.endDate;
    else updateData.end_date = existingDue.end_date;

    if (due.dueDate !== undefined) updateData.due_date = due.dueDate;
    else updateData.due_date = existingDue.due_date;

    // Always update isPaid (it's always provided when toggling)
    updateData.is_paid = isPaidBoolean ? 1 : 0;
    updateData.isPaid = isPaidBoolean;

    if (due.paidDate !== undefined) updateData.paid_date = due.paidDate || null;
    else updateData.paid_date = existingDue.paid_date || null;

    // Update database first - ensure this completes before proceeding
    const updateResult = await db.fixed_dues.update(id, updateData);

    // Verify the update succeeded
    if (updateResult === 0) {
      console.warn(`[updateFixedDue] No record found to update for id: ${id}`);
    }

    // Update state immediately with the new values - ensure boolean
    // This ensures UI updates immediately before sync completes
    // Use functional update to ensure we're working with latest state
    // IMPORTANT: Only update fields that were provided, preserve all others
    setFixedDues((prev) => {
      const updated = prev.map((d) => {
        if (d.id === id) {
          const newDue = { ...d }; // Start with existing due to preserve all fields

          // Only update fields that are explicitly provided
          if (due.name !== undefined) newDue.name = due.name;
          if (due.amount !== undefined) newDue.amount = due.amount;
          if (due.recurrence !== undefined) newDue.recurrence = due.recurrence;
          if (due.startDate !== undefined) newDue.startDate = due.startDate;
          if (due.endDate !== undefined) newDue.endDate = due.endDate;
          if (due.dueDate !== undefined) newDue.dueDate = due.dueDate;
          if (due.isPaid !== undefined) {
            // Explicitly set the boolean value - this is critical for unpaid status
            newDue.isPaid = isPaidBoolean;
            console.log(`[updateFixedDue] Updating state for ${id}: isPaid=${isPaidBoolean}, preserving other fields`);
            // Track this update with full data to prevent loadLocalData from overwriting it
            recentlyUpdatedDuesRef.current.set(id, {
              isPaid: isPaidBoolean,
              timestamp: Date.now(),
              fullData: JSON.parse(JSON.stringify(newDue)) // Deep copy to prevent mutation issues
            });
          }
          if (due.paidDate !== undefined) newDue.paidDate = due.paidDate || undefined;

          addHistoryLog({
            entity_id: id,
            entity_type: 'fixed-due',
            action: 'update',
            before: d,
            after: newDue,
          });

          return newDue;
        }
        return d;
      });
      // Update ref immediately so loadLocalData can access it
      fixedDuesRef.current = updated;
      return updated;
    });

    // Clear the updating flag after a delay to allow database write to complete
    setTimeout(() => {
      isUpdatingRef.current.delete(id);
    }, 2000); // 2 seconds should be enough for database write

    // Force sync to ensure changes are sent immediately
    // Add a delay to ensure database write completes and state is fully updated
    // Don't await - let it run in background to avoid blocking UI
    // The state is already updated, so UI will show the change immediately
    // Sync will happen in background and won't overwrite our local state since it's dirty
    setTimeout(() => {
      syncData(true).catch((error) => {
        console.error('[updateFixedDue] Sync error after update:', error);
        // Don't throw - state is already updated, sync will retry later
      });
    }, 1000); // 1 second delay to ensure state and database are fully updated
  };

  const deleteFixedDue = async (id: string) => {
    if (!user) {
      // Guest mode
      setFixedDues((prev) => {
        const updated = prev.filter((d) => d.id !== id);
        localStorage.setItem('guestFixedDues', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    const oldDue = fixedDues.find(d => d.id === id);
    await db.fixed_dues.update(id, { deleted: 1, dirty: 1, last_modified: Date.now() });

    await addHistoryLog({
      entity_id: id,
      entity_type: 'fixed-due',
      action: 'delete',
      before: oldDue,
    });

    setFixedDues((prev) => prev.filter((d) => d.id !== id));
    // Force sync to ensure changes are sent immediately
    // Add a delay to ensure database write completes and state is fully updated
    // Don't await - let it run in background to avoid blocking UI
    // The state is already updated, so UI will show the change immediately
    // Sync will happen in background and won't overwrite our local state since it's dirty
    setTimeout(() => {
      syncData(true).catch((error) => {
        console.error('[deleteFixedDue] Sync error after delete:', error);
        // Don't throw - state is already updated, sync will retry later
      });
    }, 1000); // 1 second delay to ensure state and database are fully updated
  };

  const deleteAllFixedDues = async () => {
    if (!user) {
      // Guest mode
      setFixedDues([]);
      localStorage.setItem('guestFixedDues', JSON.stringify([]));
      return;
    }

    // Mark all as deleted in Dexie
    const duesToDelete = await db.fixed_dues.where('user_id').equals(user.uid).toArray();
    await Promise.all(duesToDelete.map(d => db.fixed_dues.update(d.id, { deleted: 1, dirty: 1, last_modified: Date.now() })));
    setFixedDues([]);
    // Force immediate sync to ensure all fixed dues are deleted from other devices instantly
    await syncData(true);
  };

  const updateVibesSalary = async (salary: Partial<VibesSalary>, skipSync = false) => {
    if (!user) {
      // Guest mode
      setVibesSalary((prev) => {
        const updated = { ...prev, ...salary };
        localStorage.setItem('guestVibesSalary', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    // Merge with existing state to ensure we don't lose data
    // Use the current vibesSalary state as the base
    const currentSalary = vibesSalary;

    // Check both passed salary and current state to ensure valid values
    const newExpectedAmount = salary.expectedAmount !== undefined
      ? salary.expectedAmount
      : currentSalary.expectedAmount;

    // Handle monthlyExpectedAmounts properly
    const newMonthlyAmounts = salary.monthlyExpectedAmounts !== undefined
      ? salary.monthlyExpectedAmounts
      : currentSalary.monthlyExpectedAmounts;

    const newPayments = salary.payments !== undefined
      ? salary.payments
      : currentSalary.payments;

    const updateData = {
      expected_amount: newExpectedAmount,
      start_date: salary.startDate !== undefined ? salary.startDate : currentSalary.startDate,
      monthly_expected_amounts: newMonthlyAmounts,
      payments: newPayments,
      dirty: 1,
      last_modified: Date.now(),
    };

    const oldSalary = { ...vibesSalary };

    // Use user.uid as the key (as established in add/load)
    // Removed legacy delete('user-vibes') call which is dangerous/incorrect
    await db.vibes_salary.put({
      id: user.uid,
      user_id: user.uid,
      ...updateData,
    });

    const newSalary = { ...vibesSalary, ...salary };
    await addHistoryLog({
      entity_id: user.uid,
      entity_type: 'vibes-salary',
      action: 'update',
      before: oldSalary,
      after: newSalary,
    });

    setVibesSalary((prev) => ({ ...prev, ...salary }));
    // Conditionally sync: skip if caller handles sync themselves
    if (!skipSync) {
      await syncData(true);
    }
  };

  const addVibesSalaryPayment = async (
    payment: Omit<VibesSalary['payments'][0], 'id'>
  ) => {
    const newPayment = {
      ...payment,
      id: generateId(),
    };

    if (!user) {
      // Guest mode
      setVibesSalary((prev) => {
        const updated = {
          ...prev,
          payments: [newPayment, ...prev.payments],
        };
        localStorage.setItem('guestVibesSalary', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    // Update Vibes Salary with new payment
    const updatedSalary = {
      ...vibesSalary,
      payments: [...vibesSalary.payments, newPayment],
    };

    await updateVibesSalary(updatedSalary);
    // Note: No need to addTransaction here, the useEffect will trigger syncSalaryToTransactions
    // which handles the allocation and transaction creation/updates automatically.
  };

  const updateVibesSalaryPayment = async (
    paymentId: string,
    payment: Partial<VibesSalary['payments'][0]>
  ) => {
    const updatedPayments = vibesSalary.payments.map((p) =>
      p.id === paymentId ? { ...p, ...payment } : p
    );
    const updatedSalary = { ...vibesSalary, payments: updatedPayments };
    await updateVibesSalary({ payments: updatedPayments }, true); // skipSync=true, we handle it below
    // Explicitly sync transactions with the updated salary data to avoid stale closure
    await syncSalaryToTransactions(updatedSalary);
  };

  const deleteVibesSalaryPayment = async (paymentId: string) => {
    const updatedPayments = vibesSalary.payments.filter(
      (p) => p.id !== paymentId
    );
    const updatedSalary = { ...vibesSalary, payments: updatedPayments };
    await updateVibesSalary({ payments: updatedPayments }, true); // skipSync=true, we handle it below
    // Explicitly sync transactions with the updated salary data to avoid stale closure
    await syncSalaryToTransactions(updatedSalary);
  };


  const calculateSalaryAllocations = (currentVibesSalary: VibesSalary) => {
    // Generate months from startDate to 2 years in future
    const months: string[] = [];
    const startDate = new Date((currentVibesSalary.startDate || '2023-05') + '-01');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    const current = new Date(startDate);
    while (current <= futureDate) {
      months.push(format(current, 'yyyy-MM'));
      current.setMonth(current.getMonth() + 1);
    }

    const allocation: Record<string, number> = {}; // Track how much allocated per month
    months.forEach(m => allocation[m] = 0);

    // Sort payments FIFO
    const sortedPayments = [...currentVibesSalary.payments]
      .reverse()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const allocatedTransactions: Array<{
      paymentId: string;
      month: string;
      amount: number;
      date: string; // Original payment date
      notes?: string;
    }> = [];

    sortedPayments.forEach((payment) => {
      let remainingAmount = payment.amount;

      for (const monthYear of months) {
        if (remainingAmount <= 0) break;

        const expected = currentVibesSalary.monthlyExpectedAmounts?.[monthYear] || currentVibesSalary.expectedAmount;
        const alreadyAllocated = allocation[monthYear];

        if (alreadyAllocated < expected) {
          const needed = expected - alreadyAllocated;
          const allocateAmount = Math.min(remainingAmount, needed);

          // Correction for float precision
          const safeAllocatedAmount = Math.round(allocateAmount * 100) / 100;

          if (safeAllocatedAmount > 0) {
            allocation[monthYear] += safeAllocatedAmount;
            allocatedTransactions.push({
              paymentId: payment.id,
              month: monthYear,
              amount: safeAllocatedAmount,
              date: payment.date,
              notes: payment.notes
            });
            remainingAmount -= safeAllocatedAmount;
          }
        }
      }

      // Overflow
      if (remainingAmount > 0.005) { // Epsilon check
        const paymentMonth = format(new Date(payment.date), 'yyyy-MM');
        // Just tack it onto the payment month
        allocatedTransactions.push({
          paymentId: payment.id,
          month: paymentMonth,
          amount: Math.round(remainingAmount * 100) / 100, // Round remaining
          date: payment.date,
          notes: payment.notes
        });
      }
    });

    return allocatedTransactions;
  };

  const syncSalaryToTransactions = async (updatedSalary?: VibesSalary) => {
    // Use provided updated salary or fall back to current state (for useEffect calls)
    const salaryToUse = updatedSalary || vibesSalary;
    console.log('[syncSalaryToTransactions] Using salary data:', {
      paymentsCount: salaryToUse.payments.length,
      payments: salaryToUse.payments.map(p => ({ id: p.id, amount: p.amount, date: p.date }))
    });

    const allocations = calculateSalaryAllocations(salaryToUse);
    console.log('[syncSalaryToTransactions] Calculated allocations:', allocations.length, allocations.map(a => ({ paymentId: a.paymentId, month: a.month, amount: a.amount })));

    // Get existing Salary transactions
    const existingSalaryTxns = transactions.filter(t => t.source === 'vibes-salary');
    console.log('[syncSalaryToTransactions] All transactions count:', transactions.length);
    console.log('[syncSalaryToTransactions] Transactions sources:', transactions.map(t => ({ id: t.id, source: t.source, desc: t.description })));

    const inputsAdded: Transaction[] = [];
    const inputsUpdated: Transaction[] = []; // Actually updates are promises
    const idsToKeep = new Set<string>();

    // 1. Process allocations (Create or Update)
    const updatePromises: Promise<any>[] = [];

    allocations.forEach(alloc => {
      const sourceId = `${alloc.paymentId}_${alloc.month}`;
      const existing = existingSalaryTxns.find(t => t.source_id === sourceId);

      const txnData = {
        type: 'income' as const,
        amount: alloc.amount,
        category: 'Salary',
        date: alloc.date, // Use payment date, NOT allocated month date (accounting preference usually)
        // Description uses the allocated month
        description: `Vibes Salary Payment ${format(new Date(alloc.month + '-01'), 'MMMM yyyy')}${alloc.notes ? ` (${alloc.notes})` : ''}`,
        source: 'vibes-salary' as const,
        source_id: sourceId
      };

      if (existing) {
        idsToKeep.add(existing.id);
        // Check if update needed
        if (existing.amount !== txnData.amount || existing.description !== txnData.description || existing.date !== txnData.date) {
          if (user) {
            updatePromises.push(db.transactions.update(existing.id, {
              ...txnData,
              dirty: 1,
              last_modified: Date.now()
            }));
          }
          // Prepare state update
          inputsUpdated.push({ ...existing, ...txnData });
        }
      } else {
        // Create new
        inputsAdded.push({
          id: generateId(),
          ...txnData
        });
      }
    });

    // 2. Identify Orphans (transactions that no longer have a matching allocation)
    // This happens if Expected Salary changes, causing allocation to shift to a different month
    // Also covers the case of migrating from "Old Schema" (source_id = paymentId) to "New Schema" (source_id = paymentId_month)
    const orphans = existingSalaryTxns.filter(t => !idsToKeep.has(t.id));

    console.log('[syncSalaryToTransactions] Existing salary txns:', existingSalaryTxns.length);
    console.log('[syncSalaryToTransactions] IdsToKeep:', Array.from(idsToKeep));
    console.log('[syncSalaryToTransactions] Orphans found:', orphans.length, orphans.map(o => ({ id: o.id, source_id: o.source_id, desc: o.description })));

    // Note: Old schema items (source_id = paymentId) will NOT be found in step 1, so they will be in orphans.
    // They will be deleted, and replaced by new split transactions. This is EXACTLY what we want.

    if (inputsAdded.length === 0 && inputsUpdated.length === 0 && orphans.length === 0) return 0;

    console.log(`[FinanceContext] Syncing Salary Allocations: +${inputsAdded.length}, ~${inputsUpdated.length}, -${orphans.length}`);

    // EXECUTE DB CHANGES
    if (user) {
      // Deletes
      if (orphans.length > 0) {
        const orphanIds = orphans.map(t => t.id);
        // Use soft delete (mark as deleted) for sync compatibility
        updatePromises.push(...orphanIds.map(id => db.transactions.update(id, { deleted: 1, dirty: 1, last_modified: Date.now() })));
      }

      // Adds
      if (inputsAdded.length > 0) {
        updatePromises.push(db.transactions.bulkAdd(inputsAdded.map(t => ({
          id: t.id,
          user_id: user.uid,
          type: t.type,
          description: t.description,
          amount: t.amount,
          category: t.category,
          date: t.date,
          source: t.source,
          source_id: t.source_id,
          synced: 0,
          dirty: 1,
          last_modified: Date.now(),
        }))));
      }

      await Promise.all(updatePromises);
    }

    // UPDATE STATE
    setTransactions(prev => {
      let updated = [...prev];

      // Remove orphans
      const orphanIds = new Set(orphans.map(t => t.id));
      updated = updated.filter(t => !orphanIds.has(t.id));

      // Apply updates
      inputsUpdated.forEach(u => {
        const idx = updated.findIndex(t => t.id === u.id);
        if (idx !== -1) updated[idx] = u;
      });

      // Add new
      updated = [...inputsAdded, ...updated];

      if (!user) {
        localStorage.setItem('guestTransactions', JSON.stringify(updated));
      }
      return updated;
    });

    // Force one sync
    try {
      await syncData(true);
    } catch (e) {
      console.warn('Auto-sync network warning:', e);
    }

    return inputsAdded.length + inputsUpdated.length + orphans.length;
  };

  const updateSalary = async (salaryUpdate: Partial<Salary>, skipSync = false) => {
    if (!user) {
      setSalary((prev) => {
        const updated = { ...prev, ...salaryUpdate };
        localStorage.setItem('guestSalary', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    const currentSalary = salary;

    const newExpectedAmount = salaryUpdate.expectedAmount !== undefined
      ? salaryUpdate.expectedAmount
      : currentSalary.expectedAmount;

    const newMonthlyAmounts = salaryUpdate.monthlyExpectedAmounts !== undefined
      ? salaryUpdate.monthlyExpectedAmounts
      : currentSalary.monthlyExpectedAmounts;

    const newPayments = salaryUpdate.payments !== undefined
      ? salaryUpdate.payments
      : currentSalary.payments;

    const updateData = {
      expected_amount: newExpectedAmount,
      start_date: salaryUpdate.startDate !== undefined ? salaryUpdate.startDate : currentSalary.startDate,
      monthly_expected_amounts: newMonthlyAmounts,
      payments: newPayments,
      dirty: 1,
      last_modified: Date.now(),
    };

    const oldSalary = { ...salary };

    await db.salary.put({
      id: user.uid,
      user_id: user.uid,
      ...updateData,
    });

    const newSalary = { ...salary, ...salaryUpdate };
    await addHistoryLog({
      entity_id: user.uid,
      entity_type: 'salary',
      action: 'update',
      before: oldSalary,
      after: newSalary,
    });

    setSalary((prev) => ({ ...prev, ...salaryUpdate }));
    if (!skipSync) {
      await syncData(true);
    }
  };

  const addSalaryPayment = async (
    payment: Omit<Salary['payments'][0], 'id'>
  ) => {
    const newPayment = {
      ...payment,
      id: generateId(),
    };

    if (!user) {
      setSalary((prev) => {
        const updated = {
          ...prev,
          payments: [newPayment, ...prev.payments],
        };
        localStorage.setItem('guestSalary', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    const updatedSalary = {
      ...salary,
      payments: [...salary.payments, newPayment],
    };

    await updateSalary(updatedSalary);
  };

  const updateSalaryPayment = async (
    paymentId: string,
    payment: Partial<Salary['payments'][0]>
  ) => {
    const updatedPayments = salary.payments.map((p) =>
      p.id === paymentId ? { ...p, ...payment } : p
    );
    const updatedSalary = { ...salary, payments: updatedPayments };
    await updateSalary({ payments: updatedPayments }, true);
    await syncGeneralSalaryToTransactions(updatedSalary);
  };

  const deleteSalaryPayment = async (paymentId: string) => {
    const updatedPayments = salary.payments.filter(
      (p) => p.id !== paymentId
    );
    const updatedSalary = { ...salary, payments: updatedPayments };
    await updateSalary({ payments: updatedPayments }, true);
    await syncGeneralSalaryToTransactions(updatedSalary);
  };

  const calculateGeneralSalaryAllocations = (currentSalary: Salary) => {
    const months: string[] = [];
    const startDate = new Date((currentSalary.startDate || '2023-05') + '-01');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    const current = new Date(startDate);
    while (current <= futureDate) {
      months.push(format(current, 'yyyy-MM'));
      current.setMonth(current.getMonth() + 1);
    }

    const allocation: Record<string, number> = {};
    months.forEach(m => allocation[m] = 0);

    const sortedPayments = [...currentSalary.payments]
      .reverse()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const allocatedTransactions: Array<{
      paymentId: string;
      month: string;
      amount: number;
      date: string;
      notes?: string;
    }> = [];

    sortedPayments.forEach((payment) => {
      let remainingAmount = payment.amount;

      for (const monthYear of months) {
        if (remainingAmount <= 0) break;

        const expected = currentSalary.monthlyExpectedAmounts?.[monthYear] || currentSalary.expectedAmount;
        const alreadyAllocated = allocation[monthYear];

        if (alreadyAllocated < expected) {
          const needed = expected - alreadyAllocated;
          const allocateAmount = Math.min(remainingAmount, needed);
          const safeAllocatedAmount = Math.round(allocateAmount * 100) / 100;

          if (safeAllocatedAmount > 0) {
            allocation[monthYear] += safeAllocatedAmount;
            allocatedTransactions.push({
              paymentId: payment.id,
              month: monthYear,
              amount: safeAllocatedAmount,
              date: payment.date,
              notes: payment.notes
            });
            remainingAmount -= safeAllocatedAmount;
          }
        }
      }

      if (remainingAmount > 0.005) {
        const paymentMonth = format(new Date(payment.date), 'yyyy-MM');
        allocatedTransactions.push({
          paymentId: payment.id,
          month: paymentMonth,
          amount: Math.round(remainingAmount * 100) / 100,
          date: payment.date,
          notes: payment.notes
        });
      }
    });

    return allocatedTransactions;
  };

  const syncGeneralSalaryToTransactions = async (updatedSalary?: Salary) => {
    const salaryToUse = updatedSalary || salary;

    const allocations = calculateGeneralSalaryAllocations(salaryToUse);
    const existingSalaryTxns = transactions.filter(t => t.source === 'salary');

    const inputsAdded: Transaction[] = [];
    const inputsUpdated: Transaction[] = [];
    const idsToKeep = new Set<string>();
    const updatePromises: Promise<any>[] = [];

    allocations.forEach(alloc => {
      const sourceId = `${alloc.paymentId}_${alloc.month}`;
      const existing = existingSalaryTxns.find(t => t.source_id === sourceId);

      const txnData = {
        type: 'income' as const,
        amount: alloc.amount,
        category: 'Salary',
        date: alloc.date,
        description: `Salary Payment ${format(new Date(alloc.month + '-01'), 'MMMM yyyy')}${alloc.notes ? ` (${alloc.notes})` : ''}`,
        source: 'salary' as const,
        source_id: sourceId
      };

      if (existing) {
        idsToKeep.add(existing.id);
        if (existing.amount !== txnData.amount || existing.description !== txnData.description || existing.date !== txnData.date) {
          if (user) {
            updatePromises.push(db.transactions.update(existing.id, {
              ...txnData,
              dirty: 1,
              last_modified: Date.now()
            }));
          }
          inputsUpdated.push({ ...existing, ...txnData });
        }
      } else {
        inputsAdded.push({
          id: generateId(),
          ...txnData
        });
      }
    });

    const orphans = existingSalaryTxns.filter(t => !idsToKeep.has(t.id));

    if (inputsAdded.length === 0 && inputsUpdated.length === 0 && orphans.length === 0) return 0;

    if (user) {
      if (orphans.length > 0) {
        updatePromises.push(...orphans.map(t => db.transactions.update(t.id, { deleted: 1, dirty: 1, last_modified: Date.now() })));
      }

      if (inputsAdded.length > 0) {
        updatePromises.push(db.transactions.bulkAdd(inputsAdded.map(t => ({
          id: t.id,
          user_id: user.uid,
          type: t.type,
          description: t.description,
          amount: t.amount,
          category: t.category,
          date: t.date,
          source: t.source,
          source_id: t.source_id,
          synced: 0,
          dirty: 1,
          last_modified: Date.now(),
        }))));
      }

      await Promise.all(updatePromises);
    }

    setTransactions(prev => {
      let updated = [...prev];
      const orphanIds = new Set(orphans.map(t => t.id));
      updated = updated.filter(t => !orphanIds.has(t.id));

      inputsUpdated.forEach(u => {
        const idx = updated.findIndex(t => t.id === u.id);
        if (idx !== -1) updated[idx] = u;
      });

      updated = [...inputsAdded, ...updated];

      if (!user) {
        localStorage.setItem('guestTransactions', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await syncData(true);
    } catch (e) {
      console.warn('Auto-sync network warning:', e);
    }

    return inputsAdded.length + inputsUpdated.length + orphans.length;
  };

  const syncFixedDuesToTransactions = async () => {
    // Only proceed if we have data

    // Filter for paid dues
    const paidDues = fixedDues.filter(d => Boolean(d.isPaid));

    // Find missing transactions for paid dues
    const missingTransactions = paidDues.filter(due => {
      return !transactions.some(t => t.source === 'fixed-due' && t.source_id === due.id);
    });

    // Find outdated transactions (wrong description)
    const outdatedTransactions = paidDues.filter(due => {
      const txn = transactions.find(t => t.source === 'fixed-due' && t.source_id === due.id);
      if (!txn) return false;

      let dueDateFormatted = due.dueDate;
      try {
        // Handle potential ISO string or date string issues
        dueDateFormatted = format(new Date(due.dueDate), 'MMM dd, yyyy');
      } catch (e) {
        dueDateFormatted = due.dueDate;
      }

      const expectedDescription = `Payment for ${due.name} with due date ${dueDateFormatted}`;
      return txn.description !== expectedDescription;
    });

    // Find orphans (transactions for fixed dues that are no longer paid or deleted)
    // Get all fixed-due source IDs from transactions
    const fixedDueTxns = transactions.filter(t => t.source === 'fixed-due');
    const orphans = fixedDueTxns.filter(t => {
      const due = fixedDues.find(d => d.id === t.source_id);
      // Orphan if due not found OR due is not paid
      return !due || !Boolean(due.isPaid);
    });

    if (missingTransactions.length === 0 && outdatedTransactions.length === 0 && orphans.length === 0) return 0;

    console.log(`[FinanceContext] Syncing Fixed Dues: +${missingTransactions.length}, ~${outdatedTransactions.length}, -${orphans.length}`);

    const newTransactions: Transaction[] = missingTransactions.map(due => {
      let dueDateFormatted = due.dueDate;
      try {
        dueDateFormatted = format(new Date(due.dueDate), 'MMM dd, yyyy');
      } catch (e) {
        dueDateFormatted = due.dueDate;
      }

      return {
        id: generateId(),
        type: 'expense',
        amount: due.amount,
        category: 'Fixed Dues',
        date: due.paidDate || new Date().toISOString().split('T')[0],
        description: `Payment for ${due.name} with due date ${dueDateFormatted}`,
        source: 'fixed-due',
        source_id: due.id
      };
    });

    const updatePromises: Promise<any>[] = [];

    // DB Updates
    if (user) {
      // Adds
      if (newTransactions.length > 0) {
        updatePromises.push(db.transactions.bulkAdd(newTransactions.map(t => ({
          id: t.id,
          user_id: user.uid,
          type: t.type,
          description: t.description,
          amount: t.amount,
          category: t.category,
          date: t.date,
          source: t.source,
          source_id: t.source_id,
          synced: 0,
          dirty: 1,
          last_modified: Date.now(),
        }))));
      }

      // Updates
      if (outdatedTransactions.length > 0) {
        updatePromises.push(...outdatedTransactions.map(due => {
          const txn = transactions.find(t => t.source === 'fixed-due' && t.source_id === due.id);
          if (txn) {
            let dueDateFormatted = due.dueDate;
            try {
              dueDateFormatted = format(new Date(due.dueDate), 'MMM dd, yyyy');
            } catch (e) { }

            return db.transactions.update(txn.id, {
              description: `Payment for ${due.name} with due date ${dueDateFormatted}`,
              dirty: 1,
              last_modified: Date.now()
            });
          }
          return Promise.resolve();
        }));
      }

      // Deletes (Soft delete orphans)
      if (orphans.length > 0) {
        updatePromises.push(...orphans.map(t => db.transactions.update(t.id, { deleted: 1, dirty: 1, last_modified: Date.now() })));
      }

      await Promise.all(updatePromises);
    }

    // State Updates
    setTransactions(prev => {
      let updated = [...prev];

      // Remove orphans
      const orphanIds = new Set(orphans.map(t => t.id));
      updated = updated.filter(t => !orphanIds.has(t.id));

      // Update existing
      outdatedTransactions.forEach(due => {
        const idx = updated.findIndex(t => t.source === 'fixed-due' && t.source_id === due.id);
        if (idx !== -1) {
          let dueDateFormatted = due.dueDate;
          try {
            dueDateFormatted = format(new Date(due.dueDate), 'MMM dd, yyyy');
          } catch (e) { }

          updated[idx] = {
            ...updated[idx],
            description: `Payment for ${due.name} with due date ${dueDateFormatted}`
          };
        }
      });

      // Add new
      updated = [...newTransactions, ...updated];

      if (!user) {
        localStorage.setItem('guestTransactions', JSON.stringify(updated));
      }
      return updated;
    });

    // Force sync if we made changes
    try {
      await syncData(true);
    } catch (e) {
      console.warn('Auto-sync network warning:', e);
    }

    return newTransactions.length + outdatedTransactions.length + orphans.length;
  };

  // Automatically check for missing salary transactions AND fixed due transactions whenever data changes
  useEffect(() => {
    // Debounce slightly to avoid running during rapid updates
    const timer = setTimeout(() => {
      syncSalaryToTransactions();
      syncGeneralSalaryToTransactions();
      syncFixedDuesToTransactions();
    }, 1000);

    return () => clearTimeout(timer);
  }, [vibesSalary.payments, salary.payments, transactions.length, fixedDues]); // Watch full fixedDues object to catch status changes


  const updateBullionHoldings = async (
    holdings: BullionHoldings
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        // Guest mode
        localStorage.setItem('bullionHoldings', JSON.stringify(holdings));
        setBullionHoldings(holdings);
        return { success: true };
      }

      const holdingsData = {
        gold: holdings
          .filter(h => h.type.toLowerCase() === 'gold')
          .reduce((sum, h) => sum + h.pureOunces, 0),
        silver: holdings
          .filter(h => h.type.toLowerCase() === 'silver')
          .reduce((sum, h) => sum + h.pureOunces, 0),
        platinum: holdings
          .filter(h => h.type.toLowerCase() === 'platinum')
          .reduce((sum, h) => sum + h.pureOunces, 0),
        palladium: holdings
          .filter(h => h.type.toLowerCase() === 'palladium')
          .reduce((sum, h) => sum + h.pureOunces, 0),
        items: JSON.stringify(holdings),
      };

      const oldHoldings = [...bullionHoldings];
      await db.bullion_holdings.delete('user-bullion');
      await db.bullion_holdings.put({
        id: user.uid,
        user_id: user.uid,
        ...holdingsData,
        synced: 0,
        dirty: 1,
        last_modified: Date.now(),
      });

      await addHistoryLog({
        entity_id: user.uid,
        entity_type: 'bullion-holdings',
        action: 'update',
        before: oldHoldings,
        after: holdings,
      });

      setBullionHoldings(holdings);
      // Force immediate sync to ensure bullion holdings update appears on other devices instantly
      await syncData(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  };

  const updateMoneyHoldings = async (
    holdings: MoneyHoldings
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      setMoneyHoldings(holdings);
      localStorage.setItem('moneyHoldings', JSON.stringify(holdings));
      return { success: true };
    }

    try {
      const oldHoldings = { ...moneyHoldings };
      await db.money_holdings.put({
        id: user.uid, // Using user_id as ID since it's 1-to-1
        user_id: user.uid,
        holdings: JSON.stringify(holdings.holdings),
        bill_counts: JSON.stringify(holdings.billCounts),
        active_currencies: JSON.stringify(holdings.activeCurrencies || []),
        currency_data: holdings.currencyData ? JSON.stringify(holdings.currencyData) : undefined,
        dirty: 1,
        last_modified: Date.now(),
      });

      await addHistoryLog({
        entity_id: user.uid,
        entity_type: 'money-holdings',
        action: 'update',
        before: oldHoldings,
        after: holdings,
      });

      setMoneyHoldings(holdings);

      // Force sync
      await syncData(true);
      return { success: true };
    } catch (error) {
      console.error('Error updating money holdings:', error);
      return { success: false, error: String(error) };
    }
  };

  const updateUserSettings = async (
    settings: Partial<UserSettings>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      setUserSettings(prev => {
        const updated = { ...prev, ...settings };
        localStorage.setItem('userSettings', JSON.stringify(updated));
        if (updated.theme) {
          document.documentElement.classList.toggle('dark', updated.theme === 'dark');
        }
        return updated;
      });
      return { success: true };
    }

    try {
      const current = await db.user_settings.get(user.uid);
      const newSettings = { ...userSettings, ...settings };

      await db.user_settings.put({
        user_id: user.uid,
        theme: newSettings.theme,
        dirty: 1,
        last_modified: Date.now(),
      });
      setUserSettings(newSettings);

      if (settings.theme) {
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
      }

      // Force sync
      await syncData(true);
      return { success: true };
    } catch (error) {
      console.error('Error updating user settings:', error);
      return { success: false, error: String(error) };
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                             Bullion Prices Logic                           */
  /* -------------------------------------------------------------------------- */
  const refreshBullionPrices = async () => {
    try {
      const response = await fetch('https://data-asg.goldprice.org/dbXRates/USD');
      if (!response.ok) throw new Error('Failed to fetch bullion prices');
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        setBullionPrices(prev => {
          const newPrices = {
            ...prev,
            gold: item.xauPrice || prev.gold,
            silver: item.xagPrice || prev.silver,
            // Platinum/Palladium not in this API, using small random drift for "real-time" demo if desired, 
            // or just keep defaults. Let's keep defaults but slightly vary to show graph moving if no live data.
            platinum: prev.platinum + (Math.random() - 0.5) * 0.1,
            palladium: prev.palladium + (Math.random() - 0.5) * 0.1,
          };

          const newPoint = { timestamp: Date.now(), ...newPrices };

          setBullionHistory(prevHistory => {
            const updatedHistory = [...prevHistory, newPoint].slice(-10080);
            return updatedHistory;
          });

          // Save to Dexie for persistence (global metadata, no user_id needed as prices are universal)
          db.bullion_history.add(newPoint).catch(() => { });

          return newPrices;
        });
        console.log('[FinanceContext] Updated live bullion prices:', item.xauPrice, item.xagPrice);
      }
    } catch (error) {
      console.error('[FinanceContext] Error fetching bullion prices:', error);
    }
  };

  useEffect(() => {
    refreshBullionPrices();
    // Refresh based on dynamic interval
    const interval = setInterval(refreshBullionPrices, bullionRefreshInterval);
    return () => clearInterval(interval);
  }, [bullionRefreshInterval]);

  const getTotalIncome = () => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalBalance = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const syncData = async (force: boolean = false) => {
    if (!user) {
      console.log('[FinanceContext] syncData: No user, skipping');
      return;
    }

    // Prevent multiple simultaneous syncs
    if (isSyncingRef.current) {
      console.debug('[FinanceContext] syncData: Sync already in progress, skipping...');
      return;
    }

    // Throttle sync calls (but allow forced sync from buttons)
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimeRef.current;
    if (!force && timeSinceLastSync < SYNC_COOLDOWN) {
      console.debug(`[FinanceContext] syncData: Too soon since last sync (${timeSinceLastSync}ms < ${SYNC_COOLDOWN}ms), skipping...`);
      return;
    }

    isSyncingRef.current = true;
    lastSyncTimeRef.current = now;

    try {
      console.log('[FinanceContext] syncData: Starting full sync...');

      // Before sync, capture dirty fixed dues to preserve them after reload
      const dirtyDuesBeforeSync = await db.fixed_dues.where('dirty').equals(1).toArray();
      const dirtyDueIdsBeforeSync = new Set(dirtyDuesBeforeSync.map(d => d.id));
      const dirtyDueStatesBeforeSync = new Map(
        dirtyDuesBeforeSync.map(d => {
          const isPaid = Boolean(d.is_paid);
          return [d.id, isPaid];
        })
      );

      const stats = await dexieSync.syncAll();
      console.log('[FinanceContext] syncData: Sync complete, stats:', JSON.stringify(stats, null, 2));

      // Only reload local data if sync was successful
      await loadLocalData();

      // After reload, restore dirty due states if they were overwritten
      if (dirtyDueIdsBeforeSync.size > 0) {
        console.log(`[syncData] Restoring ${dirtyDueIdsBeforeSync.size} dirty due states after reload...`);
        setFixedDues((prev) => {
          let needsUpdate = false;
          const updated = prev.map((d) => {
            if (dirtyDueIdsBeforeSync.has(d.id)) {
              const preservedIsPaid = dirtyDueStatesBeforeSync.get(d.id) ?? false;
              const currentIsPaid = Boolean(d.isPaid);
              if (preservedIsPaid !== currentIsPaid) {
                console.log(`[syncData] Restoring dirty due ${d.id}: isPaid=${preservedIsPaid} (was ${currentIsPaid})`);
                needsUpdate = true;
                return { ...d, isPaid: preservedIsPaid };
              }
            }
            return d;
          });
          if (needsUpdate) {
            fixedDuesRef.current = updated;
          }
          return needsUpdate ? updated : prev;
        });
      }

      // Get updated counts after reload
      const updatedTransactions = await db.transactions.where('user_id').equals(user.uid).toArray();
      const activeTransactions = updatedTransactions.filter(t => !Boolean(t.deleted)).length;
      const updatedDues = await db.fixed_dues.where('user_id').equals(user.uid).toArray();
      const activeDues = updatedDues.filter(d => !Boolean(d.deleted)).length;
      console.log(`[FinanceContext] syncData: Complete - transactions: ${activeTransactions}, fixedDues: ${activeDues}`);

    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);

      // Don't throw or log auth redirect errors - redirect is happening
      const isAuthError = error?.isAuthRedirect ||
        message.includes('Invalid or expired token') ||
        message.includes('Session expired') ||
        error?.status === 401;

      if (isAuthError) {
        console.log('[FinanceContext] syncData: Auth redirect in progress, silently aborting sync');
        return; // Don't throw, redirect is handling it
      }

      console.error('[FinanceContext] syncData: Error during sync:', error);
      // Do not reload local data to avoid overwriting dirty local changes if network error occurs
      if (message.includes('Network error') || message.includes('CONNECTION_REFUSED')) {
        console.warn('[FinanceContext] syncData: Network error occurred, preserving local state without reload');
        // Just return without throwing, keep local state as is
        return;
      }
      // Propagate other errors
      throw error;

    } finally {
      isSyncingRef.current = false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        fixedDues,
        vibesSalary,
        bullionHoldings,
        moneyHoldings,
        userSettings,
        recurringTransactions,
        bullionHistory,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteAllTransactions,
        addFixedDue,
        updateFixedDue,
        deleteFixedDue,
        deleteAllFixedDues,
        updateVibesSalary,
        addVibesSalaryPayment,
        updateVibesSalaryPayment,
        deleteVibesSalaryPayment,
        syncSalaryToTransactions,
        salary,
        updateSalary,
        addSalaryPayment,
        updateSalaryPayment,
        deleteSalaryPayment,
        syncGeneralSalaryToTransactions,
        updateBullionHoldings,
        updateMoneyHoldings,
        updateUserSettings,
        getTotalIncome,
        getTotalExpenses,
        getTotalBalance,
        syncData,
        bullionPrices,
        refreshBullionPrices,
        setBullionRefreshInterval,
        getHistoryLogs,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};


