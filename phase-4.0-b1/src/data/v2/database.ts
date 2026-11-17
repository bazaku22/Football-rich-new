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

/** Fail closed on an unexpected schema; never auto-delete or destructively repair data. */
export function verifySchema(db: IDBDatabase): void {
  const actual = Array.from(db.objectStoreNames).sort();
  const expected = [...STORE_NAMES].sort();
  if (actual.length !== expected.length || actual.some((name, i) => name !== expected[i])) {
    throw new Error(`DB_SCHEMA_MISMATCH: expected ${expected.length} stores; found ${actual.length}.`);
  }
  const tx = db.transaction([...STORE_NAMES], 'readonly');
  for (const name of STORE_NAMES) {
    const store = tx.objectStore(name);
    const definition = STORE_DEFINITIONS[name];
    if (store.keyPath !== definition.keyPath) throw new Error(`DB_SCHEMA_MISMATCH: invalid keyPath for ${name}.`);
    for (const [indexName, keyPath, unique] of definition.indexes) {
      if (!store.indexNames.contains(indexName)) throw new Error(`DB_SCHEMA_MISMATCH: missing index ${name}.${indexName}.`);
      const index = store.index(indexName);
      const expectedKey = Array.isArray(keyPath) ? keyPath.join(',') : keyPath;
      const actualKey = Array.isArray(index.keyPath) ? Array.from(index.keyPath).join(',') : index.keyPath;
      if (actualKey !== expectedKey || index.unique !== unique) throw new Error(`DB_SCHEMA_MISMATCH: invalid index ${name}.${indexName}.`);
    }
  }
}

export function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB is unavailable in this browser.'));
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => createSchema(request.result);
    request.onsuccess = () => {
      const db = request.result;
      try { verifySchema(db); }
      catch (error) { db.close(); databasePromise = undefined; reject(error); return; }
      db.onversionchange = () => { db.close(); databasePromise = undefined; };
      resolve(db);
    };
    request.onerror = () => { databasePromise = undefined; reject(request.error ?? new Error('Could not open Football rich V2 database.')); };
    request.onblocked = () => { databasePromise = undefined; reject(new Error('DB_VERSION_CONFLICT: V2 database upgrade is blocked by another tab.')); };
  });
  return databasePromise;
}

export function closeDatabase(): void {
  if (!databasePromise) return;
  void databasePromise.then(db => db.close()).catch(() => undefined);
  databasePromise = undefined;
}

export async function getDatabaseInfo(): Promise<{name:string;version:number;stores:StoreName[]}> {
  const db = await openDatabase();
  return { name: db.name, version: db.version, stores: [...STORE_NAMES] };
}
