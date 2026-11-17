import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('..','phase-4.0-b3','src','data','v2');
const target = path.resolve('src','data','v2');
fs.mkdirSync(target,{recursive:true});
for (const file of ['integrity-validator.ts','revision.ts']) {
  fs.copyFileSync(path.join(source,file),path.join(target,file));
}

// Revision records are append-only. Extend the B.2 repository guard without touching V1.
const repositoryPath = path.join(target,'repositories.ts');
let repositories = fs.readFileSync(repositoryPath,'utf8');
const marker = "  'operation_logs'\n";
if (!repositories.includes("  'match_revisions'")) {
  if (!repositories.includes(marker)) throw new Error('Could not locate immutable repository list for B.3 patch.');
  repositories = repositories.replace(marker, "  'operation_logs',\n  'match_revisions'\n");
  fs.writeFileSync(repositoryPath,repositories);
}

const configPath = path.resolve('tsconfig.static.json');
const config = JSON.parse(fs.readFileSync(configPath,'utf8'));
for (const file of ['src/data/v2/integrity-validator.ts','src/data/v2/revision.ts']) {
  if (!config.include.includes(file)) config.include.push(file);
}
fs.writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');
console.log('B.3 Integrity Validator and atomic Match Revision modules injected into isolated V2 build workspace; V1 archive untouched.');
