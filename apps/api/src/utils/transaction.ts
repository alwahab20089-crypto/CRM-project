import mongoose, { type ClientSession } from 'mongoose';
import { supportsTransactions } from '../config/database';
import { logger } from '../config/logger';

export interface UnitOfWork {
  session: ClientSession | undefined;
  /** Register an undo step. Only used when the server has no transaction support. */
  onRollback(undo: () => Promise<unknown>): void;
}

/**
 * Atomic multi-document work.
 * - Replica set / Atlas: a real MongoDB transaction.
 * - Standalone mongod: runs without a transaction and executes registered undo steps (reverse order) on failure.
 */
export async function runUnitOfWork<T>(work: (uow: UnitOfWork) => Promise<T>): Promise<T> {
  if (supportsTransactions()) {
    const session = await mongoose.startSession();
    try {
      let result: T | undefined;
      await session.withTransaction(async () => {
        result = await work({ session, onRollback: () => undefined });
      });
      return result as T;
    } finally {
      await session.endSession();
    }
  }

  const undoSteps: Array<() => Promise<unknown>> = [];
  try {
    return await work({
      session: undefined,
      onRollback: (undo) => {
        undoSteps.push(undo);
      },
    });
  } catch (err) {
    for (const undo of undoSteps.reverse()) {
      try {
        await undo();
      } catch (undoErr) {
        logger.error({ err: undoErr }, 'rollback step failed');
      }
    }
    throw err;
  }
}