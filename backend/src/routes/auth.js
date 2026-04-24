const express = require('express');
const { registerOrg, registerWithInvite, login } = require('../services/authService');

const router = express.Router();

router.post('/register-org', async (req, res, next) => {
  try {
    const { orgName, adminName, email, password } = req.body || {};
    if (!orgName || !adminName || !email || !password) {
      return res.status(400).json({ error: 'orgName, adminName, email, password are required' });
    }
    const result = await registerOrg({ orgName, adminName, email, password });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, inviteToken } = req.body || {};
    if (!name || !email || !password || !inviteToken) {
      return res.status(400).json({ error: 'name, email, password, inviteToken are required' });
    }
    const result = await registerWithInvite({ inviteToken, name, email, password });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, orgSlug } = req.body || {};
    if (!email || !password || !orgSlug) {
      return res.status(400).json({ error: 'email, password, orgSlug are required' });
    }
    const result = await login({ email, password, orgSlug });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

