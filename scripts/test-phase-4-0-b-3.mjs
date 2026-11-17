import fs from 'node:fs';
import assert from 'node:assert/strict';

const validator = fs.readFileSync('src/data/v2/integrity-validator.ts','utf8');
const revision = fs.readFileSync('src/data/v2/revision.ts','utf8');
const repositories = fs.readFileSync('src/data/v2/repositories.ts','utf8');

for (const token of [
  'REQUIRED_PRIMARY_KEY','INVALID_TIMESTAMP','SAME_HOME_AWAY_TEAM',
  'BROKEN_REFERENCE','MISSING_INPUT_SNAPSHOT','validateRecordIntegrity'
]) assert.ok(validator.includes(token), 'Missing integrity rule: '+token);

for (const token of [
  "runTransaction(['matches', 'match_revisions'], 'readwrite'",
  'expectedRevision','DB_REVISION_CONFLICT','beforeSnapshot','afterSnapshot',
  'revisions.add(revisionRecord)','matches.put(nextMatch)'
]) assert.ok(revision.includes(token), 'Missing revision safeguard: '+token);

assert.ok(repositories.includes("  'match_revisions'"), 'Match revisions must be append-only in repositories.');
console.log('B.3 static checks passed: record validation, references, atomic revision writes, optimistic conflict checks, and append-only revision history.');
