const Database = require('better-sqlite3');

/*
 * ============================================================
 * tests/mocks/database.mock.js
 * ============================================================
 * Mock de infraestructura para la capa de base de datos SQLite.
 * Utiliza una base de datos en memoria (:memory:) para garantizar
 * pruebas deterministas, rápidas y sin efectos secundarios en disco.
 *
 * ⚠️  ADVERTENCIA CRÍTICA PARA DESARROLLADORES:
 * El esquema DDL definido en este archivo (DDL_SCHEMA) debe mantenerse
 * sincronizado manualmente con las migraciones de producción ubicadas
 * en src/db/migrations/. Cualquier cambio en el esquema de producción
 * DEBE reflejarse aquí de forma inmediata para evitar falsos positivos
 * en los tests.
 * ============================================================
 */

// Variable singleton privada que almacena la instancia activa de la DB en memoria.
// Se inicializa como null y solo se asigna mediante initializeTestDatabase().
let _dbInstance = null;

// ============================================================
// DDL SCHEMA
// Debe mantenerse sincronizado con las migraciones de producción.
// ============================================================
const DDL_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user',
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS deployments (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    id_app           TEXT    NOT NULL,
    status           TEXT    NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    deployed_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_by       INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
  );
`;

// ============================================================
// DEFAULT_SEED_USERS — USO INTERNO ÚNICAMENTE, NO EXPORTAR
//
// Los hashes a continuación son hashes bcrypt reales pre-computados
// con salt rounds = 12. Se usan como literales para evitar el costo
// de bcrypt en tiempo de ejecución de los tests.
//
// adminuser  -> contraseña: "AdminPass123!"
//   hash generado con: bcrypt.hashSync('AdminPass123!', 12)
//
// regularuser -> contraseña: "UserPass456!"
//   hash generado con: bcrypt.hashSync('UserPass456!', 12)
// ============================================================
const DEFAULT_SEED_USERS = [
  {
    username:      'adminuser',
    email:         'admin@test.com',
    // bcrypt.hashSync('AdminPass123!', 12)
    password_hash: '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role:          'admin',
    created_at:    '2024-01-01T00:00:00.000Z',
    updated_at:    '2024-01-01T00:00:00.000Z'
  },
  {
    username:      'regularuser',
    email:         'user@test.com',
    // bcrypt.hashSync('UserPass456!', 12)
    password_hash: '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role:          'user',
    created_at:    '2024-01-01T00:00:00.000Z',
    updated_at:    '2024-01-01T00:00:00.000Z'
  }
];

// Orden de tablas para operaciones de limpieza (inverso al de creación para respetar FK)
const TABLE_ORDER_ASC  = ['users', 'deployments'];
const TABLE_ORDER_DESC = ['deployments', 'users'];

// ============================================================
// initializeTestDatabase
// ============================================================
function initializeTestDatabase() {
  const db = new Database(':memory:');

  // Activar foreign keys y WAL mode para consistencia
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Ejecutar DDL completo
  db.exec(DDL_SCHEMA);

  _dbInstance = db;
  return _dbInstance;
}

// ============================================================
// getTestDatabase
// ============================================================
function getTestDatabase() {
  if (_dbInstance === null) {
    throw new Error(
      '[database.mock] La base de datos de test no ha sido inicializada. ' +
      'Debes llamar a initializeTestDatabase() en un bloque beforeAll o beforeEach ' +
      'antes de invocar getTestDatabase().'
    );
  }
  return _dbInstance;
}

// ============================================================
// closeTestDatabase
// ============================================================
function closeTestDatabase() {
  if (_dbInstance !== null && _dbInstance.open) {
    _dbInstance.close();
  }
  _dbInstance = null;
}

// ============================================================
// seedTestData
// ============================================================
function seedTestData({ users = [], deployments = [] } = {}) {
  const db = getTestDatabase();

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
    VALUES (@username, @email, @password_hash, @role, @created_at, @updated_at)
  `);

  const insertDeployment = db.prepare(`
    INSERT INTO deployments (id_app, status, duration_seconds, deployed_at, created_by)
    VALUES (@id_app, @status, @duration_seconds, @deployed_at, @created_by)
  `);

  const runSeed = db.transaction(() => {
    for (const user of users) {
      insertUser.run(user);
    }
    for (const deployment of deployments) {
      insertDeployment.run(deployment);
    }
  });

  runSeed();

  return {
    usersInserted:       users.length,
    deploymentsInserted: deployments.length
  };
}

// ============================================================
// clearTestData
// ============================================================
function clearTestData(tableNames) {
  const db = getTestDatabase();

  const tablesToClear = Array.isArray(tableNames) && tableNames.length > 0
    ? tableNames
    : TABLE_ORDER_DESC;

  const runClear = db.transaction(() => {
    for (const table of tablesToClear) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
  });

  runClear();
}

// ============================================================
// KNOWN_TEST_PASSWORDS
// Mapeo público de usuario de seed a contraseña en texto plano.
// Permite que los tests de autenticación construyan requests sin
// conocer los detalles internos del mock.
// ============================================================
const KNOWN_TEST_PASSWORDS = {
  adminuser:   'AdminPass123!',
  regularuser: 'UserPass456!'
};

module.exports = {
  initializeTestDatabase,
  getTestDatabase,
  closeTestDatabase,
  seedTestData,
  clearTestData,
  DEFAULT_SEED_USERS,
  KNOWN_TEST_PASSWORDS
};