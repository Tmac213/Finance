/**
 * Test database schema for fixed_dues table
 * Run from backend directory: node test-db-schema.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSchema() {
  console.log('Testing database schema for fixed_dues table...\n');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // Check if start_date and end_date columns exist
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'fixed_dues'
      AND COLUMN_NAME IN ('start_date', 'end_date')
    `, [process.env.DB_NAME]);

    const hasStartDate = columns.some(col => col.COLUMN_NAME === 'start_date');
    const hasEndDate = columns.some(col => col.COLUMN_NAME === 'end_date');

    console.log('Current schema status:');
    console.log(`  start_date: ${hasStartDate ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  end_date: ${hasEndDate ? '✓ EXISTS' : '✗ MISSING'}\n`);

    if (hasStartDate && hasEndDate) {
      console.log('✓ Database schema is correct!\n');
      console.log('You can proceed with testing the sync.');
      return true;
    } else {
      console.log('✗ Database schema is missing required columns.\n');
      console.log('Run this SQL to fix:');
      console.log('  ALTER TABLE fixed_dues ADD COLUMN start_date DATE NULL;');
      console.log('  ALTER TABLE fixed_dues ADD COLUMN end_date DATE NULL;\n');
      console.log('Or run the migration script:');
      console.log('  mysql -u ' + process.env.DB_USER + ' -p ' + process.env.DB_NAME + ' < migration_add_fixed_dues_dates.sql\n');
      return false;
    }
  } catch (error) {
    console.error('✗ Error checking database schema:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Database connection settings in .env are correct');
    console.error('  2. Database exists');
    console.error('  3. User has proper permissions\n');
    return false;
  } finally {
    await pool.end();
  }
}

testSchema().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

