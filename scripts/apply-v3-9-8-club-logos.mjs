import fs from 'node:fs';

const root='football-rich-v1/dist';
const mainPath=root+'/main.js',cssPath=root+'/styles/main.css',htmlPath=root+'/index.html',swPath=root+'/sw.js',versionPath=root+'/app-version.json';
const manifestPath='assets/club-logos/manifest.json';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.season!=='2026/27'||!Array.isArray(manifest.teams)||manifest.teams.length!==114)throw Error('Club-logo manifest is incomplete');
if(!main.includes("const APP_VERSION='3.9.7';")||!html.includes('main.js?v=20261116-v3-9-7')||!sw.includes("const CACHE_NAME = 'football-rich-shell-v62'"))throw Error('Expected V3.9.7 build anchors missing; refusing to patch unknown build');

const normalize=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const logos={
  machidazelvia:'https://www.footylogos.com/downloads/logo/machida-zelvia-logo-footylogos.svg',
  visselkobe:'https://www.footylogos.com/downloads/logo/vissel-kobe-logo-footylogos.svg',
  kashiwareysol:'https://www.footylogos.com/downloads/logo/kashiwa-reysol-logo-footylogos.svg',
  kawasakifrontale:'https://www.footylogos.com/downloads/logo/kawasaki-frontale-logo-footylogos.svg'
};
for(const team of manifest.teams){
  let u;
  try{u=new URL(team.logo_url);}catch{throw Error('Invalid logo URL for '+team.team);}
  if(u.protocol!=='https:'||u.hostname!=='a.espncdn.com'||!/^\/i\/teamlogos\/soccer\/500\/\d+\.png$/.test(u.pathname))throw Error('Unexpected non-static logo URL for '+team.team);
  for(const alias of [team.team,team.matched_as,...(team.aliases||[])]){
    const key=normalize(alias);if(!key)continue;
    if(logos[key]&&logos[key]!==team.logo_url)throw Error('Conflicting crest alias '+alias);
    logos[key]=team.logo_url;
  }
}
const mapStart=main.indexOf('const logos={');
const mapEnd=main.indexOf('};',mapStart)+2;
if(mapStart<0||mapEnd<=mapStart)throw Error('Existing Match Center logo map not found');
main=main.slice(0,mapStart)+'const logos='+JSON.stringify(logos)+';'+main.slice(mapEnd);
if(!main.includes('const mark=name=>{'))throw Error('Match Center team mark renderer missing');
const resolverSource = String.raw`const resolveClubLogo = name => {
  const normalizeClubKey = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const key = normalizeClubKey(name);
  if (!key) return '';
  if (logos[key]) return logos[key];
  const prefixes = ['footballclub','associationfootballclub','fc','afc','cf','ac','as','us','ssc','sc','rcd','rc','club'];
  const suffixes = ['associationfootballclub','footballclub','fc','afc','cf','ac','as','us','ssc','sc','calcio','club'];
  const variants = new Set([key]);
  let frontier = [key];
  for (let depth = 0; depth < 4; depth++) {
    const next = [];
    for (const candidate of frontier) {
      for (const prefix of prefixes) {
        if (candidate.startsWith(prefix) && candidate.length > prefix.length + 1) {
          const v = candidate.slice(prefix.length);
          if (!variants.has(v)) { variants.add(v); next.push(v); }
        }
      }
      for (const suffix of suffixes) {
        if (candidate.endsWith(suffix) && candidate.length > suffix.length + 1) {
          const v = candidate.slice(0, -suffix.length);
          if (!variants.has(v)) { variants.add(v); next.push(v); }
        }
      }
      if (candidate.endsWith('utd')) {
        const v = candidate.slice(0, -3) + 'united';
        if (!variants.has(v)) { variants.add(v); next.push(v); }
      }
      if (candidate.endsWith('united')) {
        const v = candidate.slice(0, -6) + 'utd';
        if (!variants.has(v)) { variants.add(v); next.push(v); }
      }
      if (candidate.startsWith('man') && !candidate.startsWith('manchester')) {
        const v = 'manchester' + candidate.slice(3);
        if (!variants.has(v)) { variants.add(v); next.push(v); }
      }
      if (candidate.startsWith('manchester')) {
        const v = 'man' + candidate.slice(10);
        if (!variants.has(v)) { variants.add(v); next.push(v); }
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  const synonyms = {
    manunited:'manchesterunited',
    manutd:'manchesterunited',
    manchesterutd:'manchesterunited',
    newcastleutd:'newcastleunited',
    psg:'parissaintgermain'
  };
  for (const candidate of variants) {
    const mapped = logos[candidate] || logos[synonyms[candidate] || ''];
    if (mapped) return mapped;
  }
  return '';
};`;
main=main.replace("const mark=name=>{",resolverSource+"\nconst mark=name=>{");
main=main.replace('logo=logos[k]','logo=resolveClubLogo(n)');
if(!main.includes('logo=resolveClubLogo(n)'))throw Error('Global club-logo resolver was not connected to the renderer');
main=main.replace("const APP_VERSION='3.9.7';","const APP_VERSION='3.10.0';");
if(!main.includes("const APP_VERSION='3.10.0';"))throw Error('App version bump failed');
html=html.replace('main.js?v=20261116-v3-9-7','main.js?v=20261116-v3-10-0');
sw=sw.replace("const CACHE_NAME = 'football-rich-shell-v62'","const CACHE_NAME = 'football-rich-shell-v65'");
if(!html.includes('main.js?v=20261116-v3-10-0')||!sw.includes("const CACHE_NAME = 'football-rich-shell-v65'"))throw Error('Cache-busting update failed');
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear('))throw Error('Destructive storage operation detected');
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify({version:'3.10.0',release:'V3.10.0 — Expanded club crest catalogue and alias matching'})+'\n');
console.log('V3.10.0 applied: global alias resolution for '+manifest.teams.length+' multi-competition club crests mapped; J.League crests preserved; static images only; data untouched.');
