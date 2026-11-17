import { DB_NAME, DB_VERSION, STORE_DEFINITIONS, STORE_NAMES, type StoreName } from './schema.js';
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION, checksumBackupPayload, createDatabaseBackup, type DatabaseBackup } from './backup.js';
import { runTransaction } from './transaction.js';

const STAGING_DB_NAME = DB_NAME + '-restore-staging';
// Promotion is permitted only for a backup validated and staged in this page session.
// Requiring this in-memory proof also prevents stale staging data surviving a reload
// from being promoted without being revalidated.
let stagedRestoreProof: DatabaseBackup | null = null;

export interface RestoreValidation {
  valid: boolean;
  errors: string[];
  totalRecords: number;
  recordCounts: Record<string, number>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function validateDatabaseBackup(input: string | unknown): Promise<{ backup?: DatabaseBackup; report: RestoreValidation }> {
  const errors: string[] = [];
  let value: unknown = input;
  if (typeof input === 'string') {
    try { value = JSON.parse(input); } catch { errors.push('INVALID_JSON'); }
  }
  if (!isObject(value)) {
    errors.push('INVALID_BACKUP_OBJECT');
    return { report: { valid: false, errors, totalRecords: 0, recordCounts: {} } };
  }
  const backup = value as unknown as DatabaseBackup;
  if (backup.format !== BACKUP_FORMAT) errors.push('UNSUPPORTED_BACKUP_FORMAT');
  if (backup.formatVersion !== BACKUP_FORMAT_VERSION) errors.push('UNSUPPORTED_BACKUP_VERSION');
  if (backup.databaseName !== DB_NAME || backup.schemaVersion !== DB_VERSION) errors.push('SCHEMA_VERSION_MISMATCH');
  if (!isObject(backup.stores)) errors.push('MISSING_STORE_DATA');
  const actualNames = isObject(backup.stores) ? Object.keys(backup.stores).sort() : [];
  const expectedNames = [...STORE_NAMES].sort();
  if (actualNames.length !== expectedNames.length || actualNames.some((name, index) => name !== expectedNames[index])) {
    errors.push('STORE_SET_MISMATCH');
  }

  const recordCounts: Record<string, number> = {};
  let totalRecords = 0;
  if (isObject(backup.stores)) {
    for (const name of STORE_NAMES) {
      const rows = (backup.stores as Record<string, unknown>)[name];
      if (!Array.isArray(rows)) {
        errors.push('INVALID_STORE_ROWS:' + name);
        continue;
      }
      recordCounts[name] = rows.length;
      totalRecords += rows.length;
      const keyPath = STORE_DEFINITIONS[name].keyPath;
      const seen = new Set<string>();
      for (const row of rows) {
        if (!isObject(row) || typeof keyPath !== 'string' ||
            typeof row[keyPath] !== 'string' || !(row[keyPath] as string).trim()) {
          errors.push('INVALID_PRIMARY_KEY:' + name);
          break;
        }
        const key = row[keyPath] as string;
        if (seen.has(key)) { errors.push('DUPLICATE_PRIMARY_KEY:' + name); break; }
        seen.add(key);
      }
    }
  }
  if (!isObject(backup.manifest) ||
      !Array.isArray(backup.manifest.storeNames) ||
      !isObject(backup.manifest.recordCounts) ||
      backup.manifest.totalRecords !== totalRecords) {
    errors.push('MANIFEST_MISMATCH');
  } else {
    const names = [...backup.manifest.storeNames].sort();
    if (names.length !== expectedNames.length || names.some((name, index) => name !== expectedNames[index])) errors.push('MANIFEST_STORE_MISMATCH');
    for (const name of STORE_NAMES) {
      if (backup.manifest.recordCounts[name] !== recordCounts[name]) errors.push('MANIFEST_COUNT_MISMATCH:' + name);
    }
  }
  if (typeof backup.createdAt !== 'string' || !Number.isFinite(Date.parse(backup.createdAt))) errors.push('INVALID_BACKUP_TIMESTAMP');
  if (typeof backup.checksum !== 'string' || !/^[a-f0-9]{64}$/.test(backup.checksum)) {
    errors.push('INVALID_CHECKSUM');
  } else if (errors.length === 0) {
    const { checksum: _checksum, ...payload } = backup;
    if (await checksumBackupPayload(payload) !== backup.checksum) errors.push('CHECKSUM_MISMATCH');
  }
  return {
    backup: errors.length === 0 ? backup : undefined,
    report: { valid: errors.length === 0, errors, totalRecords, recordCounts }
  };
}

function openStagingDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STAGING_DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORE_NAMES) {
        const spec = STORE_DEFINITIONS[name];
        const store = db.createObjectStore(name, { keyPath: spec.keyPath });
        for (const [indexName, keyPath, unique] of spec.indexes) {
          store.createIndex(indexName, keyPath as string | string[], { unique });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open restore staging database.'));
    request.onblocked = () => console.warn('Restore staging database open is blocked by another tab.');
  });
}

