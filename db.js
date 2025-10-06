// config/database.js - Database Configuration
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data_pusher.db');

let db;
let isInitialized = false;

const initializeDatabase = () => {
  if (isInitialized) {
    return db;
  }

  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      process.exit(1);
    }
    console.log('Connected to SQLite database');
  });

  // Enable foreign keys
  // db.run('PRAGMA foreign_keys = ON');

  // Create tables
  db.serialize(() => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Accounts table
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
      account_id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      account_name TEXT NOT NULL,
      app_secret_token TEXT UNIQUE NOT NULL,
      website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      status TEXT DEFAULT 'Y' CHECK(status IN ('Y', 'N', 'D'))
    )`);

    // Create indexes for accounts
    db.run('CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email)');
    db.run('CREATE INDEX IF NOT EXISTS idx_accounts_app_secret_token ON accounts(app_secret_token)');
    db.run('CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)');

    // Destinations table
    db.run(`CREATE TABLE IF NOT EXISTS destinations (
      destination_id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      url TEXT NOT NULL,
      http_method TEXT NOT NULL,
      headers TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      status TEXT DEFAULT 'Y' CHECK(status IN ('Y', 'N', 'D')),
      FOREIGN KEY (account_id) REFERENCES accounts (account_id) ON DELETE CASCADE
    )`);

    // Create indexes for destinations
    db.run('CREATE INDEX IF NOT EXISTS idx_destinations_account_id ON destinations(account_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_destinations_status ON destinations(status)');

    //Roles table
    db.run(`CREATE TABLE IF NOT EXISTS roles (
      role_id INTEGER PRIMARY KEY,
      role_name TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )`);

    //Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      created_by TEXT,
      updated_by TEXT,
      status TEXT DEFAULT 'Y',
      FOREIGN KEY(created_by) REFERENCES users(user_id),
      FOREIGN KEY(updated_by) REFERENCES users(user_id)
    )`);

    // Create indexes for users
    db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    db.run('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');

    //Account members table
    db.run(`CREATE TABLE IF NOT EXISTS account_members (
      member_id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      created_by TEXT,
      updated_by TEXT,
      status TEXT DEFAULT 'Y',
      FOREIGN KEY(account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY(role_id) REFERENCES roles(role_id)
    )`);

    // Create indexes for account_members
    db.run('CREATE INDEX IF NOT EXISTS idx_account_members_account_id ON account_members(account_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_account_members_user_id ON account_members(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_account_members_role_id ON account_members(role_id)');

    //Logs table
    db.run(`CREATE TABLE IF NOT EXISTS logs (
      event_id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      destination_id TEXT NOT NULL,
      received_timestamp DATETIME NOT NULL,
      processed_timestamp DATETIME,
      received_data TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed')),
      error_message TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
      FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
    )`);

    // Create indexes for logs
    db.run('CREATE INDEX IF NOT EXISTS idx_logs_account_id ON logs(account_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_logs_destination_id ON logs(destination_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_logs_status ON logs(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_logs_received_timestamp ON logs(received_timestamp)');

    //Insert roles
    db.run(`INSERT OR IGNORE INTO roles (role_id, role_name, created_at, updated_at) VALUES 
      (1, 'Admin', datetime('now'), datetime('now')),
      (2, 'Normal user', datetime('now'), datetime('now'))
    `);
  });

  isInitialized = true;
  return db;
};

const getDatabase = () => {
  if (!isInitialized) {
    // Auto-initialize if not already done
    return initializeDatabase();
  }
  return db;
};

const closeDatabase = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
        isInitialized = false;
      }
    });
  }
};

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
