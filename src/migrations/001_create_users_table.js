'use strict';

/*
 * Migración: 001
 * Nombre: create_users_table
 * Fecha de creación: 2024-01-15
 * Descripción: Creación de tabla principal de usuarios con soporte RBAC
 * Dependencias previas: ninguna (es la migración base)
 */

/**
 * up - Crea la tabla users y sus índices asociados
 * @param {import('better-sqlite3').Database} db - Instancia activa de conexión better-sqlite3
 */
function up(db) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        -- Identificador único autogenerado por SQLite
        id            INTEGER PRIMARY KEY AUTOINCREMENT,

        -- Nombre de usuario para login, debe ser único en toda la tabla
        username      TEXT    NOT NULL UNIQUE,

        -- Dirección de correo electrónico, debe ser única en toda la tabla
        email         TEXT    NOT NULL UNIQUE,

        -- Hash bcrypt de la contraseña; nunca se almacena texto plano
        password_hash TEXT    NOT NULL,

        -- Rol del usuario para control de acceso RBAC; solo 'admin' o 'user' son valores válidos
        role          TEXT    NOT NULL DEFAULT 'user'
                              CHECK (role IN ('admin', 'user')),

        -- Booleano lógico en SQLite: 1 = activo, 0 = inactivo; permite soft-delete sin eliminar registros
        is_active     INTEGER NOT NULL DEFAULT 1,

        -- Timestamp ISO 8601 UTC generado automáticamente por SQLite en el momento de la inserción
        created_at    TEXT    NOT NULL DEFAULT (datetime('now')),

        -- Timestamp ISO 8601 UTC; debe actualizarse manualmente en cada UPDATE desde la capa de repositorio
        updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
      );
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
      CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);
    `);
  } catch (error) {
    throw new Error(
      `Migration 001_create_users_table [up] failed: ${error.message}`,
      { cause: error }
    );
  }
}

/**
 * down - Elimina la tabla users (rollback)
 * Los índices asociados son eliminados automáticamente por SQLite al hacer DROP TABLE.
 * @param {import('better-sqlite3').Database} db - Instancia activa de conexión better-sqlite3
 */
function down(db) {
  try {
    db.exec(`DROP TABLE IF EXISTS users;`);
  } catch (error) {
    throw new Error(
      `Migration 001_create_users_table [down] failed: ${error.message}`,
      { cause: error }
    );
  }
}

module.exports = { up, down };