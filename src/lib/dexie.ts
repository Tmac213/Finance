import Dexie, { Table } from 'dexie';

export interface TransactionRow {
  id: string;
  user_id: string;
  type?: string;
  description?: string;
  amount?: number;
  category?: string;
  date?: string;
  source?: string;
  source_id?: string;
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
}

export interface FixedDueRow {
  id: string;
  user_id: string;
  name?: string;
  amount?: number;
  recurrence?: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  isPaid?: boolean;
  is_paid?: boolean;
  paid_date?: string;
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
}

export interface VibesSalaryRow {
  id: string;
  user_id: string;
  expected_amount?: number;
  start_date?: string;
  monthly_expected_amounts?: Record<string, number>;
  payments?: Array<{
    id: string;
    amount: number;
    date: string;
    notes?: string;
  }>;
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
}

export interface SalaryRow {
  id: string;
  user_id: string;
  expected_amount?: number;
  start_date?: string;
  monthly_expected_amounts?: Record<string, number>;
  payments?: Array<{
    id: string;
    amount: number;
    date: string;
    notes?: string;
  }>;
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
}

export interface BullionHoldingsRow {
  id: string;
  user_id: string;
  gold?: number;
  silver?: number;
  platinum?: number;
  palladium?: number;
  items?: string; // JSON string of full BullionHoldings array
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
}

export interface TestItemRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  date: string;
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
}

export interface MoneyHoldingsRow {
  id: string;
  user_id: string;
  holdings: string; // JSON string
  bill_counts: string; // JSON string
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
  active_currencies?: string; // JSON string
  currency_data?: string; // JSON string of full currency objects with exchange rates
}

export interface UserSettingsRow {
  user_id: string; // PK
  theme?: string;
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
}

export interface RecurringTransactionRow {
  id: string;
  user_id: string;
  type: string;
  description: string;
  amount: number;
  category: string;
  frequency: string;
  start_date: string;
  last_generated_date?: string;
  next_due_date: string;
  active: number; // 0 or 1
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
}

export interface BullionHistoryRow {
  timestamp: number; // Primary key (unique per minute)
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
}

export interface HistoryLogRow {
  id: string;
  user_id: string;
  entity_id: string;
  entity_type: 'transaction' | 'fixed-due' | 'vibes-salary' | 'salary' | 'bullion-holdings' | 'money-holdings';
  action: 'add' | 'update' | 'delete';
  before?: string; // JSON string
  after?: string; // JSON string
  timestamp: number;
  ip_address?: string;
  synced?: number;
  dirty?: number;
  deleted?: number;
}

export interface MedicationProfileRow {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
}

export interface MedicationBox {
  id: string;
  dosage: string;
  pillsPerDose: number;
  dosesPerDay: number;
  initialPills: number;
  currentPills: number;
  boxCount: number;
  expiryDate: string;
}

export interface MedicationRow {
  id: string;
  user_id: string;
  profile_id: string;
  name: string;
  category: string;
  boxes: string; // JSON string of MedicationBox[]
  synced?: number;
  dirty?: number;
  last_modified?: number;
  deleted?: number;
}

class AppDatabase extends Dexie {
  transactions!: Table<TransactionRow, string>;
  fixed_dues!: Table<FixedDueRow, string>;
  vibes_salary!: Table<VibesSalaryRow, string>;
  salary!: Table<SalaryRow, string>;
  bullion_holdings!: Table<BullionHoldingsRow, string>;
  test_items!: Table<TestItemRow, string>;
  money_holdings!: Table<MoneyHoldingsRow, string>;
  user_settings!: Table<UserSettingsRow, string>;
  recurring_transactions!: Table<RecurringTransactionRow, string>;
  bullion_history!: Table<BullionHistoryRow, number>;
  history_logs!: Table<HistoryLogRow, string>;
  medication_profiles!: Table<MedicationProfileRow, string>;
  medications!: Table<MedicationRow, string>;

