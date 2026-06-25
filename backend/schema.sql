-- MySQL Database Schema for Mint Mosaic Hub
-- Run this script to create all necessary tables and relationships

-- Create database (uncomment if needed)
CREATE DATABASE IF NOT EXISTS mishub_db;
USE mishub_db;

-- Users table (replacing Supabase auth.users)
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Fixed dues table
CREATE TABLE fixed_dues (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  recurrence ENUM('daily', 'weekly', 'monthly', 'quarterly', 'semi-annually', 'annually') NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE,
  last_modified BIGINT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions table (moved after fixed_dues to avoid FK reference error)
CREATE TABLE transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  source ENUM('transaction', 'fixed-due', 'vibes-salary') DEFAULT 'transaction',
  source_id VARCHAR(36) NULL, -- FK to fixed_dues.id or vibes_salary.payments.id if applicable
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE,
  last_modified BIGINT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES fixed_dues(id) ON DELETE SET NULL -- Only if source='fixed-due'
);

-- Vibes salary table (one per user)
CREATE TABLE vibes_salary (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payments JSON DEFAULT ('[]'), -- JSON array of payments
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bullion holdings table (one per user)
CREATE TABLE bullion_holdings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  gold DECIMAL(10,2) NOT NULL DEFAULT 0,
  silver DECIMAL(10,2) NOT NULL DEFAULT 0,
  platinum DECIMAL(10,2) NOT NULL DEFAULT 0,
  palladium DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE,
  last_modified BIGINT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Test items table
CREATE TABLE test_items (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  last_modified BIGINT NOT NULL,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_source ON transactions(source);
CREATE INDEX idx_transactions_last_modified ON transactions(last_modified);
CREATE INDEX idx_transactions_deleted ON transactions(deleted);
CREATE INDEX idx_fixed_dues_user_id ON fixed_dues(user_id);
CREATE INDEX idx_fixed_dues_due_date ON fixed_dues(due_date);
CREATE INDEX idx_fixed_dues_last_modified ON fixed_dues(last_modified);
CREATE INDEX idx_fixed_dues_deleted ON fixed_dues(deleted);
CREATE INDEX idx_vibes_salary_user_id ON vibes_salary(user_id);
CREATE INDEX idx_vibes_salary_last_modified ON vibes_salary(last_modified);
CREATE INDEX idx_vibes_salary_deleted ON vibes_salary(deleted);
CREATE INDEX idx_bullion_holdings_user_id ON bullion_holdings(user_id);
CREATE INDEX idx_bullion_holdings_last_modified ON bullion_holdings(last_modified);
CREATE INDEX idx_bullion_holdings_deleted ON bullion_holdings(deleted);
CREATE INDEX idx_test_items_user_id ON test_items(user_id);
CREATE INDEX idx_test_items_last_modified ON test_items(last_modified);
CREATE INDEX idx_test_items_deleted ON test_items(deleted);

-- Optional: Add a trigger to update updated_at on changes (MySQL 5.7+)
-- DELIMITER ;;
-- CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP;;
-- CREATE TRIGGER update_fixed_dues_updated_at BEFORE UPDATE ON fixed_dues FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP;;
-- CREATE TRIGGER update_vibes_salary_updated_at BEFORE UPDATE ON vibes_salary FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP;;
-- CREATE TRIGGER update_bullion_holdings_updated_at BEFORE UPDATE ON bullion_holdings FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP;;
-- CREATE TRIGGER update_test_items_updated_at BEFORE UPDATE ON test_items FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP;;
-- DELIMITER ;
