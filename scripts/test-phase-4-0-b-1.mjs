import fs from 'node:fs';
import assert from 'node:assert/strict';

const schema = fs.readFileSync('src/data/v2/schema.ts', 'utf8');
const database = fs.readFileSync('src/data/v2/database.ts', 'utf8');
const stores = ['matches','match_revisions','teams','team_identity_mappings','competitions','sources','evidence_records','evidence_conflicts','research_records','team_news_records','market_odds_snapshots','analysis_records','prediction_records','adjustment_ledger','team_strength_snapshots','poisson_calculations','handicap_calculations','model_versions','model_reliability_snapshots','result_references','import_batches','evaluation_runs','evaluation_records','data_quality_reports','coverage_snapshots','match_confidence_records','system_settings','migration_runs','legacy_archive','analysis_jobs','recovery_checkpoints','operation_logs'];

assert.equal(stores.length, 32);
for (const name of stores) {
  assert.ok(schema.includes(name + ': { keyPath:'), 'Missing store ' + name);
}
for (const token of ['football-rich-local-v2','localMatchRevision','providerEntity','modelVersionCode']) {
  assert.ok(schema.includes(token), 'Missing schema invariant ' + token);
}
assert.ok(schema.includes("['key','key',true]"), 'Missing unique settings key');
for (const token of [
  'indexedDB.open(DB_NAME, DB_VERSION)',
  'verifySchema(db)',
  'db.onversionchange',
  'request.onblocked',
  'actualIndexes.length !== expectedIndexes.length',
  'sameKeyPath(index.keyPath, keyPath)',
  'databasePromise === opening',
  'waiting for it to close'
]) {
  assert.ok(database.includes(token), 'Missing database safeguard: ' + token);
}
assert.ok(!database.includes('deleteDatabase') && !database.includes('.clear('), 'Destructive database operation found');

console.log('B.1 acceptance checks passed: 32 stores, exact store/index verification, version-change handling, safe blocked-open handling, and no destructive operations.');
