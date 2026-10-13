import crypto from 'crypto';
import { User } from '../models/User.js';
import { generateToken, revokeToken, getCookieOptions, COOKIE_NAME } from '../utils/token.js';
import { env } from '../config/env.js';

/**
 * Constant-time safe string comparison for admin credentials
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    // Prevent timing leak on length mismatch
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export class AuthController {
  /**
   * Register a new regular user
   */
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists.',
        });
      }

      // Explicitly enforce 'user' role regardless of request
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: 'user',
      });

      await user.save();

      const token = generateToken({
        userId: user._id.toString(),
        role: 'user',
        tokenType: 'user',
      });

      res.cookie(COOKIE_NAME, token, getCookieOptions());

      return res.status(201).json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login standard user
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. Please check your email and password.',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. Please check your email and password.',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account has been deactivated. Please contact support.',
        });
      }

      const token = generateToken({
        userId: user._id.toString(),
        role: 'user',
        tokenType: 'user',
      });

      res.cookie(COOKIE_NAME, token, getCookieOptions());

      return res.status(200).json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Environment-Configured Administrator Login
   * Authenticates solely against backend process.env.ADMIN_ID and ADMIN_PASSWORD
   */
  static async adminLogin(req, res, next) {
    try {
      const { adminId, password } = req.body;

      if (!env.ADMIN_ID || !env.ADMIN_PASSWORD) {
        return res.status(500).json({
          success: false,
          error: 'Server administration authentication is not configured in the environment.',
        });
      }

      const isIdMatch = safeCompare(adminId, env.ADMIN_ID);
      const isPassMatch = safeCompare(password, env.ADMIN_PASSWORD);

      if (!isIdMatch || !isPassMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid administrator credentials.',
        });
      }

      const token = generateToken({
        userId: 'admin',
        role: 'admin',
        tokenType: 'admin',
      });

      res.cookie(COOKIE_NAME, token, getCookieOptions());

      return res.status(200).json({
        success: true,
        user: {
          id: 'admin',
          name: 'System Administrator',
          email: 'admin@system.local',
          role: 'admin',
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user, revoke token, clear cookie
   */
  static async logout(req, res, next) {
    try {
      if (req.token) {
        revokeToken(req.token);
      }

      const cookieOpts = getCookieOptions();
      res.clearCookie(COOKIE_NAME, {
        httpOnly: cookieOpts.httpOnly,
        secure: cookieOpts.secure,
        sameSite: cookieOpts.sameSite,
        path: cookieOpts.path,
      });

      return res.status(200).json({
        success: true,
        message: 'Successfully logged out.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get authenticated user profile
   */
  static async getMe(req, res) {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  }
}
