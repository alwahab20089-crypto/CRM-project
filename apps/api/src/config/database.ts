import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

let transactionsSupported = false;
let listenersAttached = false;

export const supportsTransactions = () => transactionsSupported;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return; // never open a second connection

  mongoose.set('strictQuery', true);
  if (!listenersAttached) {
    listenersAttached = true;
    mongoose.connection.on('error', (err: Error) => logger.error({ message: err.message }, 'MongoDB connection error'));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  }

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 10 });

  const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
  transactionsSupported = Boolean(hello.setName) || hello.msg === 'isdbgrid';
  logger.info({ transactions: transactionsSupported }, 'MongoDB connected');
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export async function isDatabaseHealthy(): Promise<boolean> {
  if (mongoose.connection.readyState !== 1) return false;
  try {
    await mongoose.connection.db!.admin().ping();
    return true;
  } catch {
    return false;
  }
}