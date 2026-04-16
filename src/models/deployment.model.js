const VALID_STATUSES = ['SUCCESS', 'FAILED', 'IN_PROGRESS'];

function _parseMetadata(record) {
  if (!record) return record;
  if (record.metadata === null || record.metadata === undefined) {
    return { ...record, metadata: null };
  }
  try {
    return { ...record, metadata: JSON.parse(record.metadata) };
  } catch {
    return { ...record, metadata: null };
  }
}

class DeploymentModel {
  constructor(db) {
    this.db = db;
  }

  initialize() {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS deployments (
          id               INTEGER PRIMARY KEY AUTOINCREMENT,
          id_app           TEXT    NOT NULL,
          status           TEXT    NOT NULL CHECK(status IN ('SUCCESS', 'FAILED', 'IN_PROGRESS')),
          deployed_at      TEXT    NOT NULL,
          duration_seconds INTEGER,
          deployed_by      TEXT    NOT NULL,
          metadata         TEXT,
          created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
        )
      `);
    } catch (err) {
      throw new Error(`DeploymentModel.initialize: ${err.message}`);
    }
  }

  create(deploymentData) {
    try {
      const { id_app, status, deployed_at, duration_seconds, deployed_by, metadata } = deploymentData;

      const serializedMetadata =
        metadata !== null && metadata !== undefined
          ? typeof metadata === 'object'
            ? JSON.stringify(metadata)
            : metadata
          : null;

      const stmt = this.db.prepare(`
        INSERT INTO deployments (id_app, status, deployed_at, duration_seconds, deployed_by, metadata)
        VALUES (@id_app, @status, @deployed_at, @duration_seconds, @deployed_by, @metadata)
      `);

      const result = stmt.run({
        id_app,
        status,
        deployed_at,
        duration_seconds: duration_seconds !== undefined ? duration_seconds : null,
        deployed_by,
        metadata: serializedMetadata,
      });

      return this.findById(result.lastInsertRowid);
    } catch (err) {
      throw new Error(`DeploymentModel.create: ${err.message}`);
    }
  }

  findById(id) {
    try {
      const stmt = this.db.prepare('SELECT * FROM deployments WHERE id = ?');
      const record = stmt.get(id);
      if (!record) return null;
      return _parseMetadata(record);
    } catch (err) {
      throw new Error(`DeploymentModel.findById: ${err.message}`);
    }
  }

  findByAppId(id_app) {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM deployments WHERE id_app = ? ORDER BY deployed_at DESC'
      );
      const records = stmt.all(id_app);
      return records.map(_parseMetadata);
    } catch (err) {
      throw new Error(`DeploymentModel.findByAppId: ${err.message}`);
    }
  }

  findAverageTimeByAppId(id_app, days = 7) {
    try {
      const stmt = this.db.prepare(`
        SELECT
          AVG(duration_seconds) AS average_seconds,
          COUNT(*)              AS total_deployments
        FROM deployments
        WHERE id_app = ?
          AND status = 'SUCCESS'
          AND deployed_at >= datetime('now', ? || ' days')
      `);

      const row = stmt.get(id_app, `-${days}`);

      return {
        id_app,
        average_seconds: row.average_seconds !== null ? row.average_seconds : null,
        total_deployments: row.total_deployments,
      };
    } catch (err) {
      throw new Error(`DeploymentModel.findAverageTimeByAppId: ${err.message}`);
    }
  }

  findAll(filters = {}) {
    try {
      const conditions = [];
      const params = [];

      if (filters.id_app !== undefined && filters.id_app !== null) {
        conditions.push('id_app = ?');
        params.push(filters.id_app);
      }

      if (filters.status !== undefined && filters.status !== null) {
        conditions.push('status = ?');
        params.push(filters.status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `SELECT * FROM deployments ${whereClause} ORDER BY created_at DESC`;

      const stmt = this.db.prepare(sql);
      const records = stmt.all(...params);
      return records.map(_parseMetadata);
    } catch (err) {
      throw new Error(`DeploymentModel.findAll: ${err.message}`);
    }
  }

  updateStatus(id, status, duration_seconds) {
    try {
      if (!VALID_STATUSES.includes(status)) {
        throw new Error(
          `Invalid status value '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`
        );
      }

      let sql;
      let params;

      if (duration_seconds !== undefined && duration_seconds !== null) {
        sql = 'UPDATE deployments SET status = ?, duration_seconds = ? WHERE id = ?';
        params = [status, duration_seconds, id];
      } else {
        sql = 'UPDATE deployments SET status = ? WHERE id = ?';
        params = [status, id];
      }

      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);

      if (result.changes === 0) return null;
      return this.findById(id);
    } catch (err) {
      throw new Error(`DeploymentModel.updateStatus: ${err.message}`);
    }
  }

  deleteById(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM deployments WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (err) {
      throw new Error(`DeploymentModel.deleteById: ${err.message}`);
    }
  }
}

module.exports = DeploymentModel;