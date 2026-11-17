import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
const require = createRequire(path.join(process.cwd(),'package.json'));
const ts = require('typescript');
globalThis.crypto ??= webcrypto;

const temp = fs.mkdtempSync(path.join(os.tmpdir(),'football-rich-b4-runtime-'));
const sourceDir = path.join('src','data','v2');
for (const name of ['schema.ts','database.ts','transaction.ts','repositories.ts','backup.ts','restore.ts','recovery.ts']) {
  const source = fs.readFileSync(path.join(sourceDir,name),'utf8');
  const output = ts.transpileModule(source,{
    fileName:name,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,importsNotUsedAsValues:ts.ImportsNotUsedAsValues.Remove}
  }).outputText;
  fs.writeFileSync(path.join(temp,name.replace(/\\.ts$/,'.js')),output);
}
fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
await import(pathToFileURL(require.resolve('fake-indexeddb/auto')));
const schema = await import(pathToFileURL(path.join(temp,'schema.js')));
const database = await import(pathToFileURL(path.join(temp,'database.js')));
const repos = await import(pathToFileURL(path.join(temp,'repositories.js')));
const backupApi = await import(pathToFileURL(path.join(temp,'backup.js')));
const restoreApi = await import(pathToFileURL(path.join(temp,'restore.js')));
const recoveryApi = await import(pathToFileURL(path.join(temp,'recovery.js')));

await repos.createRepository('teams').add({teamId:'team-live',nameNormalized:'live'});
await repos.createRepository('matches').add({localMatchId:'match-live',homeTeamId:'team-live',awayTeamId:'team-away',revision:1});
const backup = await backupApi.createDatabaseBackup(new Date('2026-11-17T10:00:00.000Z'));
assert.equal(backup.manifest.totalRecords,2);
assert.equal(backup.manifest.recordCounts.teams,1);
assert.equal(backup.stores.matches.length,1);
const serialized = backupApi.serializeDatabaseBackup(backup);
const valid = await restoreApi.validateDatabaseBackup(serialized);
assert.equal(valid.report.valid,true);
assert.equal(valid.report.totalRecords,2);

const tampered = JSON.parse(serialized);
tampered.stores.teams[0].nameNormalized='tampered';
const invalid = await restoreApi.validateDatabaseBackup(tampered);
assert.equal(invalid.report.valid,false);
assert.ok(invalid.report.errors.includes('CHECKSUM_MISMATCH'));

const badFormat = await restoreApi.validateDatabaseBackup('not-json');
assert.equal(badFormat.report.valid,false);
assert.ok(badFormat.report.errors.includes('INVALID_JSON'));

const staged = await restoreApi.stageDatabaseRestore(serialized);
assert.equal(staged.valid,true);
assert.equal((await repos.createRepository('teams').get('team-live')).nameNormalized,'live');
assert.equal(await repos.createRepository('teams').count(),1);

await assert.rejects(
  restoreApi.promoteStagedRestore({confirmReplace:false}),
  /RESTORE_CONFIRMATION_REQUIRED/
);
await repos.createRepository('teams').add({teamId:'team-new-live',nameNormalized:'new-live'});
const promoted = await restoreApi.promoteStagedRestore({confirmReplace:true});
assert.equal(promoted.safetyBackup.manifest.recordCounts.teams,2);
assert.equal(promoted.restoredCounts.teams,1);
assert.equal(await repos.createRepository('teams').get('team-new-live'),undefined);
assert.equal((await repos.createRepository('teams').get('team-live')).nameNormalized,'live');

await recoveryApi.saveRecoveryCheckpoint({
  checkpointId:'checkpoint-1',jobId:'restore-job-1',createdAt:'2026-11-17T11:00:00.000Z',
  status:'IN_PROGRESS',completedStores:['teams','matches'],totalStores:schema.STORE_NAMES.length
});
const latest = await recoveryApi.getLatestRecoveryCheckpoint('restore-job-1');
assert.equal(latest.checkpointId,'checkpoint-1');
assert.equal(latest.completedStores.length,2);
await assert.rejects(
  recoveryApi.saveRecoveryCheckpoint({
    checkpointId:'checkpoint-invalid',jobId:'restore-job-1',createdAt:'bad-date',
    status:'IN_PROGRESS',completedStores:[],totalStores:0
  }),
  /INVALID_CHECKPOINT_TIMESTAMP/
);

database.closeDatabase();
fs.rmSync(temp,{recursive:true,force:true});
console.log('B.4 IndexedDB runtime tests passed: 32-store consistent backup, SHA-256 tamper detection, strict validation, isolated staging, explicit atomic promotion, safety backup, and recovery checkpoints.');
