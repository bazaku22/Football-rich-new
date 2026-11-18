import fs from 'node:fs';
import assert from 'node:assert/strict';

const root='football-rich-v1/dist';
const main=fs.readFileSync(root+'/main.js','utf8');
const html=fs.readFileSync(root+'/index.html','utf8');
const sw=fs.readFileSync(root+'/sw.js','utf8');
const version=JSON.parse(fs.readFileSync(root+'/app-version.json','utf8'));

assert.equal(version.version,'3.9.10');
assert.ok(main.includes("const APP_VERSION='3.9.10';"));
assert.ok(html.includes('main.js?v=20261118-v3-9-10'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v65'"));

// The map is emitted as a JavaScript object literal. Extract its balanced
// object body instead of stopping at the first semicolon (which may occur
// inside a URL/string elsewhere in the generated bundle).
const marker='const logos=';
const markerAt=main.indexOf(marker);
assert.ok(markerAt>=0,'Global club-logo map declaration missing');
const objectStart=main.indexOf('{',markerAt+marker.length);
assert.ok(objectStart>=0,'Global club-logo map object missing');
let depth=0, quote=null, escaped=false, objectEnd=-1;
for(let i=objectStart;i<main.length;i++){
  const ch=main[i];
  if(quote){
    if(escaped){escaped=false;continue;}
    if(ch==='\\'){escaped=true;continue;}
    if(ch===quote)quote=null;
    continue;
  }
  if(ch==='"'||ch==="'"||ch==='`') { quote=ch; continue; }
  if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){objectEnd=i+1;break;}
}
assert.ok(objectEnd>objectStart,'Could not locate end of club-logo map');
const logos=JSON.parse(main.slice(objectStart,objectEnd));

const resolverStart=main.indexOf('const resolveClubLogo = name => {');
assert.ok(resolverStart>=0,'Club logo resolver missing');
const resolverEnd=main.indexOf('\n};',resolverStart)+3;
assert.ok(resolverEnd>resolverStart,'Could not locate end of club logo resolver');
const resolve=new Function('logos',main.slice(resolverStart,resolverEnd)+';return resolveClubLogo;')(logos);

const cases=[
  ['Cerezo Osaka Yanmar Ladies','Cerezo Osaka','https://weleague.jp/img/psm/cerezo.png'],
  ['Mitsubishi Heavy Industries Urawa Reds Ladies','Urawa Reds Ladies','https://weleague.jp/img/psm/02_reds.png'],
  ['Sanfrecce Hiroshima Regina','Hiroshima Regina','https://weleague.jp/img/psm/11_sanfrecce.png'],
  ['Nojima Stella Kanagawa Sagamihara','Nojima Stella','https://weleague.jp/img/psm/07_stella.png']
];
for(const [full,short,url] of cases){
  assert.equal(resolve(full),url,full+' full-name mapping');
  assert.equal(resolve(short),url,short+' alias mapping');
  assert.ok(url.startsWith('https://weleague.jp/img/psm/'));
}
assert.ok(main.includes('logo=resolveClubLogo(n)'));
assert.ok(main.includes('v23-crest'));
assert.ok(!main.includes('indexedDB.deleteDatabase(')&&!main.includes('objectStore.clear('));
for(const key of ['arsenal','realmadrid','barcelona','machidazelvia','visselkobe','kashiwareysol','kawasakifrontale']){
  assert.ok(logos[key],'Existing logo mapping lost: '+key);
}
console.log('V3.9.10 tests passed: 4 WE League teams and aliases resolve; previous logos/fallback retained; stored data untouched.');
