/**
 * Test: RBAC Middleware
 */

const { requirePermission } = require('../../src/middleware/rbac');

describe('RBAC Middleware', () => {
  it('should allow request when user has required permission', () => {
    const req = {
      user: {
        permissions: ['task:create', 'task:view:all']
      }
    };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const middleware = requirePermission('task:create');
    middleware(req, res, next);

    expect(nextCalled).toBe(true);
  });

  it('should deny request when user lacks permission', () => {
    const req = {
      user: {
        permissions: ['task:view:own']
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const middleware = requirePermission('task:delete');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(nextCalled).toBe(false);
  });

  it('should return 401 when user is not authenticated', () => {
    const req = { user: null };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const middleware = requirePermission('task:create');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(nextCalled).toBe(false);
  });
});
