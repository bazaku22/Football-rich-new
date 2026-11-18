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
const marker='const logos=', markerAt=main.indexOf(marker);
assert.ok(markerAt>=0,'Global club-logo map declaration missing');
const objectStart=main.indexOf('{',markerAt+marker.length);
assert.ok(objectStart>=0,'Global club-logo map object missing');
let depth=0, quote=null, escaped=false, objectEnd=-1;
for(let i=objectStart;i<main.length;i++){
 const ch=main[i];
 if(quote){if(escaped){escaped=false;continue;}if(ch==='\\'){escaped=true;continue;}if(ch===quote)quote=null;continue;}
 if(ch==='"'||ch==="'"||ch.charCodeAt(0)===96){quote=ch;continue;}
 if(ch==='{')depth++;else if(ch==='}'&&--depth===0){objectEnd=i+1;break;}
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
['Nojima Stella Kanagawa Sagamihara','Nojima Stella','https://weleague.jp/img/psm/07_stella.png'],
['Buriram United','Buriram','https://www.buriramunited.com/uploads/club/medium/20170320/bdfhnprv0159.png'],
['Ho Chi Minh City Police FC','Ho Chi Minh City Police','https://vpf.vn/wp-content/uploads/2018/10/CAHCM.png'],
['Tampines Rovers FC','Tampines Rovers','https://static.wixstatic.com/media/87b851_eb3fc3381a3d4bf388b82ccdeeb01b18~mv2.png/v1/fill/w_73%2Ch_73%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/BGTR%20LOGO.png'],
['Ratchaburi FC','Ratchaburi','https://tzrvpynhuzobugcvwreh.supabase.co/storage/v1/object/public/football-teams/ratchaburi-fc/logo.webp']
];
for(const [index,[full,short,url]] of cases.entries()){
 assert.equal(resolve(full),url,full+' full-name mapping');
 assert.equal(resolve(short),url,short+' alias mapping');
 if(index<4)assert.ok(url.startsWith('https://weleague.jp/img/psm/'));
}
const newLogoUrls=[...new Set(cases.slice(4).map(item=>item[2]))], urlFailures=[];
await Promise.all(newLogoUrls.map(async url=>{
 try{
  const response=await fetch(url,{headers:{'Accept':'image/*,*/*;q=0.8','User-Agent':'Mozilla/5.0 (compatible; FootballRichLogoAudit/1.0)'},signal:AbortSignal.timeout(15000)});
  const contentType=(response.headers.get('content-type')||'').toLowerCase();
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(!response.ok||!contentType.startsWith('image/')||bytes.length<128)urlFailures.push({url,status:response.status,contentType,bytes:bytes.length});
 }catch(error){urlFailures.push({url,error:String(error?.message||error)});}
}));
assert.equal(urlFailures.length,0,'One or more Shopee Cup crest URLs failed health checks: '+JSON.stringify(urlFailures));
assert.ok(main.includes('logo=resolveClubLogo(n)'));
assert.ok(main.includes('v23-crest'));
assert.ok(!main.includes('indexedDB.deleteDatabase(')&&!main.includes('objectStore.clear('));
for(const key of ['arsenal','realmadrid','barcelona','machidazelvia','visselkobe','kashiwareysol','kawasakifrontale'])assert.ok(logos[key],'Existing logo mapping lost: '+key);
console.log('V3.9.10 tests passed: WE League and Shopee Cup teams/aliases resolve; previous logos/fallback retained; stored data untouched.');
