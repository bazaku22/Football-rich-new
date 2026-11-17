import { DB_NAME, DB_VERSION, STORE_NAMES, type StoreName } from './schema.js';
import { runTransaction } from './transaction.js';

export const BACKUP_FORMAT = 'football-rich-v2-backup';
export const BACKUP_FORMAT_VERSION = 1;
export interface DatabaseBackup {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  databaseName: string;
  schemaVersion: number;
  createdAt: string;
  stores: Record<StoreName, unknown[]>;
  manifest: { storeNames: string[]; recordCounts: Record<string, number>; totalRecords: number };
  checksum: string;
}

function canonical(value: unknown): string {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const object = value as Record<string, unknown>;
  const keys = Object.keys(object).filter(key =>
    object[key] !== undefined && typeof object[key] !== 'function' && typeof object[key] !== 'symbol'
  ).sort();
  return '{' + keys.map(key => JSON.stringify(key) + ':' + canonical(object[key])).join(',') + '}';
}

export async function checksumBackupPayload(payload: Omit<DatabaseBackup, 'checksum'>): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('BACKUP_CRYPTO_UNAVAILABLE: Secure SHA-256 is unavailable in this browser.');
  const bytes = new TextEncoder().encode(canonical(payload));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Export every V2 store in one consistent readonly transaction. */
export async function createDatabaseBackup(now = new Date()): Promise<DatabaseBackup> {
  const requests = await runTransaction(STORE_NAMES, 'readonly', tx => {
    const result = {} as Record<StoreName, IDBRequest<unknown[]>>;
    for (const name of STORE_NAMES) result[name] = tx.objectStore(name).getAll();
    return result;
  });
  const stores = {} as Record<StoreName, unknown[]>;
  for (const name of STORE_NAMES) stores[name] = requests[name].result;
  const recordCounts = Object.fromEntries(STORE_NAMES.map(name => [name, stores[name].length]));
  const payload: Omit<DatabaseBackup, 'checksum'> = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    databaseName: DB_NAME,
    schemaVersion: DB_VERSION,
    createdAt: now.toISOString(),
    stores,
    manifest: {
      storeNames: [...STORE_NAMES],
      recordCounts,
      totalRecords: Object.values(recordCounts).reduce((sum, count) => sum + count, 0)
    }
  };
  return { ...payload, checksum: await checksumBackupPayload(payload) };
}

export function serializeDatabaseBackup(backup: DatabaseBackup): string {
  return JSON.stringify(backup, null, 2);
}
