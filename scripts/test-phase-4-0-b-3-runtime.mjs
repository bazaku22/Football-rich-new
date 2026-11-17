import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.cwd(),'package.json'));
const ts = require('typescript');

const temp = fs.mkdtempSync(path.join(os.tmpdir(),'football-rich-b3-runtime-'));
const sourceDir = path.join('src','data','v2');
const names = ['schema.ts','database.ts','transaction.ts','repositories.ts','integrity-validator.ts','revision.ts'];
for (const name of names) {
  const source = fs.readFileSync(path.join(sourceDir,name),'utf8');
  const output = ts.transpileModule(source,{
    fileName:name,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,importsNotUsedAsValues:ts.ImportsNotUsedAsValues.Remove}
  }).outputText;
  fs.writeFileSync(path.join(temp,name.replace(/\.ts$/,'.js')),output);
}
fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
await import(pathToFileURL(require.resolve('fake-indexeddb/auto')));
const schema = await import(pathToFileURL(path.join(temp,'schema.js')));
const database = await import(pathToFileURL(path.join(temp,'database.js')));
const repos = await import(pathToFileURL(path.join(temp,'repositories.js')));
const integrity = await import(pathToFileURL(path.join(temp,'integrity-validator.js')));
const revisions = await import(pathToFileURL(path.join(temp,'revision.js')));

const validTeam = {teamId:'team-home',nameNormalized:'home'};
assert.deepEqual(integrity.validateRecord('teams',validTeam),[]);
assert.equal(integrity.validateRecord('teams',{nameNormalized:'missing id'})[0].code,'REQUIRED_PRIMARY_KEY');
assert.equal(integrity.validateRecord('matches',{
  localMatchId:'match-bad',homeTeamId:'same',awayTeamId:'same',kickoffAt:'not-a-date'
}).some(x=>x.code==='SAME_HOME_AWAY_TEAM'),true);
assert.equal(integrity.validateRecord('matches',{
  localMatchId:'match-date',kickoffAt:'yesterday'
}).some(x=>x.code==='INVALID_TIMESTAMP'),true);
assert.equal(integrity.validateReferences('matches',{
  localMatchId:'match-ref',homeTeamId:'missing-team'
},{teams:new Set(['team-home'])})[0].code,'BROKEN_REFERENCE');
assert.equal(integrity.validateRecord('analysis_records',{
  analysisId:'analysis-no-snapshot',localMatchId:'m1',createdAt:'2026-11-17T00:00:00.000Z'
})[0].code,'MISSING_INPUT_SNAPSHOT');

const teams = repos.createRepository('teams');
const competitions = repos.createRepository('competitions');
const matches = repos.createRepository('matches');
const history = repos.createRepository('match_revisions');
assert.equal(history.immutable,true);
await teams.add(validTeam);
await teams.add({teamId:'team-away',nameNormalized:'away'});
await competitions.add({competitionId:'league-1',nameNormalized:'league'});
await matches.add({
  localMatchId:'match-1',competitionId:'league-1',season:'2026/27',
  homeTeamId:'team-home',awayTeamId:'team-away',
  kickoffAt:'2026-11-17T18:00:00.000Z',matchStatus:'SCHEDULED',revision:1
});

const first = await revisions.createMatchRevision({
  localMatchId:'match-1',matchRevisionId:'revision-2',expectedRevision:1,
  changeType:'KICKOFF_UPDATE',changedAt:'2026-11-17T10:00:00.000Z',
  afterSnapshot:{
    localMatchId:'match-1',competitionId:'league-1',season:'2026/27',
    homeTeamId:'team-home',awayTeamId:'team-away',
    kickoffAt:'2026-11-18T18:00:00.000Z',matchStatus:'SCHEDULED'
  }
});
assert.equal(first.match.revision,2);
assert.equal(first.revision.revision,2);
assert.equal(first.revision.beforeSnapshot.kickoffAt,'2026-11-17T18:00:00.000Z');
assert.equal((await matches.get('match-1')).kickoffAt,'2026-11-18T18:00:00.000Z');
assert.equal((await history.get('revision-2')).revision,2);

await assert.rejects(
  revisions.createMatchRevision({
    localMatchId:'match-1',matchRevisionId:'revision-conflict',expectedRevision:1,
    changeType:'STALE_UPDATE',changedAt:'2026-11-17T11:00:00.000Z',
    afterSnapshot:{localMatchId:'match-1',competitionId:'league-1',season:'2026/27',homeTeamId:'team-home',awayTeamId:'team-away',kickoffAt:'2026-11-19T18:00:00.000Z',matchStatus:'SCHEDULED'}
  }),
  error=>error.code==='DB_REVISION_CONFLICT'
);
assert.equal((await matches.get('match-1')).revision,2);
assert.equal(await history.count(),1);

assert.throws(()=>history.delete('revision-2'),error=>error.code==='DB_VALIDATION_FAILED');
assert.throws(()=>history.put({matchRevisionId:'revision-2',localMatchId:'match-1',revision:3}),error=>error.code==='DB_VALIDATION_FAILED');

await assert.rejects(
  revisions.createMatchRevision({
    localMatchId:'missing-match',matchRevisionId:'revision-missing',expectedRevision:0,
    changeType:'UPDATE',changedAt:'2026-11-17T12:00:00.000Z',
    afterSnapshot:{localMatchId:'missing-match'}
  }),
  error=>error.code==='DB_REVISION_CONFLICT'
);
assert.equal(await history.count(),1);

database.closeDatabase();
fs.rmSync(temp,{recursive:true,force:true});
console.log('B.3 IndexedDB runtime tests passed: integrity validation, broken references, atomic revision append, stale revision conflict, and immutable revision history.');
