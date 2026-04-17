module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },

  extends: [
    'eslint:recommended',
    'prettier',
  ],

  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs',
  },

  rules: {
    'no-unused-vars': [
      'error',
      {
        args: 'after-used',
      },
    ],
    'no-console': 'error',
    'no-undef': 'error',
    'no-duplicate-imports': 'error',

    'no-var': 'warn',
    'prefer-const': 'warn',
    'eqeqeq': ['warn', 'always'],
    'curly': ['warn', 'all'],
  },

  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'dist/',
    '*.min.js',
  ],
};