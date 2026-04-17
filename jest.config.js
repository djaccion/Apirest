module.exports = {
  testEnvironment: 'node',

  roots: ['<rootDir>/src'],

  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],

  collectCoverage: true,

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/server.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!src/**/swagger*.js',
    '!src/config/swagger*.js',
    '!src/docs/**'
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  coverageDirectory: 'coverage',

  setupFiles: ['<rootDir>/src/tests/setup.js'],

  testTimeout: 10000,

  clearMocks: true,

  restoreMocks: true,

  resetMocks: false,

  verbose: true
};