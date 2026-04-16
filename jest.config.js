module.exports = {
  testEnvironment: 'node',

  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],

  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  testTimeout: 10000,

  collectCoverage: true,

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
    '!src/migrations/**',
    '!src/seeds/**'
  ],

  coverageDirectory: 'coverage',

  coverageThresholds: {
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
    'html',
    'json-summary'
  ],

  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports',
        outputName: 'junit.xml',
        classNameTemplate: '{filepath}',
        titleTemplate: '{title}'
      }
    ]
  ],

  moduleFileExtensions: [
    'js',
    'json'
  ],

  moduleNameMapper: {
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },

  globalSetup: '<rootDir>/src/tests/setup/globalSetup.js',

  globalTeardown: '<rootDir>/src/tests/setup/globalTeardown.js',

  setupFilesAfterFramework: ['<rootDir>/src/tests/setup/jest.setup.js'],

  automock: false,

  clearMocks: true,

  resetModules: false,

  maxWorkers: '50%',

  // Variables de entorno para testing deben definirse en .env.test
  // El archivo globalSetup se encarga de cargar dicho archivo antes de ejecutar la suite
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};