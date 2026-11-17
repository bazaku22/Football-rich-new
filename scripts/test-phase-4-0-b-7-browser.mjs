import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const ts = require('typescript');
const { chromium } = require('playwright');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'football-rich-b7-browser-'));
const sourceModules = [
  ['phase-4.0-b1/src/data/v2/schema.ts', 'schema.js'],
  ['phase-4.0-b1/src/data/v2/database.ts', 'database.js'],
  ['phase-4.0-b2/src/data/v2/transaction.ts', 'transaction.js'],
  ['phase-4.0-b2/src/data/v2/repositories.ts', 'repositories.js'],
  ['phase-4.0-b3/src/data/v2/integrity-validator.ts', 'integrity-validator.js'],
  ['phase-4.0-b3/src/data/v2/revision.ts', 'revision.js'],
  ['phase-4.0-b4/src/data/v2/backup.ts', 'backup.js'],
  ['phase-4.0-b4/src/data/v2/restore.ts', 'restore.js'],
  ['phase-4.0-b4/src/data/v2/recovery.ts', 'recovery.js']
];

for (const [sourcePath, outputName] of sourceModules) {
  const source = fs.readFileSync(path.join('..', sourcePath), 'utf8');
  const output = ts.transpileModule(source, {
    fileName: sourcePath,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 }
  }).outputText;
  fs.writeFileSync(path.join(temp, outputName), output);
}

fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
fs.writeFileSync(path.join(temp, 'index.html'), '<!doctype html><meta charset="utf-8"><title>B7 IndexedDB runtime test</title><body>runtime test</body>');
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const file = path.resolve(temp, '.' + pathname);
  if (!file.startsWith(temp + path.sep) && file !== path.join(temp, 'index.html')) {
    res.writeHead(403).end('Forbidden'); return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'text/html');
    res.writeHead(200).end(data);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.goto(origin);
  const result = await page.evaluate(async () => {
    const dbApi = await import('./database.js');
    const repoApi = await import('./repositories.js');
    const txApi = await import('./transaction.js');
    const revisionApi = await import('./revision.js');
    const backupApi = await import('./backup.js');
    const restoreApi = await import('./restore.js');
    const recoveryApi = await import('./recovery.js');
    const info = await dbApi.getDatabaseInfo();
    if (info.name !== 'football-rich-local-v2' || info.stores.length !== 32) throw new Error('REAL_BROWSER_SCHEMA_CHECK_FAILED');

    const teams = repoApi.createRepository('teams');
    const competitions = repoApi.createRepository('competitions');
    const matches = repoApi.createRepository('matches');
    const revisions = repoApi.createRepository('match_revisions');
    await teams.addMany([
      { teamId: 'b7-home', nameNormalized: 'home' },
      { teamId: 'b7-away', nameNormalized: 'away' }
    ]);
    await competitions.add({ competitionId: 'b7-league', nameNormalized: 'league' });
    const match = {
      localMatchId: 'b7-match', competitionId: 'b7-league', season: '2026/27',
      homeTeamId: 'b7-home', awayTeamId: 'b7-away',
      kickoffAt: '2026-11-18T18:00:00.000Z', matchStatus: 'SCHEDULED', revision: 1
    };
    await matches.add(match);

    // Native IndexedDB transaction rollback: no partial records may survive.
    try {
      await txApi.runTransaction(['teams', 'competitions'], 'readwrite', tx => {
        tx.objectStore('teams').add({ teamId: 'b7-rollback-team', nameNormalized: 'rollback' });
        tx.objectStore('competitions').add({ competitionId: 'b7-rollback-league', nameNormalized: 'rollback' });
        throw new Error('B7_EXPECTED_ROLLBACK');
      });
      throw new Error('ROLLBACK_DID_NOT_REJECT');
    } catch (error) {
      if (error.message !== 'B7_EXPECTED_ROLLBACK') throw error;
    }
    if (await teams.get('b7-rollback-team')) throw new Error('ROLLBACK_LEFT_TEAM_RECORD');
    if (await competitions.get('b7-rollback-league')) throw new Error('ROLLBACK_LEFT_COMPETITION_RECORD');

    // Native unique-index failure must abort the whole write.
    await teams.add({ teamId: 'b7-provider-a', nameNormalized: 'provider-a' });
    await teams.add({ teamId: 'b7-provider-b', nameNormalized: 'provider-b' });
    const mappings = repoApi.createRepository('team_identity_mappings');
    await mappings.add({ mappingId: 'b7-map-a', teamId: 'b7-provider-a', providerName: 'test', providerEntityId: 'same-id' });
    let duplicateRejected = false;
    try {
      await mappings.add({ mappingId: 'b7-map-b', teamId: 'b7-provider-b', providerName: 'test', providerEntityId: 'same-id' });
    } catch (error) { duplicateRejected = error.code === 'DB_DUPLICATE_RECORD'; }
    if (!duplicateRejected || await mappings.get('b7-map-b')) throw new Error('UNIQUE_INDEX_ABORT_FAILED');

    const revised = await revisionApi.createMatchRevision({
      localMatchId: 'b7-match', matchRevisionId: 'b7-revision-2', expectedRevision: 1,
      changeType: 'KICKOFF_UPDATE', changedAt: '2026-11-17T12:00:00.000Z',
      afterSnapshot: { ...match, kickoffAt: '2026-11-19T18:00:00.000Z' }
    });
    if (revised.match.revision !== 2 || !(await revisions.get('b7-revision-2'))) throw new Error('REVISION_ATOMIC_APPEND_FAILED');
    let staleRejected = false;
    try {
      await revisionApi.createMatchRevision({
        localMatchId: 'b7-match', matchRevisionId: 'b7-stale-revision', expectedRevision: 1,
        changeType: 'STALE_UPDATE', changedAt: '2026-11-17T12:30:00.000Z',
        afterSnapshot: { ...revised.match, kickoffAt: '2026-11-20T18:00:00.000Z' }
      });
    } catch (error) { staleRejected = error.code === 'DB_REVISION_CONFLICT'; }
    if (!staleRejected || await revisions.count() !== 1) throw new Error('OPTIMISTIC_CONCURRENCY_FAILED');

    // Append-only evidence must reject mutation.
    const evidence = repoApi.createRepository('evidence_records');
    await evidence.add({ evidenceId: 'b7-evidence', localMatchId: 'b7-match', sourceId: 'b7-source', domain: 'FORM', verificationStatus: 'VERIFIED', capturedAt: '2026-11-17T12:00:00.000Z' });
    let immutableRejected = false;
    try { await evidence.put({ evidenceId: 'b7-evidence', domain: 'CHANGED' }); }
    catch (error) { immutableRejected = error.code === 'DB_VALIDATION_FAILED'; }
    if (!immutableRejected) throw new Error('APPEND_ONLY_GUARD_FAILED');

    const beforeRestoreCounts = {
      teams: await teams.count(), matches: await matches.count(),
      revisions: await revisions.count(), evidence: await evidence.count()
    };
    const backup = await backupApi.createDatabaseBackup(new Date('2026-11-17T12:15:00.000Z'));
    const serialized = backupApi.serializeDatabaseBackup(backup);
    const validated = await restoreApi.validateDatabaseBackup(serialized);
    if (!validated.report.valid) throw new Error('BACKUP_CHECKSUM_OR_MANIFEST_FAILED');
    const staged = await restoreApi.stageDatabaseRestore(serialized);
    if (!staged.valid) throw new Error('RESTORE_STAGING_FAILED');
    const afterRestoreCounts = {
      teams: await teams.count(), matches: await matches.count(),
      revisions: await revisions.count(), evidence: await evidence.count()
    };
    if (JSON.stringify(beforeRestoreCounts) !== JSON.stringify(afterRestoreCounts)) throw new Error('RESTORE_STAGING_MUTATED_LIVE_V2');

    await recoveryApi.saveRecoveryCheckpoint({
      checkpointId: 'b7-checkpoint', jobId: 'b7-browser-test',
      createdAt: '2026-11-17T12:20:00.000Z', status: 'COMPLETED',
      completedStores: info.stores, totalStores: 32, backupChecksum: backup.checksum
    });
    const checkpoint = await recoveryApi.getLatestRecoveryCheckpoint('b7-browser-test');
    if (!checkpoint || checkpoint.backupChecksum !== backup.checksum || checkpoint.completedStores.length !== 32) {
      throw new Error('RECOVERY_CHECKPOINT_PERSISTENCE_FAILED');
    }
    const names = await indexedDB.databases();
    if (!names.some(item => item.name === 'football-rich-local-v2') ||
        !names.some(item => item.name === 'football-rich-local-v2-restore-staging')) {
      throw new Error('EXPECTED_V2_DATABASES_NOT_FOUND');
    }
    return { database: info.name, storeCount: info.stores.length, beforeRestoreCounts, afterRestoreCounts, backupChecksum: backup.checksum };
  });
  if (runtimeErrors.length) throw new Error('Browser runtime errors: ' + runtimeErrors.join('; '));
  await page.reload();
  const persisted = await page.evaluate(async () => {
    const { getDatabaseInfo } = await import('./database.js');
    const { createRepository } = await import('./repositories.js');
    const info = await getDatabaseInfo();
    const matches = createRepository('matches');
    const record = await matches.get('b7-match');
    return { name: info.name, stores: info.stores.length, matchRevision: record?.revision };
  });
  assert.equal(persisted.name, 'football-rich-local-v2');
  assert.equal(persisted.stores, 32);
  assert.equal(persisted.matchRevision, 2);
  console.log(JSON.stringify({
    status: 'passed',
    browser: 'Chromium with native IndexedDB',
    ...result,
    persistenceAfterReload: persisted,
    checks: ['32-store schema', 'CRUD', 'multi-store rollback', 'unique-index abort', 'atomic revision append', 'stale revision conflict', 'append-only guard', 'backup checksum and manifest', 'restore staging isolation', 'recovery checkpoint persistence', 'IndexedDB persistence after reload']
  }, null, 2));
  await context.close();
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  fs.rmSync(temp, { recursive: true, force: true });
}
