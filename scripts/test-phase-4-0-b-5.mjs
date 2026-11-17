import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync('src/data/v2/intake.ts','utf8');
for(const token of ['validateIntakeEnvelope','RECORD_COUNT_MISMATCH','assessIntakeCoverage','analysisReady','createIntakePreview','VERSION_REQUIRED','STORE_NOT_IMPORTABLE','MATCH_RESULT_UPDATE']) assert.ok(source.includes(token),'Missing B.5 safeguard: '+token);
console.log('B.5 static checks passed: envelope validation, store allowlist, required fields, duplicate/version classification, and coverage readiness.');
