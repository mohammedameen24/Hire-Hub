const { NODE_ENV } = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large. Maximum size is 5 MB.';
  }
  if (err.code === 'INVALID_FILE_TYPE') {
    statusCode = 400;
    message = err.message || 'Invalid file type. Only PDF files are accepted.';
  }

  if (NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    detail: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