/** Load and verify backup data in a separate staging DB; live V2 is untouched. */
export async function stageDatabaseRestore(input: string | unknown): Promise<RestoreValidation> {
  // Any new staging attempt invalidates the previous promotion authorization first.
  stagedRestoreProof = null;
  const { backup, report } = await validateDatabaseBackup(input);
  if (!backup) return report;
  const staging = await openStagingDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = staging.transaction([...STORE_NAMES], 'readwrite');
      for (const name of STORE_NAMES) {
        const store = tx.objectStore(name);
        store.clear();
        for (const record of backup.stores[name]) store.add(record);
      }
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? new Error('Staging restore transaction aborted.'));
      tx.onerror = () => undefined;
    });
    for (const name of STORE_NAMES) {
      const count = await new Promise<number>((resolve, reject) => {
        const tx = staging.transaction(name, 'readonly');
        const request = tx.objectStore(name).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (count !== report.recordCounts[name]) throw new Error('STAGING_COUNT_MISMATCH:' + name);
    }
    // Keep an immutable copy of the exact validated payload for promotion-time verification.
    stagedRestoreProof = structuredClone(backup);
    return report;
  } finally {
    staging.close();
  }
}

/**
 * Replace live V2 only after explicit confirmation. The previous live database is
 * returned as a verified safety backup. All 32 stores change in one transaction.
 */
export async function promoteStagedRestore(options: { confirmReplace: boolean }): Promise<{ safetyBackup: DatabaseBackup; restoredCounts: Record<string, number> }> {
  if (options.confirmReplace !== true) throw new Error('RESTORE_CONFIRMATION_REQUIRED');
  if (!stagedRestoreProof) throw new Error('RESTORE_STAGING_NOT_VALIDATED');
  const staged = await openStagingDatabase();
  try {
    const stagedRows = await new Promise<Record<StoreName, unknown[]>>((resolve, reject) => {
      const tx = staged.transaction([...STORE_NAMES], 'readonly');
      const requests = {} as Record<StoreName, IDBRequest<unknown[]>>;
      for (const name of STORE_NAMES) requests[name] = tx.objectStore(name).getAll();
      tx.oncomplete = () => {
        const rows = {} as Record<StoreName, unknown[]>;
        for (const name of STORE_NAMES) rows[name] = requests[name].result;
        resolve(rows);
      };
      tx.onabort = () => reject(tx.error ?? new Error('Could not read staged restore data.'));
    });
    const restoredCounts = Object.fromEntries(STORE_NAMES.map(name => [name, stagedRows[name].length]));
    const stagedPayload: Omit<DatabaseBackup, 'checksum'> = {
      format: stagedRestoreProof.format,
      formatVersion: stagedRestoreProof.formatVersion,
      databaseName: stagedRestoreProof.databaseName,
      schemaVersion: stagedRestoreProof.schemaVersion,
      createdAt: stagedRestoreProof.createdAt,
      stores: stagedRows,
      manifest: stagedRestoreProof.manifest
    };
    const stagedChecksum = await checksumBackupPayload(stagedPayload);
    if (stagedChecksum !== stagedRestoreProof.checksum ||
        STORE_NAMES.some(name => restoredCounts[name] !== stagedRestoreProof?.manifest.recordCounts[name])) {
      stagedRestoreProof = null;
      throw new Error('STAGING_CHECKSUM_MISMATCH');
    }
    // Create the safety backup only after the staged copy has passed its second integrity check.
    const safetyBackup = await createDatabaseBackup();
    await runTransaction(STORE_NAMES, 'readwrite', tx => {
      for (const name of STORE_NAMES) {
        const store = tx.objectStore(name);
        store.clear();
        for (const record of stagedRows[name]) store.add(record);
      }
    });
    stagedRestoreProof = null;
    return { safetyBackup, restoredCounts };
  } finally {
    staged.close();
  }
}
