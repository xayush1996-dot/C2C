import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

export const protectAdmin = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized, access token missing', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      return next(new AppError('Not authorized, access token invalid or expired', 401));
    }

    // Enforce administrative role verification to prevent role injection
    if (decoded.role !== 'ADMIN') {
      return next(new AppError('Forbidden, admin credentials required', 403));
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return next(new AppError('Not authorized, administrator account not found', 401));
    }

    // Handle disabled/deactivated admin profiles
    if (!admin.isActive) {
      return next(new AppError('Not authorized, administrator account has been disabled', 401));
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

export const protectCustomer = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized, access token missing', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      return next(new AppError('Not authorized, access token invalid or expired', 401));
    }

    // Enforce customer role verification to prevent role injection
    if (decoded.role !== 'CUSTOMER') {
      return next(new AppError('Forbidden, customer credentials required', 403));
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('Not authorized, user account not found', 401));
    }

    // Handle locked user profiles
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return next(new AppError('Not authorized, user account is temporarily locked', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
