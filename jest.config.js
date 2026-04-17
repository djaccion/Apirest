module.exports = {
  // Entorno de ejecución backend puro Node.js, sin DOM
  testEnvironment: 'node',

  // Detectar archivos de prueba únicamente dentro de tests/
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],

  // Activar recolección de cobertura
  collectCoverage: true,

  // Archivos fuente a analizar para cobertura
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/docs/**',
    '!src/server.js',
    '!src/**/index.js'
  ],

  // Directorio de salida de reportes de cobertura
  coverageDirectory: 'coverage',

  // Formatos de reporte de cobertura
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  // Umbrales mínimos de cobertura — falla el pipeline si no se alcanzan (DevSecOps)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Archivo de setup para variables de entorno y configuración previa a los tests
  setupFiles: [
    '<rootDir>/tests/setup.js'
  ],

  // Sin transformaciones Babel — Node.js 20 LTS con CommonJS nativo no lo requiere
  // transform: {},

  // Ignorar transformación de dependencias externas
  transformIgnorePatterns: [
    '/node_modules/'
  ],

  // Aislamiento total entre pruebas: limpieza automática de mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Timeout global de 10 segundos para pruebas de integración con Supertest
  testTimeout: 10000,

  // Mostrar detalle de cada test en consola para trazabilidad en CI/CD (Jira XP-9)
  verbose: true

  // moduleNameMapper: {}
  // Previsto para expansión futura con alias de importación del proyecto
};