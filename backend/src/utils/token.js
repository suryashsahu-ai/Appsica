import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import crypto from 'crypto';

// In-memory revoked token identifiers (jti) set (with cleanup on expiration)
const revokedTokens = new Set();

/**
 * Generate a cryptographically signed JWT
 * @param {Object} payload 
 * @param {string} expiresIn 
 */
export function generateToken(payload, expiresIn = env.JWT_EXPIRES_IN) {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, env.JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT and ensure it hasn't been revoked
 * @param {string} token 
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (decoded.jti && revokedTokens.has(decoded.jti)) {
      throw new Error('Token has been revoked');
    }
    return decoded;
  } catch (error) {
    throw error;
  }
}

/**
 * Revoke a token by jti
 * @param {string} token 
 */
export function revokeToken(token) {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.jti) {
      revokedTokens.add(decoded.jti);
      // Auto cleanup after 24h
      setTimeout(() => {
        revokedTokens.delete(decoded.jti);
      }, 24 * 60 * 60 * 1000).unref?.();
    }
  } catch {
    // Ignore decode error on invalid tokens
  }
}

/**
 * Standard cookie configuration for HttpOnly JWT
 */
export const COOKIE_NAME = 'kanban_token';

export function getCookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd, // HTTPS only in production
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days fallback
    path: '/',
  };
}
