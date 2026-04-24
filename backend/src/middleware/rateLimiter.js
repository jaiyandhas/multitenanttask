const rateLimit = require('express-rate-limit');

// Auth endpoint rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: 5,  // limit each IP to 5 requests per windowMs for auth
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests, please try again later',
  standardHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

module.exports = { authLimiter, apiLimiter };
