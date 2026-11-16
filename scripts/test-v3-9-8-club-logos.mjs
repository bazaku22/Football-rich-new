import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='football-rich-v1/dist';
const main=fs.readFileSync(root+'/main.js','utf8');
const html=fs.readFileSync(root+'/index.html','utf8');
const sw=fs.readFileSync(root+'/sw.js','utf8');
const version=JSON.parse(fs.readFileSync(root+'/app-version.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('assets/club-logos/manifest.json','utf8'));
assert.equal(version.version,'3.9.9');
assert.equal(manifest.season,'2026/27');
assert.equal(manifest.teams.length,111);
for(const league of ['Premier League','La Liga','Bundesliga','Serie A','Ligue 1'])assert.ok(manifest.teams.some(t=>t.league===league),'Missing league '+league);
assert.ok(main.includes("const APP_VERSION='3.9.9';"));
assert.ok(html.includes('main.js?v=20261116-v3-9-9'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v64'"));
const start=main.indexOf('const logos=')+'const logos='.length,end=main.indexOf(';',start);
assert.ok(start>=0&&end>start,'Club logo map missing');
const logos=JSON.parse(main.slice(start,end));
// Audit the legacy/shared team crest renderer as well as the V2.1 Match Center.
const sharedStart=main.indexOf('const knownClubCrests = ');
assert.ok(sharedStart>=0,'Shared knownClubCrests map missing');
const sharedBrace=main.indexOf('{',sharedStart);
let sharedDepth=0,sharedEnd=-1;
for(let i=sharedBrace;i<main.length;i++){
  if(main[i]==='{')sharedDepth++;
  else if(main[i]==='}'&&--sharedDepth===0){sharedEnd=i+1;break;}
}
assert.ok(sharedEnd>sharedBrace,'Shared crest map is incomplete');
const sharedCrests=JSON.parse(main.slice(sharedBrace,sharedEnd));
assert.ok(main.includes('mappedClubCrest = knownClubCrests[name] || knownClubCrests[clean]'),'Shared crest renderer is not wired to the unified map');
for(const team of manifest.teams){
  for(const name of [team.team,team.matched_as,...(team.aliases||[])]){
    const key=name.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]/g,'');
    assert.equal(sharedCrests[key],team.logo_url,'Shared renderer map failed for '+name);
  }
}
const sharedEspnUrls=Object.values(sharedCrests).filter(v=>typeof v==='string'&&v.startsWith('https://a.espncdn.com/i/teamlogos/soccer/500/'));
assert.equal(new Set(sharedEspnUrls).size,111,'Shared renderer must contain all 111 unique five-league crests');
for(const key of ['machida','vissel','kashiwa','kawasaki'])assert.ok(sharedCrests[key]||sharedCrests[key+'frontale']||Object.keys(sharedCrests).some(k=>k.startsWith(key)),'Existing J.League crest compatibility missing: '+key);
const resolverStart=main.indexOf('const resolveClubLogo = name => {');
const resolverEnd=main.indexOf('\n};',resolverStart)+3;
assert.ok(resolverStart>=0&&resolverEnd>resolverStart,'Global club-logo resolver missing');
const resolverSource=main.slice(resolverStart,resolverEnd);
const resolveClubLogo=new Function('logos',resolverSource+'; return resolveClubLogo;')(logos);
for(const team of manifest.teams){
  for(const name of [team.team,team.matched_as,...(team.aliases||[])]){
    assert.equal(resolveClubLogo(name),team.logo_url,'Resolver failed for '+name);
    for(const suffix of [' FC',' CF',' AFC',' SC']) assert.equal(resolveClubLogo(name+suffix),team.logo_url,'Resolver failed for '+name+suffix);
    for(const prefix of ['FC ','AFC ','CF ']) assert.equal(resolveClubLogo(prefix+name),team.logo_url,'Resolver failed for '+prefix+name);
  }
}
for(const name of ['Manchester Utd','Man United','Newcastle Utd','Wolves']) assert.ok(resolveClubLogo(name),'Resolver failed for common club name '+name);
const espnUrls=Object.values(logos).filter(v=>typeof v==='string'&&v.startsWith('https://a.espncdn.com/i/teamlogos/soccer/500/'));
assert.equal(new Set(espnUrls).size,111,'Expected 111 unique static logo URLs across all aliases');
for(const key of ['arsenal','realmadrid','barcelona','bayernmunchen','parissaintgermain','acmilan','leedsunited','leedsunitedfc','lu','manchesterunited','mu','machidazelvia','visselkobe','kashiwareysol','kawasakifrontale'])assert.ok(logos[key],'Missing normalized crest key '+key);
for(const name of ['Arsenal','Real Madrid','Barcelona','Bayern München','Paris Saint Germain','AC Milan'])assert.ok(manifest.teams.some(t=>t.team===name),'Missing club '+name);
assert.ok(main.includes('onerror=')&&main.includes('v23-crest'),'Initials fallback must remain available');
assert.ok(!main.includes('site.api.espn.com')&&!main.includes('site.web.api.espn.com'));
assert.ok(!main.includes('indexedDB.deleteDatabase(')&&!main.includes('objectStore.clear('));
console.log('V3.9.9 tests passed: 111 static club logos wired into both shared and V2.1 renderers, all five leagues, J.League compatibility, fallback rendering, cache versioning and data preservation.');
