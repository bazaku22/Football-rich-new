import fs from 'node:fs';

const root='football-rich-v1/dist';
const main=fs.readFileSync(root+'/main.js','utf8');
const html=fs.readFileSync(root+'/index.html','utf8');
const sw=fs.readFileSync(root+'/sw.js','utf8');
const version=JSON.parse(fs.readFileSync(root+'/app-version.json','utf8'));
const data=JSON.parse(fs.readFileSync('assets/club-logos/jleague-2026-27.json','utf8'));
const normalize=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const mapMatch=main.match(/const\s+logos\s*=\s*/);
if(!mapMatch)throw Error('Global logo map declaration not found');
const start=mapMatch.index+mapMatch[0].length;
let end=start,depth=0,inString=false,stringQuote='',escaped=false,started=false;
for(;end<main.length;end++){
  const ch=main[end];
  if(inString){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch===stringQuote)inString=false;continue;}
  if(ch==='"'||ch==="'"||ch==='\x60'){inString=true;stringQuote=ch;continue;}
  if(ch==='{'){depth++;started=true;}
  else if(ch==='}'){depth--;if(started&&depth===0){end++;break;}}
}
if(!started||depth!==0)throw Error('Global logo map boundary not found');
if(main[end]!==';')throw Error('Global logo map must retain its terminating semicolon before the next declaration');
const logos=JSON.parse(main.slice(start,end));
if(data.teams.length!==40)throw Error('Expected 40 J.League teams');
for(const league of ['J1','J2']){
  const list=data.teams.filter(t=>t.league===league);
  if(list.length!==20)throw Error(league+' must contain exactly 20 clubs');
}
for(const team of data.teams){
  for(const alias of [team.team,...(team.aliases||[])]){
    const key=normalize(alias);
    if(key.length>=3&&logos[key]!==team.logo_url)throw Error('Missing or incorrect logo mapping: '+team.team+' / '+alias);
  }
  if(team.league==='J3')throw Error('J3 must not be included');
}
for(const marker of ["const APP_VERSION='3.9.11';",'logo=resolveClubLogo(n)','kashiwareysol','visselkobe']){
  if(!main.includes(marker))throw Error('Required renderer or existing logo mapping missing: '+marker);
}
if(version.version!=='3.9.11')throw Error('App version manifest is stale');
if(!html.includes('main.js?v=20261120-v3-9-11'))throw Error('HTML cache-busted app entry missing');
if(!sw.includes("const CACHE_NAME = 'football-rich-shell-v66'"))throw Error('Service worker cache is stale');
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear('))throw Error('Destructive storage code detected');
const queue=[...data.teams];
const failed=[];
const workers=Array.from({length:6},async()=>{
  while(queue.length){
    const team=queue.shift();
    try{
      const response=await fetch(team.logo_url,{method:'GET',headers:{Range:'bytes=0-0'},signal:AbortSignal.timeout(15000)});
      const type=(response.headers.get('content-type')||'').toLowerCase();
      if(!response.ok||!type.includes('image/png'))failed.push({team:team.team,status:response.status,type});
      if(response.body)await response.body.cancel();
    }catch(error){failed.push({team:team.team,error:String(error)});}
  }
});
await Promise.all(workers);
if(failed.length)throw Error('J.League crest URL health check failed: '+JSON.stringify(failed));
console.log('PASS: 40 J1/J2 clubs, aliases, renderer integration, cache version, non-destructive storage and all 40 remote PNG URLs.');

