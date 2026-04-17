module.exports = {
  testEnvironment: 'node',

  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],

  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  collectCoverage: true,

  collectCoverageFrom: [
    'src/routes/**/*.js',
    'src/controllers/**/*.js',
    'src/middlewares/**/*.js',
    'src/config/**/*.js',
    '!src/**/index.js',
    '!**/node_modules/**'
  ],

  coverageDirectory: 'coverage',

  coverageReporters: [
    'text',
    'lcov',
    'json-summary'
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  moduleFileExtensions: [
    'js',
    'json'
  ],

  testTimeout: 10000,

  globalSetup: './tests/setup.js',

  globalTeardown: './tests/teardown.js',

  verbose: true
};