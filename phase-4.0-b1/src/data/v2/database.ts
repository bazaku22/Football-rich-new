import { DB_NAME, DB_VERSION, STORE_DEFINITIONS, STORE_NAMES, type StoreName } from './schema.js';

let databasePromise: Promise<IDBDatabase> | undefined;

function createSchema(db: IDBDatabase): void {
  for (const name of STORE_NAMES) {
    const definition = STORE_DEFINITIONS[name];
    if (db.objectStoreNames.contains(name)) continue;
    const store = db.createObjectStore(name, { keyPath: definition.keyPath });
    for (const [indexName, keyPath, unique] of definition.indexes) {
      store.createIndex(indexName, keyPath as string | string[], { unique });
    }
  }
}

function sameKeyPath(actual: string | string[] | null, expected: string | readonly string[]): boolean {
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && actual.length === expected.length &&
      actual.every((part, index) => part === expected[index]);
  }
  return actual === expected;
}

/** Fail closed on missing, unexpected, or mismatched stores and indexes. */
export function verifySchema(db: IDBDatabase): void {
  const actualStores = Array.from(db.objectStoreNames).sort();
  const expectedStores = [...STORE_NAMES].sort();
  if (actualStores.length !== expectedStores.length ||
      actualStores.some((name, index) => name !== expectedStores[index])) {
    throw new Error(`DB_SCHEMA_MISMATCH: expected ${expectedStores.length} stores; found ${actualStores.length}.`);
  }

  const tx = db.transaction([...STORE_NAMES], 'readonly');
  for (const name of STORE_NAMES) {
    const store = tx.objectStore(name);
    const definition = STORE_DEFINITIONS[name];
    if (!sameKeyPath(store.keyPath, definition.keyPath)) {
      throw new Error(`DB_SCHEMA_MISMATCH: invalid keyPath for ${name}.`);
    }

    const actualIndexes = Array.from(store.indexNames).sort();
    const expectedIndexes = definition.indexes.map(([indexName]) => indexName).sort();
    if (actualIndexes.length !== expectedIndexes.length ||
        actualIndexes.some((indexName, index) => indexName !== expectedIndexes[index])) {
      throw new Error(`DB_SCHEMA_MISMATCH: unexpected index set for ${name}.`);
    }

    for (const [indexName, keyPath, unique] of definition.indexes) {
      const index = store.index(indexName);
      if (!sameKeyPath(index.keyPath, keyPath) || index.unique !== unique) {
        throw new Error(`DB_SCHEMA_MISMATCH: invalid index ${name}.${indexName}.`);
      }
    }
  }
}

export function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable in this browser.'));
  }
  if (databasePromise) return databasePromise;

  let opening: Promise<IDBDatabase>;
  opening = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => createSchema(request.result);
    request.onsuccess = () => {
      const db = request.result;
      try {
        verifySchema(db);
      } catch (error) {
        db.close();
        if (databasePromise === opening) databasePromise = undefined;
        reject(error);
        return;
      }
      db.onversionchange = () => {
        db.close();
        if (databasePromise === opening) databasePromise = undefined;
      };
      resolve(db);
    };
    request.onerror = () => {
      if (databasePromise === opening) databasePromise = undefined;
      reject(request.error ?? new Error('Could not open Football rich V2 database.'));
    };
    request.onblocked = () => {
      // A blocked request may still succeed after the other tab closes its connection.
      // Keep this promise pending; rejecting here can leak a later successful connection.
      console.warn('Football rich V2 database open is blocked by another tab; waiting for it to close.');
    };
  });

  databasePromise = opening;
  return opening;
}

export function closeDatabase(): void {
  if (!databasePromise) return;
  void databasePromise.then(db => db.close()).catch(() => undefined);
  databasePromise = undefined;
}

export async function getDatabaseInfo(): Promise<{ name: string; version: number; stores: StoreName[] }> {
  const db = await openDatabase();
  return { name: db.name, version: db.version, stores: [...STORE_NAMES] };
}
