# Testing Guide

## Backend Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Tests are located in `__tests__/` directory and use Jest framework.

### Running Backend Tests

```bash
cd backend
npm install
npm test
```

## Frontend Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open UI dashboard
npm run test -- --ui
```

Tests are located in `src/__tests__/` and use Vitest framework.

### Running Frontend Tests

```bash
cd frontend
npm install
npm test
```

## Test Coverage

Both backend and frontend are configured to track test coverage:

- Backend: `__tests__/` directory
- Frontend: `src/__tests__/` and `src/components/*.test.jsx` files

To generate coverage:

```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

Coverage reports are available in `coverage/` directory.

## Adding New Tests

### Backend (Jest)

```javascript
// __tests__/example.test.js
describe('My Feature', () => {
  it('should do something', () => {
    expect(true).toBe(true)
  })
})
```

### Frontend (Vitest)

```javascript
// src/components/Example.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />)
    expect(screen.getByText(/hello/i)).toBeInTheDocument()
  })
})
```
