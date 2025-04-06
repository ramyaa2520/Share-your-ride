// Error handler middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Development vs Production error details
  const error = {
    status: err.status || 'error',
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    error.status = 'fail';
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    error.statusCode = 400;
  }
  
  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    error.status = 'fail';
    error.message = `Duplicate field value: ${Object.keys(err.keyValue).join(', ')}. Please use another value.`;
    error.statusCode = 400;
  }
  
  // Handle Mongoose cast error
  if (err.name === 'CastError') {
    error.status = 'fail';
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.statusCode = 400;
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.status = 'fail';
    error.message = 'Invalid token. Please log in again.';
    error.statusCode = 401;
  }
  
  if (err.name === 'TokenExpiredError') {
    error.status = 'fail';
    error.message = 'Your token has expired. Please log in again.';
    error.statusCode = 401;
  }
  
  res.status(statusCode).json(error);
};

module.exports = errorHandler; 