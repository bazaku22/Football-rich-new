import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const ts = require('typescript');
globalThis.crypto ??= webcrypto;

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'football-rich-b6-acceptance-'));
const sourceDir = path.join('src', 'data', 'v2');
const modules = [
  'schema.ts', 'database.ts', 'transaction.ts', 'repositories.ts',
  'integrity-validator.ts', 'revision.ts', 'backup.ts', 'restore.ts',
  'recovery.ts', 'intake.ts'
];

for (const name of modules) {
  const source = fs.readFileSync(path.join(sourceDir, name), 'utf8');
  const output = ts.transpileModule(source, {
    fileName: name,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove
    }
  }).outputText;
  fs.writeFileSync(path.join(temp, name.replace(/\\.ts$/, '.js')), output);
}
fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
await import(pathToFileURL(require.resolve('fake-indexeddb/auto')));

const schema = await import(pathToFileURL(path.join(temp, 'schema.js')));
const database = await import(pathToFileURL(path.join(temp, 'database.js')));
const repositories = await import(pathToFileURL(path.join(temp, 'repositories.js')));
const integrity = await import(pathToFileURL(path.join(temp, 'integrity-validator.js')));
const revisions = await import(pathToFileURL(path.join(temp, 'revision.js')));
const backupApi = await import(pathToFileURL(path.join(temp, 'backup.js')));
const restoreApi = await import(pathToFileURL(path.join(temp, 'restore.js')));
const recoveryApi = await import(pathToFileURL(path.join(temp, 'recovery.js')));
const intake = await import(pathToFileURL(path.join(temp, 'intake.js')));

// Acceptance 1: one coherent V2 database, repositories and reference integrity.
const info = await database.getDatabaseInfo();
assert.equal(info.name, 'football-rich-local-v2');
assert.equal(info.stores.length, 32);
const teams = repositories.createRepository('teams');
const competitions = repositories.createRepository('competitions');
const matches = repositories.createRepository('matches');
const history = repositories.createRepository('match_revisions');

await teams.addMany([
  { teamId: 'b6-home', nameNormalized: 'home' },
  { teamId: 'b6-away', nameNormalized: 'away' }
]);
await competitions.add({ competitionId: 'b6-league', nameNormalized: 'league' });
const originalMatch = {
  localMatchId: 'b6-match', competitionId: 'b6-league', season: '2026/27',
  homeTeamId: 'b6-home', awayTeamId: 'b6-away',
  kickoffAt: '2026-11-18T18:00:00.000Z', matchStatus: 'SCHEDULED', revision: 1
};
assert.deepEqual(integrity.validateRecord('matches', originalMatch), []);
assert.deepEqual(integrity.validateReferences('matches', originalMatch, {
  teams: new Set(['b6-home', 'b6-away']),
  competitions: new Set(['b6-league'])
}), []);
await matches.add(originalMatch);

// Acceptance 2: optimistic revision and append-only history remain connected.
const revised = await revisions.createMatchRevision({
  localMatchId: 'b6-match', matchRevisionId: 'b6-revision-2',
  expectedRevision: 1, changeType: 'KICKOFF_UPDATE',
  changedAt: '2026-11-17T12:00:00.000Z',
  afterSnapshot: {
    ...originalMatch,
    kickoffAt: '2026-11-19T18:00:00.000Z'
  }
});
assert.equal(revised.match.revision, 2);
assert.equal((await history.get('b6-revision-2')).beforeSnapshot.kickoffAt, originalMatch.kickoffAt);
await assert.rejects(revisions.createMatchRevision({
  localMatchId: 'b6-match', matchRevisionId: 'b6-stale-revision',
  expectedRevision: 1, changeType: 'STALE_UPDATE',
  changedAt: '2026-11-17T12:30:00.000Z',
  afterSnapshot: { ...revised.match, kickoffAt: '2026-11-20T18:00:00.000Z' }
}), error => error.code === 'DB_REVISION_CONFLICT');
assert.equal(await history.count(), 1);

