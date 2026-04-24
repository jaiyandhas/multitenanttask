const Joi = require('joi');

/**
 * Validate request body against a Joi schema
 */
function validateBody(schema) {
  return function validationMiddleware(req, res, next) {
    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) {
      const err = new Error(error.details[0].message);
      err.statusCode = 400;
      return next(err);
    }
    req.body = value;
    return next();
  };
}

/**
 * Validate request params against a Joi schema
 */
function validateParams(schema) {
  return function validationMiddleware(req, res, next) {
    const { error, value } = schema.validate(req.params, { stripUnknown: true });
    if (error) {
      const err = new Error(error.details[0].message);
      err.statusCode = 400;
      return next(err);
    }
    req.params = value;
    return next();
  };
}

/**
 * Validate request query against a Joi schema
 */
function validateQuery(schema) {
  return function validationMiddleware(req, res, next) {
    const { error, value } = schema.validate(req.query, { stripUnknown: true });
    if (error) {
      const err = new Error(error.details[0].message);
      err.statusCode = 400;
      return next(err);
    }
    req.query = value;
    return next();
  };
}

module.exports = { validateBody, validateParams, validateQuery };
