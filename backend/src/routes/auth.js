const express = require('express');
const { registerOrg, registerWithInvite, login } = require('../services/authService');
const { validateBody } = require('../middleware/validation');
const { authSchemas } = require('../validation/authSchemas');

const router = express.Router();

router.post('/register-org', validateBody(authSchemas.registerOrg), async (req, res, next) => {
  try {
    const result = await registerOrg(req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.post('/register', validateBody(authSchemas.registerWithInvite), async (req, res, next) => {
  try {
    const result = await registerWithInvite(req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.post('/login', validateBody(authSchemas.login), async (req, res, next) => {
  try {
    const result = await login(req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

