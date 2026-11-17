import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('..','phase-4.0-b4','src','data','v2');
const target = path.resolve('src','data','v2');
fs.mkdirSync(target,{recursive:true});
for (const file of ['backup.ts','restore.ts','recovery.ts']) {
  fs.copyFileSync(path.join(source,file),path.join(target,file));
}
const configPath = path.resolve('tsconfig.static.json');
const config = JSON.parse(fs.readFileSync(configPath,'utf8'));
for (const file of ['src/data/v2/backup.ts','src/data/v2/restore.ts','src/data/v2/recovery.ts']) {
  if (!config.include.includes(file)) config.include.push(file);
}
fs.writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');
console.log('B.4 Backup, staged restore, and recovery checkpoint modules injected into isolated V2 build workspace; V1 archive untouched.');
