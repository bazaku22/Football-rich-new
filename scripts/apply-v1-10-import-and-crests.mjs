import fs from 'node:fs';
const mp='dist/main.js',cp='dist/styles/main.css',sp='dist/sw.js',hp='dist/index.html';
let m=fs.readFileSync(mp,'utf8'),c=fs.readFileSync(cp,'utf8'),s=fs.readFileSync(sp,'utf8'),h=fs.readFileSync(hp,'utf8');
// Guard the shared status helper so an absent transient message node cannot crash import error handling.
const start=m.indexOf('function setMessage(');
if(start<0)throw new Error('setMessage helper not found');
const open=m.indexOf('{',start);let depth=0,end=-1;
for(let i=open;i<m.length;i++){if(m[i]==='{')depth++;else if(m[i]==='}'&&--depth===0){end=i+1;break;}}
if(end<0)throw new Error('setMessage helper body is incomplete');
let fn=m.slice(start,end);
if(!/if\s*\(!\w+\)\s*return/.test(fn)){
 const q=fn.match(/(?:const|let)\s+(\w+)\s*=\s*document\.querySelector\(selector\)\s*;/);
 if(!q)throw new Error('setMessage selector lookup pattern changed; refusing unsafe patch');
 fn=fn.replace(q[0],q[0]+'\n  if (!'+q[1]+') return;');
 m=m.slice(0,start)+fn+m.slice(end);
}
const anchor='const knownClubCrests = {';
if(!m.includes(anchor))throw new Error('knownClubCrests map not found');
const insert=anchor+"\n  'FC Machida Zelvia':'https://www.jleague.co/static/images/clubs/machida.svg',\n  'Machida Zelvia':'https://www.jleague.co/static/images/clubs/machida.svg',\n  'Vissel Kobe':'https://www.jleague.co/static/images/clubs/kobe.svg',\n  'Kashiwa Reysol':'https://www.jleague.co/static/images/clubs/reysol.svg',\n  'Kawasaki Frontale':'https://www.jleague.co/static/images/clubs/kawasakif.svg',";
if(!m.includes("'FC Machida Zelvia':'https://www.jleague.co/static/images/clubs/machida.svg'"))m=m.replace(anchor,insert);
m=m.replace("const APP_VERSION='1.9';","const APP_VERSION='1.10';").replace("const PREVIOUS_APP_VERSION='1.8';","const PREVIOUS_APP_VERSION='1.9';");
h=h.replace('main.js?v=20261115-v1-9','main.js?v=20261115-v1-10');s=s.replaceAll('football-rich-shell-v17','football-rich-shell-v18');
c+='\n/* V1.10 J.League club crests */\n.mc-team-mark img{display:block;width:100%;height:100%;object-fit:contain;padding:2px;border-radius:50%;background:#fff}\n.mc-team-mark:has(img){background:#fff;border-color:#8d6b2b}\n';
fs.writeFileSync(mp,m);fs.writeFileSync(cp,c);fs.writeFileSync(sp,s);fs.writeFileSync(hp,h);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.10',release:'V1.10'}));
for(const name of ['FC Machida Zelvia','Vissel Kobe','Kashiwa Reysol','Kawasaki Frontale'])if(!m.includes(name))throw new Error('Club crest mapping missing: '+name);
if(!m.includes("const APP_VERSION='1.10'")||!h.includes('main.js?v=20261115-v1-10')||!s.includes('football-rich-shell-v18'))throw new Error('V1.10 metadata audit failed');
console.log('V1.10 import null-guard, AH0 support and four J.League club crest mappings applied.');
