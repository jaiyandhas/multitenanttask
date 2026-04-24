module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/db/seed.js',
  ],
  testMatch: ['**/__tests__/**/*.test.js', '**/src/**/*.test.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/src/db/seed.js'],
  testTimeout: 10000,
};
