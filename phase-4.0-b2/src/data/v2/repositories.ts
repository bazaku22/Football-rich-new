import { STORE_DEFINITIONS, type DatabaseRecord, type StoreName } from './schema.js';
import { DatabaseOperationError, runTransaction } from './transaction.js';

const IMMUTABLE_STORES = new Set<StoreName>([
  'evidence_records',
  'analysis_records',
  'prediction_records',
  'adjustment_ledger',
  'poisson_calculations',
  'handicap_calculations',
  'result_references',
  'evaluation_records',
  'operation_logs'
]);

function primaryKey(storeName: StoreName, record: DatabaseRecord): IDBValidKey {
  const keyPath = STORE_DEFINITIONS[storeName].keyPath;
  if (typeof keyPath !== 'string') {
    throw new DatabaseOperationError('DB_VALIDATION_FAILED', `Unsupported compound primary key for ${storeName}.`);
  }
  const key = record[keyPath];
  if (typeof key !== 'string' || key.trim().length === 0) {
    throw new DatabaseOperationError('DB_VALIDATION_FAILED', `${storeName} record requires a non-empty string ${keyPath}.`);
  }
  return key;
}

function assertMutable(storeName: StoreName, action: 'update' | 'delete'): void {
  if (IMMUTABLE_STORES.has(storeName)) {
    throw new DatabaseOperationError(
      'DB_VALIDATION_FAILED',
      `${storeName} is append-only; ${action} is not permitted.`
    );
  }
}

export function isImmutableStore(storeName: StoreName): boolean {
  return IMMUTABLE_STORES.has(storeName);
}

export function addRecord<K extends StoreName>(storeName: K, record: DatabaseRecord): Promise<void> {
  primaryKey(storeName, record);
  return runTransaction([storeName], 'readwrite', (tx) => {
    tx.objectStore(storeName).add(record);
  });
}

export function addRecords<K extends StoreName>(storeName: K, records: readonly DatabaseRecord[]): Promise<void> {
  for (const record of records) primaryKey(storeName, record);
  return runTransaction([storeName], 'readwrite', (tx) => {
    const store = tx.objectStore(storeName);
    for (const record of records) store.add(record);
  });
}

export function putRecord<K extends StoreName>(storeName: K, record: DatabaseRecord): Promise<void> {
  assertMutable(storeName, 'update');
  primaryKey(storeName, record);
  return runTransaction([storeName], 'readwrite', (tx) => {
    tx.objectStore(storeName).put(record);
  });
}

export function deleteRecord(storeName: StoreName, id: IDBValidKey): Promise<void> {
  assertMutable(storeName, 'delete');
  return runTransaction([storeName], 'readwrite', (tx) => {
    tx.objectStore(storeName).delete(id);
  });
}

export async function getRecord<K extends StoreName>(
  storeName: K,
  id: IDBValidKey
): Promise<DatabaseRecord | undefined> {
  const request = await runTransaction([storeName], 'readonly', (tx) =>
    tx.objectStore(storeName).get(id)
  );
  return request.result as DatabaseRecord | undefined;
}

export async function getAllRecords<K extends StoreName>(
  storeName: K,
  query?: IDBValidKey | IDBKeyRange,
  count?: number
): Promise<DatabaseRecord[]> {
  const request = await runTransaction([storeName], 'readonly', (tx) =>
    tx.objectStore(storeName).getAll(query, count)
  );
  return request.result as DatabaseRecord[];
}

export async function getRecordsByIndex<K extends StoreName>(
  storeName: K,
  indexName: string,
  query?: IDBValidKey | IDBKeyRange,
  count?: number
): Promise<DatabaseRecord[]> {
  const request = await runTransaction([storeName], 'readonly', (tx) => {
    const store = tx.objectStore(storeName);
    if (!store.indexNames.contains(indexName)) {
      throw new DatabaseOperationError('DB_VALIDATION_FAILED', `Index ${storeName}.${indexName} does not exist.`);
    }
    return store.index(indexName).getAll(query, count);
  });
  return request.result as DatabaseRecord[];
}

export async function countRecords<K extends StoreName>(
  storeName: K,
  query?: IDBValidKey | IDBKeyRange
): Promise<number> {
  const request = await runTransaction([storeName], 'readonly', (tx) =>
    tx.objectStore(storeName).count(query)
  );
  return request.result;
}

export function createRepository<K extends StoreName>(storeName: K) {
  return Object.freeze({
    storeName,
    immutable: isImmutableStore(storeName),
    add: (record: DatabaseRecord) => addRecord(storeName, record),
    addMany: (records: readonly DatabaseRecord[]) => addRecords(storeName, records),
    get: (id: IDBValidKey) => getRecord(storeName, id),
    getAll: (query?: IDBValidKey | IDBKeyRange, count?: number) => getAllRecords(storeName, query, count),
    getByIndex: (indexName: string, query?: IDBValidKey | IDBKeyRange, count?: number) =>
      getRecordsByIndex(storeName, indexName, query, count),
    count: (query?: IDBValidKey | IDBKeyRange) => countRecords(storeName, query),
    put: (record: DatabaseRecord) => putRecord(storeName, record),
    delete: (id: IDBValidKey) => deleteRecord(storeName, id)
  });
}
