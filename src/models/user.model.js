'use strict';

/**
 * @fileoverview Modelo de datos para la entidad User en SQLite.
 * @description Define el esquema DDL de la tabla `users`, la función de inicialización
 * del modelo y las constantes de dominio asociadas al rol de usuario.
 * Representa la fuente de verdad del esquema de la entidad User en la capa de persistencia.
 *
 * @module models/user.model
 *
 * @warning SEGURIDAD: El campo `password_hash` es SENSIBLE y NUNCA debe incluirse
 * en respuestas HTTP de la API. La exclusión de este campo es responsabilidad
 * del Service Layer. Este modelo únicamente define su existencia en la base de datos.
 */

/**
 * Constantes de dominio para los roles válidos de un usuario.
 * Objeto inmutable para prevenir mutaciones accidentales en tiempo de ejecución.
 *
 * @constant {Object} USER_ROLES
 * @property {string} ADMIN - Rol de administrador con acceso completo a la API de gestión.
 * @property {string} USER  - Rol estándar con acceso restringido.
 */
const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
});

/**
 * Sentencia DDL para la creación de la tabla `users` en SQLite.
 * Se utiliza CREATE TABLE IF NOT EXISTS para garantizar idempotencia en el arranque.
 *
 * Notas de diseño:
 * - No se usan triggers para `updated_at`; la actualización manual desde el Repository
 *   garantiza compatibilidad con better-sqlite3 y control explícito del valor.
 * - `is_active` usa INTEGER (0/1) por ausencia de tipo BOOLEAN nativo en SQLite.
 * - El CHECK constraint en `role` garantiza integridad a nivel de base de datos,
 *   independientemente de validaciones en capas superiores.
 */
const CREATE_USERS_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS users (
    -- Clave primaria autoincremental. SQLite garantiza unicidad y no reutilización de IDs.
    id            INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,

    -- Nombre de usuario único utilizado para el proceso de login.
    username      TEXT    UNIQUE NOT NULL,

    -- Dirección de correo electrónico única. La normalización a minúsculas
    -- se aplica en el Service Layer antes de persistir.
    email         TEXT    UNIQUE NOT NULL,

    -- Hash bcrypt de la contraseña con salt rounds >= 12.
    -- CAMPO SENSIBLE: Nunca debe retornarse en respuestas HTTP de la API.
    password_hash TEXT    NOT NULL,

    -- Rol del usuario dentro del sistema.
    -- CHECK constraint a nivel de DB garantiza que solo se acepten valores válidos
    -- ('admin' o 'user'), sin depender de validaciones en la capa de aplicación.
    role          TEXT    NOT NULL DEFAULT 'user'
                          CHECK(role IN ('admin', 'user')),

    -- Estado activo/inactivo del usuario.
    -- SQLite no tiene tipo BOOLEAN nativo; se usa la convención INTEGER:
    --   1 = activo (true)
    --   0 = inactivo (false)
    is_active     INTEGER NOT NULL DEFAULT 1,

    -- Fecha y hora de creación del registro en formato ISO 8601.
    -- Se establece automáticamente por SQLite en el momento del INSERT.
    created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Fecha y hora de la última actualización del registro en formato ISO 8601.
    -- Debe actualizarse manualmente desde el Repository Layer en cada operación UPDATE.
    -- No se usa trigger para mantener compatibilidad con better-sqlite3 y control explícito.
    updated_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Inicializa el modelo de usuario ejecutando el DDL de creación de la tabla `users`.
 *
 * @description Recibe la instancia de base de datos por inyección de dependencia.
 * No abre ni gestiona conexiones; esa responsabilidad pertenece a la capa de infraestructura.
 * Utiliza `db.exec()` de better-sqlite3, que es síncrono y adecuado para operaciones DDL
 * de inicialización en el arranque de la aplicación.
 *
 * Los errores no se capturan internamente: cualquier fallo en la ejecución del DDL
 * se propaga hacia arriba para que el proceso de arranque falle de forma explícita y visible.
 *
 * @param {import('better-sqlite3').Database} db - Instancia activa de la base de datos
 *   better-sqlite3. Debe estar abierta y disponible antes de invocar esta función.
 * @returns {void}
 */
function initializeUserModel(db) {
  db.exec(CREATE_USERS_TABLE_DDL);
}

module.exports = {
  initializeUserModel,
  USER_ROLES,
};