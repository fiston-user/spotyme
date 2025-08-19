module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'off', // Allow var in global declarations
    'no-console': 'warn',
  },
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: ['dist/**/*', 'node_modules/**/*'],
};