  constructor() {
    super('mishub-db');

    // Previous versions ...
    this.version(6).stores({
      transactions: 'id, user_id, date, last_modified, dirty, deleted',
      fixed_dues: 'id, user_id, start_date, end_date, due_date, last_modified, dirty, deleted',
      vibes_salary: 'id, user_id, last_modified, dirty, deleted',
      bullion_holdings: 'id, user_id, last_modified, dirty, deleted',
      test_items: 'id, user_id, date, last_modified, dirty, deleted',
      money_holdings: 'id, user_id, last_modified, dirty, deleted',
      user_settings: 'user_id, last_modified, dirty, deleted',
    });

    this.version(7).stores({
      transactions: 'id, user_id, date, last_modified, dirty, deleted',
      fixed_dues: 'id, user_id, start_date, end_date, due_date, last_modified, dirty, deleted',
      vibes_salary: 'id, user_id, last_modified, dirty, deleted',
      bullion_holdings: 'id, user_id, last_modified, dirty, deleted',
      test_items: 'id, user_id, date, last_modified, dirty, deleted',
      money_holdings: 'id, user_id, last_modified, dirty, deleted',
      user_settings: 'user_id, last_modified, dirty, deleted',
    });

    this.version(8).stores({
      transactions: 'id, user_id, date, last_modified, dirty, deleted',
      fixed_dues: 'id, user_id, start_date, end_date, due_date, last_modified, dirty, deleted',
      vibes_salary: 'id, user_id, last_modified, dirty, deleted',
      bullion_holdings: 'id, user_id, last_modified, dirty, deleted',
      test_items: 'id, user_id, date, last_modified, dirty, deleted',
      money_holdings: 'id, user_id, last_modified, dirty, deleted',
      user_settings: 'user_id, last_modified, dirty, deleted',
    });

    this.version(9).stores({
      transactions: 'id, user_id, date, last_modified, dirty, deleted',
      fixed_dues: 'id, user_id, start_date, end_date, due_date, last_modified, dirty, deleted',
      vibes_salary: 'id, user_id, last_modified, dirty, deleted',
      bullion_holdings: 'id, user_id, last_modified, dirty, deleted',
      test_items: 'id, user_id, date, last_modified, dirty, deleted',
      money_holdings: 'id, user_id, last_modified, dirty, deleted',
      user_settings: 'user_id, last_modified, dirty, deleted',
    });

    this.version(10).stores({
      transactions: 'id, user_id, date, last_modified, dirty, deleted',
      fixed_dues: 'id, user_id, start_date, end_date, due_date, last_modified, dirty, deleted',
      vibes_salary: 'id, user_id, last_modified, dirty, deleted',
      bullion_holdings: 'id, user_id, last_modified, dirty, deleted',
      test_items: 'id, user_id, date, last_modified, dirty, deleted',
      money_holdings: 'id, user_id, last_modified, dirty, deleted',
      user_settings: 'user_id, last_modified, dirty, deleted',
      recurring_transactions: 'id, user_id, next_due_date, last_modified, dirty, deleted',
    });

    // Version 11: Add bullion_history
    this.version(11).stores({
      transactions: 'id, user_id, date, last_modified, dirty, deleted',
      fixed_dues: 'id, user_id, start_date, end_date, due_date, last_modified, dirty, deleted',
      vibes_salary: 'id, user_id, last_modified, dirty, deleted',
      bullion_holdings: 'id, user_id, last_modified, dirty, deleted',
      test_items: 'id, user_id, date, last_modified, dirty, deleted',
      money_holdings: 'id, user_id, last_modified, dirty, deleted',
      user_settings: 'user_id, last_modified, dirty, deleted',
      recurring_transactions: 'id, user_id, next_due_date, last_modified, dirty, deleted',
      bullion_history: 'timestamp',
    });

    // Version 12: Add history_logs
    this.version(12).stores({
      history_logs: 'id, user_id, entity_id, entity_type, timestamp, dirty, deleted',
    });

    // Version 13: Add medications and medication_profiles
    this.version(13).stores({
      medication_profiles: 'id, user_id, last_modified, dirty, deleted',
      medications: 'id, user_id, profile_id, last_modified, dirty, deleted',
    });

    // Version 14: Add salary table
    this.version(14).stores({
      salary: 'id, user_id, last_modified, dirty, deleted',
    });
  }
}

export const db = new AppDatabase();
