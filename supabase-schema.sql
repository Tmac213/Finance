-- Supabase Database Schema for Mint Mosaic Hub

-- Note: JWT secret is automatically managed by Supabase
-- No need to set app.jwt_secret manually

-- Create tables

-- Transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixed dues table
CREATE TABLE fixed_dues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  recurrence TEXT NOT NULL CHECK (recurrence IN ('daily', 'weekly', 'monthly', 'quarterly', 'semi-annually', 'annually')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vibes salary table (one per user)
CREATE TABLE vibes_salary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bullion holdings table (one per user)
CREATE TABLE bullion_holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  gold DECIMAL(10,2) NOT NULL DEFAULT 0,
  silver DECIMAL(10,2) NOT NULL DEFAULT 0,
  platinum DECIMAL(10,2) NOT NULL DEFAULT 0,
  palladium DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibes_salary ENABLE ROW LEVEL SECURITY;
ALTER TABLE bullion_holdings ENABLE ROW LEVEL SECURITY;

-- Create policies for user data isolation
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own fixed_dues" ON fixed_dues
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fixed_dues" ON fixed_dues
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fixed_dues" ON fixed_dues
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fixed_dues" ON fixed_dues
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own vibes_salary" ON vibes_salary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vibes_salary" ON vibes_salary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vibes_salary" ON vibes_salary
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vibes_salary" ON vibes_salary
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own bullion_holdings" ON bullion_holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bullion_holdings" ON bullion_holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bullion_holdings" ON bullion_holdings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bullion_holdings" ON bullion_holdings
  FOR DELETE USING (auth.uid() = user_id);



-- Test items table
CREATE TABLE test_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for test_items
ALTER TABLE test_items ENABLE ROW LEVEL SECURITY;

-- Create policies for test_items
CREATE POLICY "Users can view their own test_items" ON test_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test_items" ON test_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test_items" ON test_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own test_items" ON test_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_fixed_dues_user_id ON fixed_dues(user_id);
CREATE INDEX idx_vibes_salary_user_id ON vibes_salary(user_id);
CREATE INDEX idx_bullion_holdings_user_id ON bullion_holdings(user_id);
CREATE INDEX idx_test_items_user_id ON test_items(user_id);
