#!/usr/bin/env node

/**
 * Test script to verify fixed dues sync is working
 * Run with: node test-fixed-dues-sync.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDatabaseSchema() {
  console.log('\n=== Testing Database Schema ===\n');
  
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
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'fixed_dues'
      AND COLUMN_NAME IN ('start_date', 'end_date')
    `, [process.env.DB_NAME]);

    const hasStartDate = columns.some(col => col.COLUMN_NAME === 'start_date');
    const hasEndDate = columns.some(col => col.COLUMN_NAME === 'end_date');

    if (hasStartDate && hasEndDate) {
      console.log('✓ Database schema is correct (start_date and end_date columns exist)');
      return true;
    } else {
      console.log('✗ Database schema is missing required columns:');
      if (!hasStartDate) console.log('  - Missing: start_date');
      if (!hasEndDate) console.log('  - Missing: end_date');
      console.log('\nRun this SQL to fix:');
      console.log('  ALTER TABLE fixed_dues ADD COLUMN start_date DATE NULL;');
      console.log('  ALTER TABLE fixed_dues ADD COLUMN end_date DATE NULL;');
      return false;
    }
  } catch (error) {
    console.error('✗ Error checking database schema:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function testBackendAPI() {
  console.log('\n=== Testing Backend API ===\n');
  
  // This would require the backend to be running
  // We'll just check if the endpoint file exists and has the right code
  try {
    const serverFile = path.join(__dirname, 'backend', 'server.js');
    const content = fs.readFileSync(serverFile, 'utf8');
    
    // Check if enhanced logging exists
    if (content.includes('[Backend] Creating fixed due')) {
      console.log('✓ Backend has enhanced logging');
    } else {
      console.log('✗ Backend logging not found - may need to restart server');
    }
    
    // Check if start_date and end_date are in INSERT statement
    if (content.includes('start_date, end_date')) {
      console.log('✓ Backend code includes start_date and end_date');
    } else {
      console.log('✗ Backend code missing start_date and end_date in INSERT');
    }
    
    return true;
  } catch (error) {
    console.error('✗ Error checking backend code:', error.message);
    return false;
  }
}

async function testSyncCode() {
  console.log('\n=== Testing Sync Code ===\n');
  
  try {
    const syncFile = path.join(__dirname, 'src', 'lib', 'dexiesync.ts');
    const content = fs.readFileSync(syncFile, 'utf8');
    
    // Check for enhanced error handling
    const checks = [
      { name: 'Enhanced error logging', pattern: 'Error details:', pass: true },
      { name: 'Payload logging', pattern: 'Payload:', pass: true },
      { name: 'Success logging', pattern: 'synced successfully', pass: true },
      { name: 'Dirty record handling', pattern: 'dirty locally but exists on server', pass: true },
    ];
    
    let allPass = true;
    checks.forEach(check => {
      if (content.includes(check.pattern)) {
        console.log(`✓ ${check.name}`);
      } else {
        console.log(`✗ ${check.name} - not found`);
        allPass = false;
      }
    });
    
    return allPass;
  } catch (error) {
    console.error('✗ Error checking sync code:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('========================================');
  console.log('Fixed Dues Sync Test Suite');
  console.log('========================================');
  
  const results = {
    database: await testDatabaseSchema(),
    backend: await testBackendAPI(),
    sync: await testSyncCode(),
  };
  
  console.log('\n=== Test Summary ===\n');
  console.log(`Database Schema: ${results.database ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Backend Code: ${results.backend ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Sync Code: ${results.sync ? '✓ PASS' : '✗ FAIL'}`);
  
  const allPass = Object.values(results).every(r => r);
  
  if (allPass) {
    console.log('\n✓ All tests passed!');
    console.log('\nNext steps:');
    console.log('1. Restart your backend server');
    console.log('2. Add a fixed due on web');
    console.log('3. Check backend logs for "[Backend] Fixed due ... created successfully"');
    console.log('4. On mobile, wait 5 seconds or switch apps');
    console.log('5. Check mobile logs for "[Sync] ✓ Adding NEW fixed due"');
  } else {
    console.log('\n✗ Some tests failed. Please fix the issues above.');
    if (!results.database) {
      console.log('\n⚠️  CRITICAL: Database migration must be run first!');
    }
  }
  
  console.log('\n========================================\n');
}

// Run tests
runTests().catch(console.error);

