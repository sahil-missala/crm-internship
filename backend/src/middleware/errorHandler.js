module.exports = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    // Avoid exposing detailed stack trace in production builds
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};
