'use strict';

/**
 * @fileoverview Base repository class providing generic CRUD operations for SQLite via better-sqlite3.
 * All concrete repositories must extend this class.
 */

/**
 * Validates that a field name contains only alphanumeric characters and underscores.
 * This prevents SQL injection via dynamic column names.
 * @param {string} fieldName - The field name to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
const isValidFieldName = (fieldName) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName);

/**
 * Abstract base repository class encapsulating generic SQLite data access operations.
 * Do NOT instantiate this class directly; extend it in concrete repository implementations.
 */
class BaseRepository {
  /**
   * Creates a BaseRepository instance.
   * NOTE: This is an abstract class and should not be instantiated directly.
   * Concrete repositories must extend this class and call super(db, tableName).
   *
   * @param {import('better-sqlite3').Database} db - The better-sqlite3 database connection instance.
   * @param {string} tableName - The name of the database table this repository operates on.
   * @throws {Error} If db or tableName are missing or of incorrect type.
   */
  constructor(db, tableName) {
    if (!db || typeof db !== 'object' || typeof db.prepare !== 'function') {
      throw new Error(
        'BaseRepository: Invalid or missing "db" parameter. Expected a better-sqlite3 Database instance.'
      );
    }

    if (!tableName || typeof tableName !== 'string' || tableName.trim() === '') {
      throw new Error(
        'BaseRepository: Invalid or missing "tableName" parameter. Expected a non-empty string.'
      );
    }

    if (!isValidFieldName(tableName)) {
      throw new Error(
        `BaseRepository: "tableName" contains invalid characters: "${tableName}". Only alphanumeric characters and underscores are allowed.`
      );
    }

    /** @private */
    this._db = db;

    /** @protected */
    this.tableName = tableName;
  }

  /**
   * Returns the database connection instance.
   * @protected
   * @returns {import('better-sqlite3').Database} The database connection.
   */
  get db() {
    return this._db;
  }

