'use strict';

// Migration: 002_create_deployments_table
// Description: Creates the deployments table with indexes for metrics queries
// Created: 2024-01-01

module.exports = {
  up(db) {
    try {
      db.exec('PRAGMA foreign_keys = ON');

      db.exec(`
        CREATE TABLE IF NOT EXISTS deployments (
          id               INTEGER PRIMARY KEY AUTOINCREMENT,
          id_app           TEXT    NOT NULL,
          status           TEXT    NOT NULL CHECK(status IN ('SUCCESS', 'FAILED', 'IN_PROGRESS')),
          duration_seconds INTEGER NOT NULL CHECK(duration_seconds >= 0),
          deployed_by      INTEGER NOT NULL,
          metadata         TEXT    DEFAULT NULL,
          created_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (deployed_by) REFERENCES users(id) ON DELETE RESTRICT
        )
      `);

      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_deployments_id_app
        ON deployments (id_app)
      `);

      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_deployments_id_app_created_at
        ON deployments (id_app, created_at)
      `);
    } catch (err) {
      console.error('[Migration 002] Error applying migration (up):', err);
      throw err;
    }
  },

  down(db) {
    try {
      db.exec('DROP INDEX IF EXISTS idx_deployments_id_app_created_at');
      db.exec('DROP INDEX IF EXISTS idx_deployments_id_app');
      db.exec('DROP TABLE IF EXISTS deployments');
    } catch (err) {
      console.error('[Migration 002] Error reverting migration (down):', err);
      throw err;
    }
  }
};