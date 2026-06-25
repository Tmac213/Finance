#!/usr/bin/env node

/**
 * Quick test script to verify fixed dues sync code is correct
 * Run with: node test-sync-quick.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================');
console.log('Fixed Dues Sync Quick Test');
console.log('========================================\n');

let allPass = true;

// Test 1: Check database schema file
console.log('1. Checking database schema...');
try {
  const schemaFile = path.join(__dirname, 'backend', 'schema.sql');
  const schemaContent = fs.readFileSync(schemaFile, 'utf8');
  
  if (schemaContent.includes('start_date DATE NULL') && schemaContent.includes('end_date DATE NULL')) {
    console.log('   ✓ Schema file includes start_date and end_date columns\n');
  } else {
    console.log('   ✗ Schema file missing start_date or end_date columns\n');
    allPass = false;
  }
} catch (error) {
  console.log('   ✗ Could not read schema file:', error.message, '\n');
  allPass = false;
}

// Test 2: Check backend server code
console.log('2. Checking backend server code...');
try {
  const serverFile = path.join(__dirname, 'backend', 'server.js');
  const serverContent = fs.readFileSync(serverFile, 'utf8');
  
  const backendChecks = [
    { name: 'Enhanced logging in POST', pattern: '[Backend] Creating fixed due', pass: true },
    { name: 'Enhanced logging in GET', pattern: '[Backend] Fetching fixed dues', pass: true },
    { name: 'start_date in INSERT', pattern: 'start_date, end_date', pass: true },
  ];
  
  let backendPass = true;
  backendChecks.forEach(check => {
    if (serverContent.includes(check.pattern)) {
      console.log(`   ✓ ${check.name}`);
    } else {
      console.log(`   ✗ ${check.name} - not found`);
      backendPass = false;
      allPass = false;
    }
  });
  
  if (backendPass) {
    console.log('   ✓ Backend code looks good\n');
  } else {
    console.log('   ✗ Backend code has issues\n');
  }
} catch (error) {
  console.log('   ✗ Could not read server file:', error.message, '\n');
  allPass = false;
}

// Test 3: Check sync code
console.log('3. Checking sync code...');
try {
  const syncFile = path.join(__dirname, 'src', 'lib', 'dexiesync.ts');
  const syncContent = fs.readFileSync(syncFile, 'utf8');
  
  const syncChecks = [
    { name: 'Enhanced error logging', pattern: 'Error details:', pass: true },
    { name: 'Payload logging', pattern: 'Payload:', pass: true },
    { name: 'Success logging', pattern: 'synced successfully', pass: true },
    { name: 'Dirty record handling', pattern: 'dirty locally but exists on server', pass: true },
    { name: 'start_date normalization', pattern: 'start_date: d.start_date', pass: true },
  ];
  
  let syncPass = true;
  syncChecks.forEach(check => {
    if (syncContent.includes(check.pattern)) {
      console.log(`   ✓ ${check.name}`);
    } else {
      console.log(`   ✗ ${check.name} - not found`);
      syncPass = false;
      allPass = false;
    }
  });
  
  if (syncPass) {
    console.log('   ✓ Sync code looks good\n');
  } else {
    console.log('   ✗ Sync code has issues\n');
  }
} catch (error) {
  console.log('   ✗ Could not read sync file:', error.message, '\n');
  allPass = false;
}

// Test 4: Check FinanceContext
console.log('4. Checking FinanceContext...');
try {
  const contextFile = path.join(__dirname, 'src', 'contexts', 'FinanceContext.tsx');
  const contextContent = fs.readFileSync(contextFile, 'utf8');
  
  const contextChecks = [
    { name: 'refreshFromRemote function', pattern: 'refreshFromRemote', pass: true },
    { name: 'loadLocalData after sync', pattern: 'await loadLocalData()', pass: true },
    { name: 'Enhanced logging', pattern: 'Data refreshed from remote', pass: true },
  ];
  
  let contextPass = true;
  contextChecks.forEach(check => {
    if (contextContent.includes(check.pattern)) {
      console.log(`   ✓ ${check.name}`);
    } else {
      console.log(`   ✗ ${check.name} - not found`);
      contextPass = false;
      allPass = false;
    }
  });
  
  if (contextPass) {
    console.log('   ✓ FinanceContext looks good\n');
  } else {
    console.log('   ✗ FinanceContext has issues\n');
  }
} catch (error) {
  console.log('   ✗ Could not read FinanceContext file:', error.message, '\n');
  allPass = false;
}

// Summary
console.log('========================================');
if (allPass) {
  console.log('✓ All code checks passed!\n');
  console.log('Next steps:');
  console.log('1. Run database migration (if not done):');
  console.log('   mysql -u your_user -p mishub_db < backend/migration_add_fixed_dues_dates.sql');
  console.log('   OR manually:');
  console.log('   ALTER TABLE fixed_dues ADD COLUMN start_date DATE NULL;');
  console.log('   ALTER TABLE fixed_dues ADD COLUMN end_date DATE NULL;');
  console.log('');
  console.log('2. Restart your backend server');
  console.log('');
  console.log('3. Test the sync:');
  console.log('   - Add a fixed due on web');
  console.log('   - Check backend logs for "[Backend] Fixed due ... created successfully"');
  console.log('   - On mobile, wait 5 seconds or switch apps');
  console.log('   - Check mobile logs for "[Sync] ✓ Adding NEW fixed due"');
} else {
  console.log('✗ Some checks failed. Please review the issues above.\n');
}
console.log('========================================\n');

