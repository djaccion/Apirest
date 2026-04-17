module.exports = {
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'prettier',
  ],
  plugins: [
    'node',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { args: 'after-used' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'node/no-unsupported-features/es-syntax': ['error', { version: '20.0.0' }],
    'node/no-missing-require': 'error',
    'node/no-extraneous-require': 'error',
    'curly': ['error', 'all'],
    'no-throw-literal': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'dist/',
    '**/*.min.js',
  ],
};