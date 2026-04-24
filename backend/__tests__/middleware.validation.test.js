/**
 * Test: Validation Middleware
 */

const { validateBody } = require('../../src/middleware/validation');
const Joi = require('joi');

describe('Validation Middleware', () => {
  it('should pass valid data through', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required()
    });

    const req = {
      body: {
        name: 'John',
        email: 'john@example.com'
      }
    };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const middleware = validateBody(schema);
    middleware(req, res, next);

    expect(nextCalled).toBe(true);
    expect(req.body.name).toBe('John');
  });

  it('should reject invalid data', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required()
    });

    const req = {
      body: {
        name: 'John',
        email: 'invalid-email'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    let nextCalled = false;
    let errorPassed = false;
    const next = (err) => {
      if (err) errorPassed = true;
      nextCalled = true;
    };

    const middleware = validateBody(schema);
    middleware(req, res, next);

    expect(errorPassed).toBe(true);
  });

  it('should strip unknown fields', () => {
    const schema = Joi.object({
      name: Joi.string().required()
    });

    const req = {
      body: {
        name: 'John',
        unknown: 'field'
      }
    };
    const res = {};
    const next = () => {};

    const middleware = validateBody(schema);
    middleware(req, res, next);

    expect(req.body.unknown).toBeUndefined();
  });
});
