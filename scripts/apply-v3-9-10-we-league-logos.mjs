import fs from 'node:fs';
const root='football-rich-v1/dist';
const mainPath=root+'/main.js',htmlPath=root+'/index.html',swPath=root+'/sw.js',versionPath=root+'/app-version.json';
let main=fs.readFileSync(mainPath,'utf8'),html=fs.readFileSync(htmlPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
if(!main.includes("const APP_VERSION='3.9.9';")||!html.includes('main.js?v=20261116-v3-9-9')||!sw.includes("const CACHE_NAME = 'football-rich-shell-v64'"))throw Error('Expected V3.9.9 build anchors missing');
const start=main.indexOf('const logos='),end=main.indexOf(';',start);
if(start<0||end<=start)throw Error('Global club-logo map missing');
const logos=JSON.parse(main.slice(start+'const logos='.length,end));
const teams=[
{url:'https://weleague.jp/img/psm/cerezo.png',names:['Cerezo Osaka Yanmar Ladies','Cerezo Osaka Ladies','Cerezo Osaka','Cerezo']},
{url:'https://weleague.jp/img/psm/02_reds.png',names:['Mitsubishi Heavy Industries Urawa Reds Ladies','Urawa Reds Ladies','Urawa Red Diamonds Ladies','Urawa Reds','Urawa']},
{url:'https://weleague.jp/img/psm/11_sanfrecce.png',names:['Sanfrecce Hiroshima Regina','Hiroshima Regina','Sanfrecce Regina','Sanfrecce Hiroshima']},
{url:'https://weleague.jp/img/psm/07_stella.png',names:['Nojima Stella Kanagawa Sagamihara','Nojima Stella','Nojima Stella Kanagawa','Nojima']}

,{url:'https://www.buriramunited.com/uploads/club/medium/20170320/bdfhnprv0159.png',names:['Buriram United','Buriram United FC','Buriram','บุรีรัมย์ ยูไนเต็ด']}
,{url:'https://vpf.vn/wp-content/uploads/2018/10/CAHCM.png',names:['Ho Chi Minh City Police FC','Ho Chi Minh City Police','Cong An Ho Chi Minh City','Công an TP. Hồ Chí Minh','Công An TP.HCM','CA TP.HCM']}
,{url:'https://static.wixstatic.com/media/87b851_eb3fc3381a3d4bf388b82ccdeeb01b18~mv2.png/v1/fill/w_73%2Ch_73%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/BGTR%20LOGO.png',names:['Tampines Rovers FC','Tampines Rovers','Tampines','BG Tampines Rovers']}
,{url:'https://tzrvpynhuzobugcvwreh.supabase.co/storage/v1/object/public/football-teams/ratchaburi-fc/logo.webp',names:['Ratchaburi FC','Ratchaburi Football Club','Ratchaburi','ราชบุรี เอฟซี']}
];
const normalize=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
for(const team of teams)for(const name of team.names){const key=normalize(name);if(!key)throw Error('Empty alias');if(logos[key]&&logos[key]!==team.url)throw Error('Conflicting alias '+name);logos[key]=team.url;}
main=main.slice(0,start)+'const logos='+JSON.stringify(logos)+main.slice(end+1);
if(!main.includes('const resolveClubLogo = name => {')||!main.includes('logo=resolveClubLogo(n)'))throw Error('Logo resolver not connected');
main=main.replace("const APP_VERSION='3.9.9';","const APP_VERSION='3.9.10';");
html=html.replace('main.js?v=20261116-v3-9-9','main.js?v=20261118-v3-9-10');
sw=sw.replace("const CACHE_NAME = 'football-rich-shell-v64'","const CACHE_NAME = 'football-rich-shell-v65'");
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear('))throw Error('Destructive data operation detected');
fs.writeFileSync(mainPath,main);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify({version:'3.9.10',release:'V3.9.10 — WE League club crests'})+'\n');
console.log('V3.9.10: four WE League club crests added; existing club mappings preserved; local data untouched.');