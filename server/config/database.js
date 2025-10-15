const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/tickets.db');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          this.initializeTables();
          resolve(this.db);
        }
      });
    });
  }

  initializeTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createTicketsTable = `
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        summary TEXT,
        category VARCHAR(50),
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'open',
        created_by INTEGER NOT NULL,
        assigned_to INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (created_by) REFERENCES users (id),
        FOREIGN KEY (assigned_to) REFERENCES users (id)
      )
    `;

    const createCommentsTable = `
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    const createAttachmentsTable = `
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
      )
    `;

    // Execute table creation with proper sequencing
    this.db.serialize(() => {
      this.db.run(createUsersTable, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
        } else {
          console.log('✅ Users table created');
          // Insert default admin user after users table is created
          this.insertDefaultUser();
        }
      });
      
      this.db.run(createTicketsTable, (err) => {
        if (err) {
          console.error('Error creating tickets table:', err.message);
        } else {
          console.log('✅ Tickets table created');
        }
      });
      
      this.db.run(createCommentsTable, (err) => {
        if (err) {
          console.error('Error creating comments table:', err.message);
        } else {
          console.log('✅ Comments table created');
        }
      });
      
      this.db.run(createAttachmentsTable, (err) => {
        if (err) {
          console.error('Error creating attachments table:', err.message);
        } else {
          console.log('✅ Attachments table created');
        }
      });
    });
  }

  insertDefaultUser() {
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    
    const insertAdmin = `
      INSERT OR IGNORE INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@ticketsystem.com', ?, 'admin')
    `;

    this.db.run(insertAdmin, [defaultPassword], (err) => {
      if (err) {
        console.error('Error creating default admin user:', err.message);
      } else {
        console.log('✅ Default admin user created (username: admin, password: admin123)');
      }
    });
  }

  getDatabase() {
    return this.db;
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();
