const Joi = require('joi');

// Auth validation schemas
const authSchemas = {
  registerOrg: Joi.object({
    orgName: Joi.string().trim().min(2).max(100).required(),
    adminName: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string().min(8).max(128).required(),
  }),

  registerWithInvite: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string().min(8).max(128).required(),
    inviteToken: Joi.string().required(),
  }),

  login: Joi.object({
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string().required(),
    orgSlug: Joi.string().trim().lowercase().min(2).max(32).required(),
  }),
};

module.exports = { authSchemas };
