import { openDatabase } from './database.js';
import type { StoreName } from './schema.js';

export type DatabaseErrorCode =
  | 'DB_TRANSACTION_ABORTED'
  | 'DB_DUPLICATE_RECORD'
  | 'DB_VALIDATION_FAILED'
  | 'DB_QUOTA_EXCEEDED';

export class DatabaseOperationError extends Error {
  readonly code: DatabaseErrorCode;
  readonly originalError?: unknown;

  constructor(code: DatabaseErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'DatabaseOperationError';
    this.code = code;
    this.originalError = originalError;
  }
}

function transactionError(error: DOMException | null): DatabaseOperationError {
  if (error?.name === 'ConstraintError') {
    return new DatabaseOperationError('DB_DUPLICATE_RECORD', 'A unique database key already exists.', error);
  }
  if (error?.name === 'QuotaExceededError') {
    return new DatabaseOperationError('DB_QUOTA_EXCEEDED', 'Browser storage quota was exceeded.', error);
  }
  return new DatabaseOperationError(
    'DB_TRANSACTION_ABORTED',
    error?.message || 'The IndexedDB transaction was aborted.',
    error
  );
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (typeof value === 'object' && value !== null || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function';
}

/**
 * Execute one atomic IndexedDB transaction.
 *
 * The callback MUST be synchronous and queue all IndexedDB requests before it
 * returns. Awaiting unrelated work inside the callback can let the browser
 * auto-commit the transaction and is deliberately rejected.
 */
export async function runTransaction<T>(
  storeNames: readonly StoreName[],
  mode: IDBTransactionMode,
  operation: (transaction: IDBTransaction) => T
): Promise<T> {
  const uniqueStores = [...new Set(storeNames)];
  if (uniqueStores.length === 0) {
    throw new DatabaseOperationError('DB_VALIDATION_FAILED', 'At least one object store is required.');
  }

  const db = await openDatabase();
  let tx: IDBTransaction;
  try {
    tx = db.transaction(uniqueStores, mode);
  } catch (error) {
    throw new DatabaseOperationError('DB_VALIDATION_FAILED', 'Could not create the requested database transaction.', error);
  }

  const completed = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(transactionError(tx.error));
    tx.onerror = () => {
      // Wait for onabort so the final transaction error is reported once.
    };
  });

  let result: T;
  try {
    result = operation(tx);
    if (isThenable(result)) {
      throw new DatabaseOperationError(
        'DB_VALIDATION_FAILED',
        'Transaction callbacks must be synchronous; queue IndexedDB requests before returning.'
      );
    }
  } catch (error) {
    try { tx.abort(); } catch { /* The transaction may already be inactive. */ }
    await completed.catch(() => undefined);
    throw error;
  }

  await completed;
  return result;
}
