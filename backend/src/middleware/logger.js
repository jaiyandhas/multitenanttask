/**
 * Simple request logger middleware
 */
function loggerMiddleware(req, res, next) {
  const start = Date.now();
  
  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    console.log(`[${level}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  return next();
}

module.exports = { loggerMiddleware };
