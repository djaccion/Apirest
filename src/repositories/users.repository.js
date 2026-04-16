const db = require('../config/database');

class UsersRepository {
  constructor(database) {
    this.db = database;

    this._findAllStmt = this.db.prepare(
      `SELECT id, username, email, role, created_at, updated_at FROM users`
    );

    this._findByIdStmt = this.db.prepare(
      `SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?`
    );

    this._findByEmailStmt = this.db.prepare(
      `SELECT id, username, email, password, role, created_at, updated_at FROM users WHERE email = ?`
    );

    this._findByUsernameStmt = this.db.prepare(
      `SELECT id, username, email, password, role, created_at, updated_at FROM users WHERE username = ?`
    );

    this._createStmt = this.db.prepare(
      `INSERT INTO users (username, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );

    this._removeStmt = this.db.prepare(
      `DELETE FROM users WHERE id = ?`
    );

    this._existsByEmailStmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM users WHERE email = ? AND id != ?`
    );

    this._existsByEmailNoExcludeStmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM users WHERE email = ?`
    );

    this._existsByUsernameStmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM users WHERE username = ? AND id != ?`
    );

    this._existsByUsernameNoExcludeStmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM users WHERE username = ?`
    );
  }

  findAll() {
    const rows = this._findAllStmt.all();
    return rows || [];
  }

  findById(id) {
    const row = this._findByIdStmt.get(id);
    return row || null;
  }

  findByEmail(email) {
    const row = this._findByEmailStmt.get(email);
    return row || null;
  }

  findByUsername(username) {
    const row = this._findByUsernameStmt.get(username);
    return row || null;
  }

  create({ username, email, password, role }) {
    const result = this._createStmt.run(username, email, password, role);
    return this.findById(result.lastInsertRowid);
  }

  update(id, data) {
    const forbiddenKeys = ['id', 'created_at'];
    const allowedData = Object.keys(data)
      .filter((key) => !forbiddenKeys.includes(key))
      .reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {});

    const keys = Object.keys(allowedData);

    if (keys.length === 0) {
      return this.findById(id);
    }

    const setClauses = keys.map((key) => `${key} = ?`);
    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    const values = keys.map((key) => allowedData[key]);
    values.push(id);

    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    stmt.run(...values);

    return this.findById(id);
  }

  remove(id) {
    const result = this._removeStmt.run(id);
    return result.changes > 0;
  }

  existsByEmail(email, excludeId = null) {
    if (excludeId !== null) {
      const row = this._existsByEmailStmt.get(email, excludeId);
      return row.count > 0;
    }
    const row = this._existsByEmailNoExcludeStmt.get(email);
    return row.count > 0;
  }

  existsByUsername(username, excludeId = null) {
    if (excludeId !== null) {
      const row = this._existsByUsernameStmt.get(username, excludeId);
      return row.count > 0;
    }
    const row = this._existsByUsernameNoExcludeStmt.get(username);
    return row.count > 0;
  }
}

module.exports = new UsersRepository(db);
module.exports.UsersRepository = UsersRepository;