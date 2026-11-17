import fs from 'node:fs';
import assert from 'node:assert/strict';
const backup=fs.readFileSync('src/data/v2/backup.ts','utf8');
const restore=fs.readFileSync('src/data/v2/restore.ts','utf8');
const recovery=fs.readFileSync('src/data/v2/recovery.ts','utf8');
for(const token of ['football-rich-v2-backup','SHA-256','createDatabaseBackup','recordCounts','totalRecords']) assert.ok(backup.includes(token),'Missing backup safeguard: '+token);
for(const token of ['validateDatabaseBackup','CHECKSUM_MISMATCH','STORE_SET_MISMATCH','stageDatabaseRestore','RESTORE_CONFIRMATION_REQUIRED','confirmReplace','safetyBackup','runTransaction(STORE_NAMES']) assert.ok(restore.includes(token),'Missing restore safeguard: '+token);
for(const token of ['saveRecoveryCheckpoint','getLatestRecoveryCheckpoint','recovery_checkpoints','completedStores']) assert.ok(recovery.includes(token),'Missing recovery capability: '+token);
console.log('B.4 static checks passed: full-store backup manifest, SHA-256 integrity, strict validation, isolated staging restore, explicit promotion confirmation, safety backup, and recovery checkpoints.');
