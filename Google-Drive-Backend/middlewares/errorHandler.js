// middleware/errorHandler.js

const { Sequelize } = require('sequelize');
const config = require('../config/config');

const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = null;

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map(e => e.message);
  }

  // Sequelize unique constraint error
  else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate Key Error';
    errors = err.errors.map(e => `${e.path} already exists`);
  }

  // Sequelize Database error (equivalent to CastError for invalid syntax)
  else if (err.name === 'SequelizeDatabaseError') {
    statusCode = 400;
    message = 'Database Error';
  }

  // JWT authentication error
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // JWT token expired error
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Custom application errors
  else if (err.isOperational) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // File upload error
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size limit exceeded';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: config.env === 'development' ? err.stack : undefined
  });
};

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { errorHandler, AppError, catchAsync };