module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },

  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs',
  },

  extends: [
    'eslint:recommended',
    'prettier',
  ],

  rules: {
    'no-unused-vars': [2, { args: 'after-used' }],
    'no-undef': 2,
    'no-console': 2,
    'eqeqeq': 2,

    'no-var': 1,
    'prefer-const': 1,
    'no-duplicate-imports': 1,
  },

  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-unused-vars': 1,
        'no-console': 0,
      },
    },
  ],

  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'dist/',
    '*.min.js',
  ],
};