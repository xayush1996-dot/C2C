import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const message = err.message || 'Internal Server Error';

  // Secure logging of the error details
  logger.error(`[API Error] ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - IP: ${req.ip}`);

  const response = {
    status,
    message
  };

  if (err.errorCode) {
    response.errorCode = err.errorCode;
  }

  // Expose stack trace only in development
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Prevent sending multiple headers
  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json(response);
};
