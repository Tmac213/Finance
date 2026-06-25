-- Migration: Add start_date and end_date columns to fixed_dues table
-- Run this if your database was created with the old schema

USE mishub_db;

-- Add start_date and end_date columns if they don't exist
ALTER TABLE fixed_dues 
  ADD COLUMN IF NOT EXISTS start_date DATE NULL AFTER recurrence,
  ADD COLUMN IF NOT EXISTS end_date DATE NULL AFTER start_date;

-- Note: If your MySQL version doesn't support IF NOT EXISTS, use:
-- ALTER TABLE fixed_dues ADD COLUMN start_date DATE NULL;
-- ALTER TABLE fixed_dues ADD COLUMN end_date DATE NULL;