// Acceptance 3: intake envelope, duplicate/revision classification and honest coverage.
const importedMatch = {
  localMatchId: 'b6-import-match', competitionId: 'b6-league',
  homeTeamId: 'b6-home', awayTeamId: 'b6-away',
  kickoffAt: '2026-11-21T18:00:00.000Z'
};
const envelope = {
  format: 'football-rich-data', schemaVersion: '2.0.0',
  exportedAt: '2026-11-17T12:00:00.000Z',
  sourceSystem: 'FOOTBALL_TIME', targetSystem: 'FOOTBALL_RICH',
  importType: 'FIXTURE_UPDATE', batchId: 'b6-batch-1', recordCount: 3,
  records: [
    { store: 'matches', key: 'b6-import-match', value: importedMatch },
    { store: 'teams', key: 'b6-home', value: { teamId: 'b6-home', nameNormalized: 'home' } },
    { store: 'teams', key: 'b6-away', value: { teamId: 'b6-away', nameNormalized: 'away' } }
  ]
};
const validated = intake.validateIntakeEnvelope(envelope);
assert.equal(validated.envelope.batchId, 'b6-batch-1');
const preview = intake.createIntakePreview(envelope);
assert.equal(preview.canCommit, true);
assert.equal(preview.counts.add, 3);
const duplicatePreview = intake.createIntakePreview(envelope, {
  matches: { 'b6-import-match': importedMatch },
  teams: {
    'b6-home': { teamId: 'b6-home', nameNormalized: 'home' },
    'b6-away': { teamId: 'b6-away', nameNormalized: 'away' }
  }
});
assert.equal(duplicatePreview.counts.duplicate, 3);
const changedPreview = intake.createIntakePreview(envelope, {
  matches: { 'b6-import-match': { ...importedMatch, kickoffAt: '2026-11-22T18:00:00.000Z' } }
});
assert.equal(changedPreview.counts.versionRequired, 1);
const coverage = intake.assessIntakeCoverage('b6-import-match', envelope.records, envelope.exportedAt);
assert.equal(coverage.availableDomains, 2);
assert.equal(coverage.analysisReady, false);
assert.equal(coverage.domains.some(x => x.domain === 'FORM' && x.status === 'MISSING'), true);

// Acceptance 4: consistent backup, checksum validation and isolated restore staging.
const backup = await backupApi.createDatabaseBackup(new Date('2026-11-17T12:15:00.000Z'));
const serialized = backupApi.serializeDatabaseBackup(backup);
const verified = await restoreApi.validateDatabaseBackup(serialized);
assert.equal(verified.report.valid, true);
assert.equal(verified.report.totalRecords, 5);
const staged = await restoreApi.stageDatabaseRestore(serialized);
assert.equal(staged.valid, true);
assert.equal(await teams.count(), 2);
assert.equal((await matches.get('b6-match')).revision, 2);

// Acceptance 5: recovery checkpoint is durable and discoverable.
await recoveryApi.saveRecoveryCheckpoint({
  checkpointId: 'b6-checkpoint-1', jobId: 'b6-acceptance',
  createdAt: '2026-11-17T12:20:00.000Z', status: 'COMPLETED',
  completedStores: [...schema.STORE_NAMES], totalStores: schema.STORE_NAMES.length,
  backupChecksum: backup.checksum
});
const checkpoint = await recoveryApi.getLatestRecoveryCheckpoint('b6-acceptance');
assert.equal(checkpoint.checkpointId, 'b6-checkpoint-1');
assert.equal(checkpoint.backupChecksum, backup.checksum);
assert.equal(checkpoint.completedStores.length, 32);

database.closeDatabase();
fs.rmSync(temp, { recursive: true, force: true });
console.log('B.6 integration acceptance passed: V2 schema/repositories, integrity references, optimistic revisions, append-only history, B.5 intake/coverage, verified backup/staging restore, and recovery checkpoints.');
