import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import User from '../models/User.js';
import UserRefreshToken from '../models/UserRefreshToken.js';
import { sendVerificationCode } from '../services/emailService.js';
import { exec } from 'child_process';
import path from 'path';

// Helper to generate secure OTP using Rust binary with JavaScript fallback
const generateOTPWithRust = () => {
  return new Promise((resolve) => {
    // Avoid running child process in tests to prevent timeout
    if (process.env.NODE_ENV === 'test') {
      const testCode = Math.floor(100000 + Math.random() * 900000).toString();
      logger.info(`[Rust Agent Mock] Test environment detected. Bypassing exec and using JS OTP: ${testCode}`);
      return resolve(testCode);
    }

    // Look for the pre-compiled Rust binary in backend/rust-agent/target/release
    const binaryPath = path.join(process.cwd(), 'rust-agent', 'target', 'release', 'c2c-security-agent');
    
    exec(`"${binaryPath}" generate_otp`, (error, stdout) => {
      if (!error && stdout) {
        const code = stdout.trim();
        if (code.length === 6 && !isNaN(code)) {
          logger.info(`[Rust Agent] Successfully generated secure OTP: ${code}`);
          return resolve(code);
        }
      }
      
      // Fallback to JS if Rust binary is not compiled, not found, or fails execution
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      logger.info(`[Rust Agent Fallback] Rust binary not found or execution failed. Generated fallback JS OTP: ${fallbackCode}`);
      resolve(fallbackCode);
    });
  });
};

// Precomputed dummy bcrypt hash (hashed 'dummy_password' at salt cost 12)
const DUMMY_HASH = '$2b$12$Rb1Jb9xghRcRbAitpmy3qOJlk3hj3o.yvrg8heoepdtexPJHh9YuK';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Verify Google ID token
const verifyGoogleToken = async (idToken) => {
  // Support mocking ONLY for Jest test environments
  const isTestWorker = env.NODE_ENV === 'test' && process.env.JEST_WORKER_ID;
  if (isTestWorker && idToken.startsWith('mock_google_token_')) {
    const parts = idToken.split('_');
    const email = parts[3] || 'googleuser@example.com';
    const sub = parts[4] || '123456789012345678901';
    const name = 'Mock Google User';
    return {
      email,
      sub,
      name,
      email_verified: true,
      iss: 'https://accounts.google.com',
      aud: env.GOOGLE_CLIENT_ID
    };
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    
    // Explicitly verify the token issuer
    const issuer = payload.iss;
    if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
      throw new Error('Invalid token issuer');
    }
    
    return payload;
  } catch (error) {
    logger.error(`[Security Alert] Google ID Token verification failed: ${error.message}`);
    throw new AppError('Invalid Google token signature or validation failure', 400);
  }
};

