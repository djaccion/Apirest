const db = require('../config/database');

class DeploymentRepository {
  initialize() {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS deployments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_app TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
          deployed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          duration_seconds REAL,
          deployed_by INTEGER,
          metadata TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      throw new Error(`DeploymentRepository.initialize: ${error.message}`);
    }
  }

  /**
   * Crea un nuevo registro de despliegue en la base de datos.
   * @param {Object} deploymentData - Datos del despliegue a registrar.
   * @param {string} deploymentData.id_app - Identificador de la aplicación desplegada.
   * @param {string} deploymentData.status - Estado del despliegue (SUCCESS, FAILED, IN_PROGRESS).
   * @param {string} deploymentData.deployed_at - Timestamp ISO 8601 del despliegue.
   * @param {number} [deploymentData.duration_seconds] - Duración del despliegue en segundos.
   * @param {number|string} [deploymentData.deployed_by] - Referencia al usuario que ejecutó el despliegue.
   * @param {string} [deploymentData.metadata] - JSON serializado con información adicional.
   * @returns {Object} El objeto del despliegue recién creado incluyendo el id generado.
   */
  create(deploymentData) {
    try {
      const { id_app, status, deployed_at, duration_seconds, deployed_by, metadata } = deploymentData;

      const stmt = db.prepare(`
        INSERT INTO deployments (id_app, status, deployed_at, duration_seconds, deployed_by, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        id_app,
        status,
        deployed_at || new Date().toISOString(),
        duration_seconds !== undefined ? duration_seconds : null,
        deployed_by !== undefined ? deployed_by : null,
        metadata !== undefined ? metadata : null
      );

      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`DeploymentRepository.create: ${error.message}`);
    }
  }

  /**
   * Busca un despliegue por su ID.
   * @param {number|string} id - ID del despliegue.
   * @returns {Object|null} El objeto del despliegue o null si no existe.
   */
  findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM deployments WHERE id = ?');
      const row = stmt.get(id);
      return row || null;
    } catch (error) {
      throw new Error(`DeploymentRepository.findById: ${error.message}`);
    }
  }

  /**
   * Retorna una lista de despliegues aplicando filtros opcionales.
   * @param {Object} [filters={}] - Filtros opcionales.
   * @param {string} [filters.id_app] - Filtrar por identificador de aplicación.
   * @param {string} [filters.status] - Filtrar por estado del despliegue.
   * @param {number} [filters.limit=100] - Límite de registros a retornar.
   * @param {number} [filters.offset=0] - Desplazamiento para paginación.
   * @returns {Object[]} Array de objetos de despliegue.
   */
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

      let query = 'SELECT * FROM deployments';

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const limit = filters.limit !== undefined ? parseInt(filters.limit, 10) : 100;
      const offset = filters.offset !== undefined ? parseInt(filters.offset, 10) : 0;

      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const stmt = db.prepare(query);
      const rows = stmt.all(...params);
      return rows || [];
    } catch (error) {
      throw new Error(`DeploymentRepository.findAll: ${error.message}`);
    }
  }

  /**
   * Calcula el tiempo promedio de despliegue exitoso para una aplicación en un rango de días.
   * @param {string|number} id_app - Identificador de la aplicación.
   * @param {number} [days=7] - Número de días hacia atrás a considerar.
   * @returns {number|null} Promedio en segundos o null si no hay registros.
   */
  getAverageDeploymentTime(id_app, days = 7) {
    try {
      const stmt = db.prepare(`
        SELECT AVG(duration_seconds) AS average_time
        FROM deployments
        WHERE id_app = ?
          AND status = 'SUCCESS'
          AND deployed_at >= datetime('now', ? )
      `);

      const row = stmt.get(id_app, `-${days} days`);

      if (!row || row.average_time === null || row.average_time === undefined) {
        return null;
      }

      return parseFloat(row.average_time);
    } catch (error) {
      throw new Error(`DeploymentRepository.getAverageDeploymentTime: ${error.message}`);
    }
  }

  /**
   * Actualiza los campos de un despliegue existente.
   * @param {number|string} id - ID del despliegue a actualizar.
   * @param {Object} updateData - Campos a actualizar.
   * @returns {Object|null} El objeto actualizado completo o null si no existe.
   */
  update(id, updateData) {
    try {
      const forbiddenFields = ['id', 'created_at'];
      const fields = Object.keys(updateData).filter(key => !forbiddenFields.includes(key));

      if (fields.length === 0) {
        return this.findById(id);
      }

      const setClauses = fields.map(field => `${field} = ?`);
      const params = fields.map(field => updateData[field]);
      params.push(id);

      const query = `UPDATE deployments SET ${setClauses.join(', ')} WHERE id = ?`;
      const stmt = db.prepare(query);
      const result = stmt.run(...params);

      if (result.changes === 0) {
        return null;
      }

      return this.findById(id);
    } catch (error) {
      throw new Error(`DeploymentRepository.update: ${error.message}`);
    }
  }

  /**
   * Elimina un despliegue por su ID.
   * @param {number|string} id - ID del despliegue a eliminar.
   * @returns {boolean} true si se eliminó al menos una fila, false en caso contrario.
   */
  delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM deployments WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`DeploymentRepository.delete: ${error.message}`);
    }
  }
}

module.exports = new DeploymentRepository();