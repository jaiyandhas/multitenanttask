require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const tasksRoutes = require('./src/routes/tasks');
const usersRoutes = require('./src/routes/users');
const usersPublicRoutes = require('./src/routes/usersPublic');
const { authRequired } = require('./src/middleware/auth');
const { initDb } = require('./src/db/init');

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: false
  })
);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersPublicRoutes);
app.use('/api/tasks', authRequired, tasksRoutes);
app.use('/api/users', authRequired, usersRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = Number(err.statusCode || 500);
  res.status(status).json({ error: err.message || 'Internal Server Error' });
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

