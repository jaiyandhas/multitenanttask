require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const tasksRoutes = require('./src/routes/tasks');
const usersRoutes = require('./src/routes/users');
const usersPublicRoutes = require('./src/routes/usersPublic');
const { authRequired } = require('./src/middleware/auth');
const { initDb } = require('./src/db/init');
const { loggerMiddleware } = require('./src/middleware/logger');
const { authLimiter, apiLimiter } = require('./src/middleware/rateLimiter');

const app = express();

// Request logging
app.use(loggerMiddleware);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: false
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Apply rate limiting to auth endpoints
app.use('/api/auth', authLimiter);

// Apply general rate limiting to API
app.use('/api/tasks', apiLimiter);
app.use('/api/users', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersPublicRoutes);
app.use('/api/tasks', authRequired, tasksRoutes);
app.use('/api/users', authRequired, usersRoutes);

// Error handler (must be last)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  const status = Number(err.statusCode || 500);
  
  // Log error
  console.error(`[ERROR] ${req.method} ${req.path}:`, {
    message: err.message,
    status,
    stack: isDev ? err.stack : undefined,
  });

  res.status(status).json({ 
    error: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack })
  });
});

const port = Number(process.env.PORT || 4000);
initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize DB', err);
    process.exit(1);
  });