  /**
   * Retrieves all records from the table with optional pagination and ordering.
   *
   * @param {Object} [options={}] - Query options.
   * @param {number} [options.limit] - Maximum number of records to return.
   * @param {number} [options.offset] - Number of records to skip.
   * @param {string} [options.orderBy] - Column name to order results by.
   * @param {'ASC'|'DESC'} [options.orderDir='ASC'] - Order direction.
   * @returns {Array<Object>} Array of records, empty array if none found.
   * @throws {Error} If the database operation fails.
   */
  findAll(options = {}) {
    try {
      const { limit, offset, orderBy, orderDir = 'ASC' } = options;

      let query = `SELECT * FROM ${this.tableName}`;

      if (orderBy) {
        if (!isValidFieldName(orderBy)) {
          throw new Error(
            `findAll: Invalid "orderBy" field name: "${orderBy}". Only alphanumeric characters and underscores are allowed.`
          );
        }
        const direction = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${orderBy} ${direction}`;
      }

      if (typeof limit === 'number' && Number.isInteger(limit) && limit > 0) {
        query += ` LIMIT ${limit}`;
      }

      if (typeof offset === 'number' && Number.isInteger(offset) && offset >= 0) {
        query += ` OFFSET ${offset}`;
      }

      const stmt = this._db.prepare(query);
      const rows = stmt.all();

      return rows || [];
    } catch (error) {
      throw new Error(
        `BaseRepository [${this.tableName}] findAll failed: ${error.message}`
      );
    }
  }

  /**
   * Finds a single record by its primary key ID.
   *
   * @param {number|string} id - The primary key value to search for.
   * @returns {Object|null} The found record object, or null if not found.
   * @throws {Error} If the database operation fails.
   */
  findById(id) {
    try {
      const stmt = this._db.prepare(
        `SELECT * FROM ${this.tableName} WHERE id = ?`
      );
      const row = stmt.get(id);

      return row || null;
    } catch (error) {
      throw new Error(
        `BaseRepository [${this.tableName}] findById failed for id "${id}": ${error.message}`
      );
    }
  }

  /**
   * Finds all records matching a specific field-value condition.
   *
   * @param {string} field - The column name to filter by.
   * @param {*} value - The value to match against the field.
   * @returns {Array<Object>} Array of matching records, empty array if none found.
   * @throws {Error} If the field name is invalid or the database operation fails.
   */
  findBy(field, value) {
    try {
      if (!field || typeof field !== 'string' || field.trim() === '') {
        throw new Error(
          `findBy: "field" parameter must be a non-empty string. Received: "${field}".`
        );
      }

      if (!isValidFieldName(field)) {
        throw new Error(
          `findBy: Invalid "field" name: "${field}". Only alphanumeric characters and underscores are allowed.`
        );
      }

      const stmt = this._db.prepare(
        `SELECT * FROM ${this.tableName} WHERE ${field} = ?`
      );
      const rows = stmt.all(value);

      return rows || [];
    } catch (error) {
      throw new Error(
        `BaseRepository [${this.tableName}] findBy failed for field "${field}": ${error.message}`
      );
    }
  }

  /**
   * Inserts a new record into the table.
   *
   * @param {Object} data - Plain object containing the fields and values to insert.
   * @returns {Object} The newly created record retrieved by its inserted row ID.
   * @throws {Error} If data is empty, invalid, or the database operation fails.
   */
  create(data) {
    try {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error(
          'create: "data" parameter must be a non-null plain object.'
        );
      }

      const keys = Object.keys(data);

      if (keys.length === 0) {
        throw new Error(
          'create: "data" object must contain at least one field to insert.'
        );
      }

      for (const key of keys) {
        if (!isValidFieldName(key)) {
          throw new Error(
            `create: Invalid field name "${key}" in data object. Only alphanumeric characters and underscores are allowed.`
          );
        }
      }

      const columns = keys.join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map((key) => data[key]);

      const stmt = this._db.prepare(
        `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`
      );

      const result = stmt.run(...values);

      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(
        `BaseRepository [${this.tableName}] create failed: ${error.message}`
      );
    }
  }

  /**
   * Updates an existing record by its primary key ID.
   *
   * @param {number|string} id - The primary key of the record to update.
   * @param {Object} data - Plain object containing the fields and new values to set.
   * @returns {Object|null} The updated record object, or null if not found.
   * @throws {Error} If data is empty, contains invalid fields, or the database operation fails.
   */
  update(id, data) {
    try {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error(
          'update: "data" parameter must be a non-null plain object.'
        );
      }

      const filteredData = Object.keys(data)
        .filter((key) => key !== 'id')
        .reduce((acc, key) => {
          acc[key] = data[key];
          return acc;
        }, {});

      const keys = Object.keys(filteredData);

      if (keys.length === 0) {
        throw new Error(
          'update: No valid fields to update. "data" object is empty or contains only the "id" field.'
        );
      }

      for (const key of keys) {
        if (!isValidFieldName(key)) {
          throw new Error(
            `update: Invalid field name "${key}" in data object. Only alphanumeric characters and underscores are allowed.`
          );
        }
      }

      const setClause = keys.map((key) => `${key} = ?`).join(', ');
      const values = keys.map((key) => filteredData[key]);

      const stmt = this._db.prepare(
        `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`
      );

      stmt.run(...values, id);

      return this.findById(id);
    } catch (error) {
      throw new Error(
        `BaseRepository [${this.tableName}] update failed for id "${id}": ${error.message}`
      );
    }
  }

  /**
   * Deletes a record from the table by its primary key ID.
   *
   * @param {number|string} id - The primary key of the record to delete.
   * @returns {boolean} True if at least one row was deleted, false otherwise.
   * @throws {Error} If the database operation fails.
   */
  delete(id) {
    try {
      const stmt = this._db.prepare(
        `DELETE FROM ${this.tableName} WHERE id = ?`
      );

      const result = stmt.run(id);

      return result.changes > 0;
    } catch (error) {
      throw new Error(
        `BaseRepository [${this.tableName}] delete failed for id "${id}": ${error.message}`
      );
    }
  }

  /**
   * Counts the total number of records in the table, optionally filtered by conditions.
   *
   * @param {Object} [whereClause={}] - Optional key-value pairs representing WHERE conditions.
   * @returns {number} The count of matching records.
   * @throws {Error} If field names are invalid or the database operation fails.
   */
  count(whereClause = {}) {
    try {
      if (typeof whereClause !== 'object' || Array.isArray(whereClause)) {
        throw new Error(
          'count: "whereClause" parameter must be a plain object.'
        );
      }

      const keys = Object.keys(whereClause);
      let query = `SELECT COUNT(*) AS total FROM ${this.tableName}`;
      let values = [];

      if (keys.length > 0) {
        for (const key of keys) {
          if (!isValidFieldName(key)) {
            throw new Error(
              `count: Invalid field name "${key}" in whereClause. Only alphanumeric characters and underscores are allowed.`
            );
          }
        }

        const conditions = keys.map((key) => `${key} = ?`).join(' AND ');
        values = keys.map((key) => whereClause[key]);
        query += ` WHERE ${conditions}`;
      }

      const stmt = this._db.prepare(query);
      const row = stmt.get(...values);

      return row ? row.total : 0;
    } catch (error) {
      throw new Error(
        `BaseRepository [${this.tableName}] count failed: ${error.message}`
      );
    }
  }
}

module.exports = BaseRepository;