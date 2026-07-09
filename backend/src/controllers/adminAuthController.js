import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import Admin from '../models/Admin.js';
import RefreshToken from '../models/RefreshToken.js';

// Precomputed dummy bcrypt hash (hashed 'dummy_password' at salt cost 12)
const DUMMY_HASH = '$2b$12$Rb1Jb9xghRcRbAitpmy3qOJlk3hj3o.yvrg8heoepdtexPJHh9YuK';

// Access token generator
const generateAccessToken = (admin) => {
  return jwt.sign(
    { id: admin._id, role: 'ADMIN' },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Cryptographically secure refresh token generator
const generateRefreshTokenString = () => {
  return crypto.randomBytes(40).toString('hex');
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });
};

export const login = async (req, res, next) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return next(new AppError('Login ID (email/adminId) and password are required', 400));
    }

    const trimmedLoginId = loginId.trim().toLowerCase();

    // Query database for admin by email OR adminId, explicitly selecting hidden/lockout fields
    const admin = await Admin.findOne({
      $or: [{ email: trimmedLoginId }, { adminId: trimmedLoginId }]
    }).select('+password +failedLoginAttempts +lockoutUntil');

    // Handle generic login validation failures to prevent credentials harvesting
    const genericErrorMessage = 'Invalid email/admin ID or password';

    // Account Lockout check with timing defense
    if (admin && admin.lockoutUntil && admin.lockoutUntil > new Date()) {
      await bcrypt.compare(password, DUMMY_HASH);
      logger.warn(`[Security Alert] Failed admin login attempt for locked account: ${admin.email} from IP: ${req.ip}`);
      const error = new AppError(genericErrorMessage, 401);
      error.errorCode = 'INVALID_CREDENTIALS';
      return next(error);
    }

    if (!admin) {
      await bcrypt.compare(password, DUMMY_HASH);
      logger.warn(`[Security Alert] Failed admin login attempt for nonexistent identifier: ${trimmedLoginId} from IP: ${req.ip}`);
      const error = new AppError(genericErrorMessage, 401);
      error.errorCode = 'INVALID_CREDENTIALS';
      return next(error);
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      admin.failedLoginAttempts += 1;
      if (admin.failedLoginAttempts >= 5) {
        admin.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        logger.warn(`[Security Alert] Admin account locked due to excessive login failures: ${admin.email}`);
      }
      await admin.save();

      logger.warn(`[Security Alert] Failed admin login attempt: invalid password for administrator: ${admin.email} from IP: ${req.ip}`);
      const error = new AppError(genericErrorMessage, 401);
      error.errorCode = 'INVALID_CREDENTIALS';
      return next(error);
    }

    if (!admin.isActive) {
      logger.warn(`[Security Alert] Failed admin login attempt for deactivated administrator account: ${admin.email} from IP: ${req.ip}`);
      const error = new AppError('Administrator account is deactivated', 401);
      error.errorCode = 'ACCOUNT_DISABLED';
      return next(error);
    }

    // Authentication succeeded
    logger.info(`[Security Alert] Successful admin login: ${admin.email} from IP: ${req.ip}`);

    // Reset lockout parameters
    admin.failedLoginAttempts = 0;
    admin.lockoutUntil = undefined;
    await admin.save();

    const accessToken = generateAccessToken(admin);
    const refreshTokenStr = generateRefreshTokenString();
    
    // Hash refresh token before saving to database
    const hashedToken = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
    const familyId = crypto.randomBytes(16).toString('hex');

    // Expiration date (7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save hashed refresh token to database
    await RefreshToken.create({
      token: hashedToken,
      admin: admin._id,
      expiresAt,
      familyId,
      isUsed: false
    });

    setRefreshTokenCookie(res, refreshTokenStr);

    res.status(200).json({
      success: true,
      accessToken,
      admin: {
        id: admin._id,
        email: admin.email,
        adminId: admin.adminId,
        name: admin.name
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.cookies;

    if (!token) {
      return next(new AppError('Session refresh token missing', 401));
    }

    const hashedIncomingToken = crypto.createHash('sha256').update(token).digest('hex');

    // Atomically find and mark the token as used to prevent race conditions
    const storedToken = await RefreshToken.findOneAndUpdate(
      { token: hashedIncomingToken, isUsed: false },
      { $set: { isUsed: true } },
      { new: false } // returns the document *before* the update was applied
    ).populate('admin');

    if (!storedToken) {
      // Check if token exists but was already used (Token Theft/Replay attempt)
      const alreadyUsedToken = await RefreshToken.findOne({ token: hashedIncomingToken });
      if (alreadyUsedToken) {
        // Revoke the entire token family immediately
        await RefreshToken.deleteMany({ familyId: alreadyUsedToken.familyId });
        res.clearCookie('refreshToken');
        logger.warn(`[Security Alert] Refresh token reuse detected. Family revoked for admin: ${alreadyUsedToken.admin}`);
        return next(new AppError('Invalid session refresh token', 401));
      }

      res.clearCookie('refreshToken');
      return next(new AppError('Invalid session refresh token', 401));
    }

    if (storedToken.expiresAt < new Date()) {
      res.clearCookie('refreshToken');
      return next(new AppError('Session refresh token has expired', 401));
    }

    const { admin } = storedToken;

    if (!admin || !admin.isActive) {
      res.clearCookie('refreshToken');
      return next(new AppError('Associated administrator account is inactive', 401));
    }

    // Perform Refresh Token Rotation (RTR) under the same familyId
    const newAccessToken = generateAccessToken(admin);
    const newRefreshTokenStr = generateRefreshTokenString();
    const newHashedToken = crypto.createHash('sha256').update(newRefreshTokenStr).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      token: newHashedToken,
      admin: admin._id,
      expiresAt,
      familyId: storedToken.familyId,
      isUsed: false
    });

    setRefreshTokenCookie(res, newRefreshTokenStr);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.cookies;

    if (token) {
      const hashedIncomingToken = crypto.createHash('sha256').update(token).digest('hex');
      // Revoke the refresh session token from database
      await RefreshToken.deleteOne({ token: hashedIncomingToken });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.status(200).json({
    success: true,
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      adminId: req.admin.adminId,
      name: req.admin.name
    }
  });
};
