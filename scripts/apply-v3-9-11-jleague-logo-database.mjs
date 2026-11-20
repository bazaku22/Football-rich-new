import fs from 'node:fs';

const root='football-rich-v1/dist';
const mainPath=root+'/main.js',htmlPath=root+'/index.html',swPath=root+'/sw.js',versionPath=root+'/app-version.json';
const dataPath='assets/club-logos/jleague-2026-27.json';
let main=fs.readFileSync(mainPath,'utf8'),html=fs.readFileSync(htmlPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
const data=JSON.parse(fs.readFileSync(dataPath,'utf8'));
if(data.season!=='2026/27'||data.coverage?.J1!==20||data.coverage?.J2!==20||data.teams?.length!==40)throw Error('J.League J1/J2 logo database must contain exactly 20 teams per league');
const normalize=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const counts={J1:0,J2:0};
for(const team of data.teams){
  if(!['J1','J2'].includes(team.league))throw Error('Out-of-scope league in J.League logo database: '+team.league);
  counts[team.league]++;
  const url=new URL(team.logo_url);
  if(url.protocol!=='https:'||url.hostname!=='www.footylogos.com'||!url.pathname.startsWith('/dls/logo/rgba-v1/')||!url.pathname.endsWith('.png'))throw Error('Unexpected J.League crest URL for '+team.team);
}
if(counts.J1!==20||counts.J2!==20)throw Error('J.League club counts do not match the approved scope');

const mapMatch=main.match(/const\s+logos\s*=\s*/);
if(!mapMatch)throw Error('Existing global club-logo map declaration missing');
const mapStart=mapMatch.index,mapValueStart=mapStart+mapMatch[0].length;
let mapEnd=mapValueStart,depth=0,inString=false,stringQuote='',escaped=false,started=false;
for(;mapEnd<main.length;mapEnd++){
  const ch=main[mapEnd];
  if(inString){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch===stringQuote)inString=false;continue;}
  if(ch==='"'||ch==="'"||ch==='\x60'){inString=true;stringQuote=ch;continue;}
  if(ch==='{'){depth++;started=true;}
  else if(ch==='}'){depth--;if(started&&depth===0){mapEnd++;break;}}
}
if(!started||depth!==0)throw Error('Existing global club-logo map boundary missing');
const logos=JSON.parse(main.slice(mapValueStart,mapEnd));
for(const team of data.teams){
  for(const alias of [team.team,...(team.aliases||[])]){
    const key=normalize(alias);
    if(key.length<3)continue;
    const existing=logos[key];
    if(existing&&existing!==team.logo_url){
      const owner=data.teams.find(other=>[other.team,...(other.aliases||[])].some(v=>normalize(v)===key));
      if(!owner||owner.team_id!==team.team_id)throw Error('Conflicting J.League alias: '+alias);
    }
    logos[key]=team.logo_url;
  }
}
main=main.slice(0,mapStart)+'const logos='+JSON.stringify(logos)+main.slice(mapEnd+1);
if(!main.includes('const resolveClubLogo = name => {')||!main.includes('logo=resolveClubLogo(n)'))throw Error('Global logo resolver is not connected to the Match Center renderer');
if(!main.includes("const APP_VERSION='3.9.10';"))throw Error('Expected V3.9.10 app build missing');
main=main.replace("const APP_VERSION='3.9.10';","const APP_VERSION='3.9.11';");
html=html.replace('main.js?v=20261118-v3-9-10','main.js?v=20261120-v3-9-11');
if(!html.includes('main.js?v=20261120-v3-9-11'))throw Error('V3.9.11 cache-busted entry missing');
sw=sw.replace("const CACHE_NAME = 'football-rich-shell-v65'","const CACHE_NAME = 'football-rich-shell-v66'");
if(!sw.includes("const CACHE_NAME = 'football-rich-shell-v66'"))throw Error('Service worker cache was not upgraded');
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear('))throw Error('Destructive local-data operation detected');
fs.writeFileSync(mainPath,main);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify({version:'3.9.11',release:'V3.9.11 — J.League J1/J2 club-logo database'})+'\n');
console.log('V3.9.11: '+data.teams.length+' J1/J2 club logo mappings connected; existing non-J.League mappings preserved; local app data untouched.');
