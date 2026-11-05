import 'dotenv/config';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Environment must be set BEFORE any application module is imported.
const testUri = process.env.MONGODB_TEST_URI ?? 'mongodb://127.0.0.1:27017/estateflow_test';
const dbName = new URL(testUri).pathname.replace('/', '');
if (!dbName.endsWith('_test')) {
  throw new Error(`Refusing to run tests: database "${dbName}" must end with "_test".`);
}

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = testUri;
process.env.JWT_ACCESS_SECRET = 'test-access-secret-0123456789-abcdefghijklmnop';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-9876543210-ponmlkjihgfedcba';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.DEPLOYMENT_MODE = 'SAAS';
process.env.LOG_LEVEL = 'silent';
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.LOGIN_FAILURE_LIMIT_MAX = '1000';

beforeAll(async () => {
  const mongoose = (await import('mongoose')).default;
  const { connectDatabase } = await import('../src/config/database');
  await connectDatabase();
  await mongoose.connection.dropDatabase(); // safe: name verified above
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
});

afterEach(async () => {
  const mongoose = (await import('mongoose')).default;
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  const { disconnectDatabase } = await import('../src/config/database');
  await disconnectDatabase();
});