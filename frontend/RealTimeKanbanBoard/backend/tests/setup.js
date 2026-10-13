import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kanban_test_suite';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_must_be_over_16_characters_secure';
  process.env.ADMIN_ID = 'test_admin_id';
  process.env.ADMIN_PASSWORD = 'TestAdminPassword123!';
  await connectDB(TEST_DB_URI);
});

afterEach(async () => {
  // Clear all collections between test suites
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
