const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const NODE_ENV = process.env.NODE_ENV;
const DATABASE_PATH = process.env.DATABASE_PATH
  ? process.env.DATABASE_PATH
  : path.resolve('./data/database.sqlite');

let db;

try {
  if (NODE_ENV === 'test') {
    const verboseOption = NODE_ENV === 'development' ? console.log : undefined;
    db = new Database(':memory:', {
      ...(verboseOption && { verbose: verboseOption }),
    });
  } else {
    const dbDir = path.dirname(DATABASE_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const verboseOption = NODE_ENV === 'development' ? console.log : undefined;
    db = new Database(DATABASE_PATH, {
      ...(verboseOption && { verbose: verboseOption }),
    });
  }

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('temp_store = MEMORY');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS deployments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_app TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'FAILED', 'IN_PROGRESS')),
      deployment_time INTEGER NOT NULL,
      deployed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_deployments_id_app ON deployments(id_app);
  `);
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}

function closeDatabase() {
  db.close();
}

module.exports = { db, closeDatabase };