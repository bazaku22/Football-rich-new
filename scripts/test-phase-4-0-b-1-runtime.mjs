import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const ts = require('typescript');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'football-rich-b1-runtime-'));
const schemaSource = fs.readFileSync('src/data/v2/schema.ts', 'utf8');
const databaseSource = fs.readFileSync('src/data/v2/database.ts', 'utf8');

function transpile(source, fileName) {
  const result = ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove
    }
  });
  if (result.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error)) {
    throw new Error(ts.formatDiagnostics(result.diagnostics, {
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getCanonicalFileName: x => x,
      getNewLine: () => '\n'
    }));
  }
  return result.outputText;
}

fs.writeFileSync(path.join(temp, 'schema.js'), transpile(schemaSource, 'schema.ts'));
fs.writeFileSync(path.join(temp, 'database.js'), transpile(databaseSource, 'database.ts'));
fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');

await import(pathToFileURL(require.resolve('fake-indexeddb/auto')));
const schema = await import(pathToFileURL(path.join(temp, 'schema.js')));
const database = await import(pathToFileURL(path.join(temp, 'database.js')));

const db = await database.openDatabase();
assert.equal(db.objectStoreNames.length, 32, 'V2 must create exactly 32 stores');

for (const name of schema.STORE_NAMES) {
  const store = db.transaction(name, 'readonly').objectStore(name);
  const expected = schema.STORE_DEFINITIONS[name];
  assert.equal(store.keyPath, expected.keyPath, name + ' keyPath mismatch');
  const actualNames = Array.from(store.indexNames).sort();
  const expectedNames = expected.indexes.map(([indexName]) => indexName).sort();
  assert.deepEqual(actualNames, expectedNames, name + ' index names mismatch');
  for (const [indexName, keyPath, unique] of expected.indexes) {
    const index = store.index(indexName);
    assert.deepEqual(index.keyPath, keyPath, name + '.' + indexName + ' keyPath mismatch');
    assert.equal(index.unique, unique, name + '.' + indexName + ' unique mismatch');
  }
}

async function expectUniqueConstraint(storeName, first, second) {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  store.add(first);
  store.add(second);
  await new Promise((resolve, reject) => {
    tx.onabort = () => resolve();
    tx.oncomplete = () => reject(new Error(storeName + ' unexpectedly accepted duplicate unique key'));
    tx.onerror = () => {};
  });
  const count = await new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  assert.equal(count, 0, storeName + ' transaction should roll back atomically');
}

await expectUniqueConstraint('match_revisions',
  {matchRevisionId:'mr-1',localMatchId:'m-1',revision:1},
  {matchRevisionId:'mr-2',localMatchId:'m-1',revision:1});
await expectUniqueConstraint('team_identity_mappings',
  {mappingId:'map-1',providerName:'provider',providerEntityId:'team-1'},
  {mappingId:'map-2',providerName:'provider',providerEntityId:'team-1'});
await expectUniqueConstraint('model_versions',
  {modelVersionId:'mv-1',modelVersionCode:'poisson-v1'},
  {modelVersionId:'mv-2',modelVersionCode:'poisson-v1'});
await expectUniqueConstraint('system_settings',
  {settingId:'setting-1',key:'theme'},
  {settingId:'setting-2',key:'theme'});

database.closeDatabase();
const reopened = await database.openDatabase();
assert.equal(reopened.objectStoreNames.length, 32, 'Database must reopen cleanly');
database.closeDatabase();

function createMismatchDatabase(name, mutate) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      for (const storeName of schema.STORE_NAMES) {
        const definition = schema.STORE_DEFINITIONS[storeName];
        const store = request.result.createObjectStore(storeName, {keyPath:definition.keyPath});
        for (const [indexName,keyPath,unique] of definition.indexes) {
          store.createIndex(indexName,keyPath,{unique});
        }
        if (storeName === 'matches') mutate(store);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const extraIndexDb = await createMismatchDatabase('b1-extra-index-check', store => store.createIndex('unexpected','unexpected'));
assert.throws(() => database.verifySchema(extraIndexDb), /DB_SCHEMA_MISMATCH: unexpected index set for matches/);
extraIndexDb.close();

const missingIndexDb = await createMismatchDatabase('b1-missing-index-check', store => store.deleteIndex('kickoffAt'));
assert.throws(() => database.verifySchema(missingIndexDb), /DB_SCHEMA_MISMATCH: unexpected index set for matches/);
missingIndexDb.close();

const originalIndexedDB = globalThis.indexedDB;
try {
  delete globalThis.indexedDB;
  await assert.rejects(database.openDatabase(), /IndexedDB is unavailable/);
} finally {
  globalThis.indexedDB = originalIndexedDB;
}

const databaseText = databaseSource;
assert.match(databaseText, /request\.onblocked\s*=\s*\(\)\s*=>\s*\{/);
assert.match(databaseText, /blocked request may still succeed/);
assert.doesNotMatch(databaseText, /onblocked\s*=\s*\(\)\s*=>\s*\{[^}]*reject\(/s);

fs.rmSync(temp, {recursive:true,force:true});
console.log('B.1 IndexedDB runtime tests passed: 32 stores/indexes, four unique constraints with rollback, reopen, extra/missing index rejection, unavailable IndexedDB, and blocked-open safety guard.');
