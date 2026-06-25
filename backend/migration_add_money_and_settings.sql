-- Add money_holdings table
CREATE TABLE IF NOT EXISTS money_holdings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  holdings JSON,
  bill_counts JSON,
  last_modified BIGINT,
  deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id VARCHAR(36) PRIMARY KEY,
  theme VARCHAR(20) DEFAULT 'light',
  last_modified BIGINT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
