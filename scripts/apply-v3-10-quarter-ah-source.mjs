import fs from 'node:fs';

const domainPath='src/domain/handicap.ts';
let domain=fs.readFileSync(domainPath,'utf8');
const fullLines=`export const SUPPORTED_HANDICAPS = [
  -4, -3.75, -3.5, -3.25, -3, -2.75, -2.5, -2.25,
  -2, -1.75, -1.5, -1.25, -1, -0.75, -0.5, -0.25,
  0,
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75,
  2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4
] as const;`;
if(!domain.includes(fullLines)){
  domain=domain.replace(/export const SUPPORTED_HANDICAPS = \\[[\\s\\S]*?\\] as const;/,fullLines);
  if(!domain.includes(fullLines))throw Error('V3.10 could not set the complete two-sided AH line range');
}
const oldSplit=`  const lowerMagnitude = Math.floor(Math.abs(handicap) * 2) / 2;
  const first = -lowerMagnitude;
  const second = -(lowerMagnitude + 0.5);
  return [first, second];`;
const newSplit=`  const sign = Math.sign(handicap);
  const lowerMagnitude = Math.floor(Math.abs(handicap) * 2) / 2;
  const first = sign * lowerMagnitude;
  const second = sign * (lowerMagnitude + 0.5);
  return [first, second];`;
if(domain.includes(oldSplit))domain=domain.replace(oldSplit,newSplit);
else if(!domain.includes(newSplit))throw Error('V3.10 signed quarter-line split anchor missing');
fs.writeFileSync(domainPath,domain);

const dbPath='src/data/database.ts';
let db=fs.readFileSync(dbPath,'utf8');
const oldSet='const supportedLines = new Set([-0.25, -0.5, -0.75, -1, -1.25, -1.5, -1.75, -2]);';
const newSet='const supportedLines = new Set(Array.from({ length: 33 }, (_, i) => Number((-4 + i * 0.25).toFixed(2))));';
if(db.includes(oldSet))db=db.replace(oldSet,newSet);
else if(!db.includes(newSet))throw Error('V3.10 backup validator AH range anchor missing');
fs.writeFileSync(dbPath,db);

const dt='src/domain/handicap.test.ts';
let test=fs.readFileSync(dt,'utf8');
const oldCases=`    [-1, [-1, -1]], [-1.25, [-1, -1.5]], [-1.5, [-1.5, -1.5]],
    [-1.75, [-1.5, -2]], [-2, [-2, -2]]`;
const newCases=`    [-1, [-1, -1]], [-1.25, [-1, -1.5]], [-1.5, [-1.5, -1.5]],
    [-1.75, [-1.5, -2]], [-2, [-2, -2]],
    [0.25, [0, 0.5]], [0.75, [0.5, 1]], [1.25, [1, 1.5]],
    [1.75, [1.5, 2]], [2.25, [2, 2.5]], [4, [4, 4]]`;
if(test.includes(oldCases))test=test.replace(oldCases,newCases);
else if(!test.includes('[1.75, [1.5, 2]]'))throw Error('V3.10 positive quarter split tests missing');
const oldSettles=`    [-1.75, 2, 'HALF_WIN'], [-1.75, 1, 'FULL_LOSS'],
    [-2, 2, 'PUSH'], [-2, 3, 'FULL_WIN']`;
const newSettles=`    [-1.75, 2, 'HALF_WIN'], [-1.75, 1, 'FULL_LOSS'],
    [-2, 2, 'PUSH'], [-2, 3, 'FULL_WIN'],
    [0.25, 0, 'HALF_WIN'], [0.75, 0, 'FULL_WIN'],
    [1.75, -1, 'FULL_WIN'], [1.75, -2, 'HALF_LOSS']`;
if(test.includes(oldSettles))test=test.replace(oldSettles,newSettles);
else if(!test.includes("[1.75, -2, 'HALF_LOSS']"))throw Error('V3.10 positive AH settlement tests missing');
fs.writeFileSync(dt,test);

const dbt='src/data/database.test.ts';
let dbtest=fs.readFileSync(dbt,'utf8');
const marker=`  it('rejects a performance record linked to a missing prediction', () => {`;
const added=`  it('accepts positive quarter AH lines in prediction backups', () => {
    const backup = emptyBackup();
    (backup.stores.matches as unknown[]).push({ id: 'match-1' });
    (backup.stores.predictions as unknown[]).push({
      id: 'prediction-1', matchId: 'match-1', selectedLine: 1.75,
      selectedOdds: 1.9, status: 'CONFIRMED', snapshot: {}
    });
    expect(() => validateBackup(backup)).not.toThrow();
  });

`;
if(!dbtest.includes("accepts positive quarter AH lines")){
  if(!dbtest.includes(marker))throw Error('V3.10 backup regression insertion point missing');
  dbtest=dbtest.replace(marker,added+marker);
}
fs.writeFileSync(dbt,dbtest);
console.log('V3.10 source patch applied: two-sided quarter AH calculator, backup validator and regression tests.');