// Access token generator
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: 'CUSTOMER' },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Cryptographically secure refresh token generator
const generateRefreshTokenString = () => {
  return crypto.randomBytes(40).toString('hex');
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('customerRefreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });
};

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return next(new AppError('Email, password, and name are required', 400));
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return next(new AppError('Email already registered', 400));
    }

    // Role is immutably set to CUSTOMER; role injection ignored from req.body
    const user = await User.create({
      email: trimmedEmail,
      password,
      name,
      role: 'CUSTOMER'
    });

    logger.info(`[Security Alert] Successful customer registration: ${user.email} from IP: ${req.ip}`);

    const accessToken = generateAccessToken(user);
    const refreshTokenStr = generateRefreshTokenString();
    const hashedToken = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
    const familyId = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await UserRefreshToken.create({
      token: hashedToken,
      user: user._id,
      expiresAt,
      familyId,
      isUsed: false
    });

    setRefreshTokenCookie(res, refreshTokenStr);

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find customer by email, selecting hidden fields for verification
    const user = await User.findOne({ email: trimmedEmail }).select('+password +failedLoginAttempts +lockoutUntil');

    const genericErrorMessage = 'Invalid email or password';

    // Account Lockout check with timing defense
    if (user && user.lockoutUntil && user.lockoutUntil > new Date()) {
      await bcrypt.compare(password, DUMMY_HASH);
      logger.warn(`[Security Alert] Failed login attempt for locked customer account: ${user.email} from IP: ${req.ip}`);
      return next(new AppError(genericErrorMessage, 401));
    }

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      logger.warn(`[Security Alert] Failed login attempt for nonexistent customer: ${trimmedEmail} from IP: ${req.ip}`);
      return next(new AppError(genericErrorMessage, 401));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        logger.warn(`[Security Alert] Customer account locked due to login failures: ${user.email}`);
      }
      await user.save();

      logger.warn(`[Security Alert] Failed login attempt: invalid password for customer: ${user.email} from IP: ${req.ip}`);
      return next(new AppError(genericErrorMessage, 401));
    }

    // Reset lockout parameters
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    await user.save();

    logger.info(`[Security Alert] Successful customer login: ${user.email} from IP: ${req.ip}`);

    const accessToken = generateAccessToken(user);
    const refreshTokenStr = generateRefreshTokenString();
    const hashedToken = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
    const familyId = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await UserRefreshToken.create({
      token: hashedToken,
      user: user._id,
      expiresAt,
      familyId,
      isUsed: false
    });

    setRefreshTokenCookie(res, refreshTokenStr);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return next(new AppError('Google ID token is required', 400));
    }

    // Verify token payload server-side
    const payload = await verifyGoogleToken(idToken);
    const { email, sub, name } = payload;
    const trimmedEmail = email.toLowerCase().trim();

    // Query for existing account by email
    let user = await User.findOne({ email: trimmedEmail });

    if (user) {
      // Secure check for existing local accounts (No silent insecure account linking)
      if (!user.googleId) {
        logger.warn(`[Security Alert] Rejected Google OAuth login for local password account: ${trimmedEmail} from IP: ${req.ip}`);
        return next(new AppError('This email is registered with password login. Please log in using your password.', 400));
      }
      
      if (user.googleId !== sub) {
        logger.warn(`[Security Alert] Google OAuth sub mismatch for email: ${trimmedEmail} from IP: ${req.ip}`);
        return next(new AppError('Invalid Google authentication identifier', 400));
      }
    } else {
      // Create new customer account with default role CUSTOMER
      user = await User.create({
        email: trimmedEmail,
        name,
        googleId: sub,
        role: 'CUSTOMER'
      });
      logger.info(`[Security Alert] Successful customer Google OAuth registration: ${user.email} from IP: ${req.ip}`);
    }

    // Generate session
    const accessToken = generateAccessToken(user);
    const refreshTokenStr = generateRefreshTokenString();
    const hashedToken = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
    const familyId = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await UserRefreshToken.create({
      token: hashedToken,
      user: user._id,
      expiresAt,
      familyId,
      isUsed: false
    });

    setRefreshTokenCookie(res, refreshTokenStr);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { customerRefreshToken: token } = req.cookies;

    if (!token) {
      return next(new AppError('Session refresh token missing', 401));
    }

    const hashedIncomingToken = crypto.createHash('sha256').update(token).digest('hex');

    // Atomically consume the token to prevent race conditions
    const storedToken = await UserRefreshToken.findOneAndUpdate(
      { token: hashedIncomingToken, isUsed: false },
      { $set: { isUsed: true } },
      { new: false }
    ).populate('user');

    if (!storedToken) {
      // Check for token replay/theft
      const alreadyUsedToken = await UserRefreshToken.findOne({ token: hashedIncomingToken });
      if (alreadyUsedToken) {
        // Revoke the entire token family
        await UserRefreshToken.deleteMany({ familyId: alreadyUsedToken.familyId });
        res.clearCookie('customerRefreshToken');
        logger.warn(`[Security Alert] Customer refresh token reuse detected. Family revoked for user: ${alreadyUsedToken.user}`);
        return next(new AppError('Invalid session refresh token', 401));
      }

      res.clearCookie('customerRefreshToken');
      return next(new AppError('Invalid session refresh token', 401));
    }

    if (storedToken.expiresAt < new Date()) {
      res.clearCookie('customerRefreshToken');
      return next(new AppError('Session refresh token has expired', 401));
    }

    const { user } = storedToken;

    if (!user) {
      res.clearCookie('customerRefreshToken');
      return next(new AppError('Associated user account is inactive', 401));
    }

    // RTR rotation
    const newAccessToken = generateAccessToken(user);
    const newRefreshTokenStr = generateRefreshTokenString();
    const newHashedToken = crypto.createHash('sha256').update(newRefreshTokenStr).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await UserRefreshToken.create({
      token: newHashedToken,
      user: user._id,
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
    const { customerRefreshToken: token } = req.cookies;

    if (token) {
      const hashedIncomingToken = crypto.createHash('sha256').update(token).digest('hex');
      await UserRefreshToken.deleteOne({ token: hashedIncomingToken });
    }

    res.clearCookie('customerRefreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict'
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
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });

    // Generic response message to prevent account enumeration
    const genericSuccessMessage = 'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericSuccessMessage
      });
    }

    // Generate secure 6-digit OTP code using Rust agent (with JS fallback)
    const resetCode = await generateOTPWithRust();
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    // Set expiration to 5 minutes (OTP standard lifetime)
    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpire = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // Dispatch the email containing the OTP
    await sendVerificationCode(user.email, resetCode);

    const response = {
      success: true,
      message: 'Verification code sent successfully. Please check your email.'
    };

    // Return the token in test mode so test assertions can capture it
    const isTestWorker = env.NODE_ENV === 'test' && process.env.JEST_WORKER_ID;
    if (isTestWorker) {
      response.resetToken = resetCode;
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, code, email, password } = req.body;
    const searchCode = code || token;

    if (!searchCode || !password) {
      return next(new AppError('Reset verification code and new password are required', 400));
    }

    const hashedToken = crypto.createHash('sha256').update(searchCode).digest('hex');

    // Query for user with active reset token
    const query = {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    };

    if (email) {
      query.email = email.toLowerCase().trim();
    }

    const user = await User.findOne(query).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return next(new AppError('Invalid or expired reset verification code', 400));
    }

    // Update password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Session revocation: invalidate all active customer refresh tokens
    await UserRefreshToken.deleteMany({ user: user._id });

    logger.info(`[Security Alert] Customer password reset successfully. All sessions revoked for: ${user.email} from IP: ${req.ip}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};
