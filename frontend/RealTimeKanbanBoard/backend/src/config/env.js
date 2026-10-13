import dotenv from 'dotenv';

// Load environment variables from .env if present
dotenv.config();

/**
 * Validate that all required environment variables are set
 */
export function validateAndGetEnv() {
  const {
    MONGODB_URI,
    JWT_SECRET,
    ADMIN_ID,
    ADMIN_PASSWORD,
  } = process.env;

  const missing = [];
  if (!MONGODB_URI) missing.push('MONGODB_URI');
  if (!JWT_SECRET) missing.push('JWT_SECRET');
  if (!ADMIN_ID) missing.push('ADMIN_ID');
  if (!ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD');

  if (missing.length > 0) {
    throw new Error(
      `[CONFIG ERROR] Missing required environment variables: ${missing.join(', ')}. Please check backend/.env.`
    );
  }

  if (JWT_SECRET && JWT_SECRET.length < 16) {
    throw new Error(
      '[CONFIG ERROR] JWT_SECRET must be at least 16 characters for cryptographic safety.'
    );
  }

  return true;
}

/**
 * Dynamic environment configuration proxy/getters
 * Always reflects active process.env configuration (essential for test environments & runtime overrides)
 */
export const env = {
  get PORT() {
    return parseInt(process.env.PORT || '5000', 10);
  },
  get NODE_ENV() {
    return process.env.NODE_ENV || 'development';
  },
  get CLIENT_URL() {
    return process.env.CLIENT_URL || 'http://localhost:5173';
  },
  get MONGODB_URI() {
    return process.env.MONGODB_URI || (process.env.NODE_ENV === 'test' ? 'mongodb://127.0.0.1:27017/kanban_test_suite' : undefined);
  },
  get JWT_SECRET() {
    return process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test_jwt_secret_must_be_over_16_characters_secure' : undefined);
  },
  get JWT_EXPIRES_IN() {
    return process.env.JWT_EXPIRES_IN || '15m';
  },
  get ADMIN_ID() {
    return process.env.ADMIN_ID || (process.env.NODE_ENV === 'test' ? 'test_admin_id' : undefined);
  },
  get ADMIN_PASSWORD() {
    return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'test' ? 'TestAdminPassword123!' : undefined);
  },
};
