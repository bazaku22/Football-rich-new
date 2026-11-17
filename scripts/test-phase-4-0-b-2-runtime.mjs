import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const ts = require('typescript');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'football-rich-b2-runtime-'));
const files = ['schema.ts','database.ts','transaction.ts','repositories.ts'];
for (const file of files) {
  const source = fs.readFileSync(path.join('src','data','v2',file),'utf8');
  const output = ts.transpileModule(source,{
    fileName:file,
    compilerOptions:{
      target:ts.ScriptTarget.ES2022,
      module:ts.ModuleKind.ES2022,
      importsNotUsedAsValues:ts.ImportsNotUsedAsValues.Remove
    }
  }).outputText;
  fs.writeFileSync(path.join(temp,file.replace(/\.ts$/,'.js')),output);
}
fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
await import(pathToFileURL(require.resolve('fake-indexeddb/auto')));
const database = await import(pathToFileURL(path.join(temp,'database.js')));
const transaction = await import(pathToFileURL(path.join(temp,'transaction.js')));
const repositories = await import(pathToFileURL(path.join(temp,'repositories.js')));

const teams = repositories.createRepository('teams');
const competitions = repositories.createRepository('competitions');

await transaction.runTransaction(['teams','competitions'],'readwrite',(tx)=>{
  tx.objectStore('teams').add({teamId:'team-atomic',nameNormalized:'atomic'});
  tx.objectStore('competitions').add({competitionId:'comp-atomic',nameNormalized:'atomic'});
  return 'committed';
});
assert.equal((await teams.get('team-atomic')).nameNormalized,'atomic');
assert.equal((await competitions.get('comp-atomic')).nameNormalized,'atomic');

await assert.rejects(
  transaction.runTransaction(['teams','competitions'],'readwrite',(tx)=>{
    tx.objectStore('teams').add({teamId:'team-rollback',nameNormalized:'rollback'});
    tx.objectStore('competitions').add({competitionId:'comp-rollback',nameNormalized:'rollback'});
    throw new Error('forced transaction rollback');
  }),
  /forced transaction rollback/
);
assert.equal(await teams.get('team-rollback'),undefined);
assert.equal(await competitions.get('comp-rollback'),undefined);

await assert.rejects(
  transaction.runTransaction(['teams'],'readwrite',async(tx)=>{
    tx.objectStore('teams').add({teamId:'team-async-rejected',nameNormalized:'async'});
    await Promise.resolve();
  }),
  error=>error.code==='DB_VALIDATION_FAILED'
);
assert.equal(await teams.get('team-async-rejected'),undefined);

await teams.add({teamId:'team-crud',nameNormalized:'before',competitionId:'comp-atomic'});
await teams.put({teamId:'team-crud',nameNormalized:'after',competitionId:'comp-atomic'});
assert.equal((await teams.get('team-crud')).nameNormalized,'after');
assert.equal((await teams.getByIndex('competitionId','comp-atomic')).length,2);
assert.equal(await teams.count('comp-atomic'),0); // primary-key query, not an index query
assert.equal(await teams.count(),2);
await teams.delete('team-crud');
assert.equal(await teams.get('team-crud'),undefined);

await assert.rejects(
  teams.addMany([
    {teamId:'team-batch-duplicate',nameNormalized:'first'},
    {teamId:'team-batch-duplicate',nameNormalized:'second'}
  ]),
  error=>error.code==='DB_DUPLICATE_RECORD'
);
assert.equal(await teams.get('team-batch-duplicate'),undefined);

const models = repositories.createRepository('model_versions');
await models.add({modelVersionId:'model-1',modelVersionCode:'poisson-core-v1',status:'DRAFT'});
await assert.rejects(
  models.add({modelVersionId:'model-2',modelVersionCode:'poisson-core-v1',status:'DRAFT'}),
  error=>error.code==='DB_DUPLICATE_RECORD'
);

const analyses = repositories.createRepository('analysis_records');
assert.equal(analyses.immutable,true);
await analyses.add({analysisId:'analysis-1',localMatchId:'match-1',createdAt:'2026-11-17T00:00:00.000Z'});
assert.throws(
  ()=>analyses.put({analysisId:'analysis-1',localMatchId:'match-1'}),
  error=>error.code==='DB_VALIDATION_FAILED'
);
assert.throws(
  ()=>analyses.delete('analysis-1'),
  error=>error.code==='DB_VALIDATION_FAILED'
);
assert.equal((await analyses.get('analysis-1')).localMatchId,'match-1');

assert.throws(
  ()=>teams.add({nameNormalized:'missing primary key'}),
  error=>error.code==='DB_VALIDATION_FAILED'
);
await assert.rejects(
  teams.getByIndex('notAnIndex','x'),
  error=>error.code==='DB_VALIDATION_FAILED'
);
await assert.rejects(
  transaction.runTransaction([],'readonly',()=>undefined),
  error=>error.code==='DB_VALIDATION_FAILED'
);

database.closeDatabase();
fs.rmSync(temp,{recursive:true,force:true});
console.log('B.2 IndexedDB runtime tests passed: multi-store atomic commit, rollback, async-callback rejection, CRUD, index reads, duplicate rollback, immutable-store protections, and validation.');
