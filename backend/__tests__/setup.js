/**
 * Backend test setup - creates isolated test database
 */

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Clear any test data if needed
});
