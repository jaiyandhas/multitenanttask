function requirePermission(permission) {
  return function rbacMiddleware(req, res, next) {
    try {
      const user = req.user;
      if (!user || !Array.isArray(user.permissions)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!user.permissions.includes(permission)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { requirePermission };

