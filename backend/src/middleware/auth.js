import mongoose from 'mongoose';
import { verifyToken, COOKIE_NAME } from '../utils/token.js';
import { User } from '../models/User.js';

/**
 * Reusable JWT Authentication Middleware
 * Checks HttpOnly cookie or Authorization Bearer header
 */
export async function authenticateJWT(req, res, next) {
  try {
    let token = null;

    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No token provided.',
      });
    }

    const decoded = verifyToken(token);

    // Differentiate between Admin and Regular User tokens
    if (decoded.tokenType === 'admin' && decoded.role === 'admin') {
      req.user = {
        id: 'admin',
        name: 'System Administrator',
        email: 'admin@system.local',
        role: 'admin',
        tokenType: 'admin',
        jti: decoded.jti,
      };
      req.token = token;
      return next();
    }

    // Regular User verification
    if (!decoded.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token payload.',
      });
    }

    const user = await User.findById(decoded.userId).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or account is deactivated.',
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: 'user',
      tokenType: 'user',
      jti: decoded.jti,
    };
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid or revoked token.',
    });
  }
}

/**
 * Reusable Admin-Only Authorization Middleware
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin' || req.user.tokenType !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Administrative privileges required.',
    });
  }
  next();
}

/**
 * Reusable Regular User-Only Authorization Middleware
 * Prevents admin token from masquerading as a normal board member
 */
export function requireUser(req, res, next) {
  if (!req.user || req.user.tokenType !== 'user') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Regular user account required for this resource.',
    });
  }
  next();
}
