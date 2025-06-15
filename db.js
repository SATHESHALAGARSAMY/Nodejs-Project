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

    // Accounts table
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
      account_id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      account_name TEXT NOT NULL,
      website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'Y' CHECK(status IN ('Y', 'N', 'D'))
    )`);

    // Destinations table
    db.run(`CREATE TABLE IF NOT EXISTS destinations (
      destination_id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      url TEXT NOT NULL,
      http_method TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'Y' CHECK(status IN ('Y', 'N', 'D')),
      FOREIGN KEY (account_id) REFERENCES accounts (account_id) ON DELETE CASCADE
    )`);
    db.run('PRAGMA foreign_keys = ON');

    //Roles table
    db.run(`CREATE TABLE IF NOT EXISTS roles (
    role_id INTEGER PRIMARY KEY,
    role_name TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);`)

    //Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    status TEXT DEFAULT 'Y',
    FOREIGN KEY(account_id) REFERENCES accounts(account_id)
);`)
db.run('PRAGMA foreign_keys = ON');

//Account members table
db.run(`CREATE TABLE IF NOT EXISTS account_members (
    member_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    status TEXT DEFAULT 'Y',
    FOREIGN KEY(account_id) REFERENCES accounts(account_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    FOREIGN KEY(role_id) REFERENCES roles(role_id)
);`)
db.run('PRAGMA foreign_keys = ON');

//Logs table
db.run(`CREATE TABLE IF NOT EXISTS logs (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    destination_id INTEGER NOT NULL,
    received_timestamp DATETIME NOT NULL,
    received_data JSON NOT NULL,
    status TEXT DEFAULT 'Y',
    FOREIGN KEY (account_id) REFERENCES accounts(account_id),
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id)
);`)
db.run('PRAGMA foreign_keys = ON');

//Insert roles
db.run(`INSERT OR IGNORE INTO roles (role_id, role_name, created_at, updated_at) VALUES 
(1, 'Admin', datetime('now'), datetime('now')),
(2, 'Normal user', datetime('now'), datetime('now'));
`)
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