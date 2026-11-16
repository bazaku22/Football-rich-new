import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='football-rich-v1/dist';
const main=fs.readFileSync(root+'/main.js','utf8');
const html=fs.readFileSync(root+'/index.html','utf8');
const sw=fs.readFileSync(root+'/sw.js','utf8');
const version=JSON.parse(fs.readFileSync(root+'/app-version.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('assets/club-logos/manifest.json','utf8'));
assert.equal(version.version,'3.10.0');
assert.equal(manifest.season,'2026/27');
assert.equal(manifest.teams.length,114);
for(const league of ['Premier League','La Liga','Bundesliga','Serie A','Ligue 1'])assert.ok(manifest.teams.some(t=>t.league===league),'Missing league '+league);
assert.ok(main.includes("const APP_VERSION='3.10.0';"));
assert.ok(html.includes('main.js?v=20261116-v3-10-0'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v65'"));
const start=main.indexOf('const logos=')+'const logos='.length,end=main.indexOf(';',start);
assert.ok(start>=0&&end>start,'Club logo map missing');
const logos=JSON.parse(main.slice(start,end));
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
for(const name of ['Manchester Utd','Man United','Newcastle Utd','Wolves','Bayer 04 Leverkusen','SV 07 Elversberg','RC Celta de Vigo','ES Troyes AC','FSV Mainz 05']) assert.ok(resolveClubLogo(name),'Resolver failed for common club name '+name);
const espnUrls=Object.values(logos).filter(v=>typeof v==='string'&&v.startsWith('https://a.espncdn.com/i/teamlogos/soccer/500/'));
assert.equal(new Set(espnUrls).size,114,'Expected 114 unique static logo URLs across all soccer aliases');
for(const key of ['arsenal','realmadrid','barcelona','bayernmunchen','parissaintgermain','acmilan','leedsunited','leedsunitedfc','lu','manchesterunited','mu','machidazelvia','visselkobe','kashiwareysol','kawasakifrontale'])assert.ok(logos[key],'Missing normalized crest key '+key);
for(const name of ['Arsenal','Real Madrid','Barcelona','Bayern München','Paris Saint Germain','AC Milan'])assert.ok(manifest.teams.some(t=>t.team===name),'Missing club '+name);
assert.ok(main.includes('onerror=')&&main.includes('v23-crest'),'Initials fallback must remain available');
assert.ok(!main.includes('site.api.espn.com')&&!main.includes('site.web.api.espn.com'));
for(const name of ['ES Troyes AC','Bayer 04 Leverkusen','SV 07 Elversberg','RC Celta de Vigo','FSV Mainz 05','Leeds United FC','Manchester United']){
  assert.ok(resolveClubLogo(name),'Resolver failed for user-reported club name '+name);
}
assert.ok(main.includes('logo=resolveClubLogo(n)'),'The active Match Center renderer must use the shared resolver');
assert.ok(!main.includes('knownClubCrests'),'Do not depend on the removed legacy renderer');
assert.ok(!main.includes('indexedDB.deleteDatabase(')&&!main.includes('objectStore.clear('));
console.log('V3.10.0 tests passed: 114 static soccer club logos, user-reported aliases, active Match Center resolver, J.League compatibility, fallback rendering, cache versioning and data preservation.');
