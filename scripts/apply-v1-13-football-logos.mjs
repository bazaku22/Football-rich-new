import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

const logos = {
  machida:'https://www.footylogos.com/downloads/logo/machida-zelvia-logo-footylogos.svg',
  vissel:'https://www.footylogos.com/downloads/logo/vissel-kobe-logo-footylogos.svg',
  kashiwa:'https://www.footylogos.com/downloads/logo/kashiwa-reysol-logo-footylogos.svg',
  kawasaki:'https://www.footylogos.com/downloads/logo/kawasaki-frontale-logo-footylogos.svg'
};
const oldUrls = [
  'https://www.jleague.co/static/images/clubs/machida.svg',
  'https://www.jleague.co/static/images/clubs/kobe.svg',
  'https://www.jleague.co/static/images/clubs/reysol.svg',
  'https://www.jleague.co/static/images/clubs/kawasakif.svg'
];
for (const url of oldUrls) if (!main.includes(url)) throw new Error('Expected J.League crest URL missing: '+url);
main=main.replaceAll(oldUrls[0],logos.machida)
         .replaceAll(oldUrls[1],logos.vissel)
         .replaceAll(oldUrls[2],logos.kashiwa)
         .replaceAll(oldUrls[3],logos.kawasaki);

// Add normalized aliases because crestFor performs an exact normalized-key lookup.
const aliasAnchor = "'Kawasaki Frontale':'"+logos.kawasaki+"',";
if (!main.includes(aliasAnchor)) throw new Error('J.League club crest map anchor missing');
const aliases = aliasAnchor + `
  fcmachidazelvia:'${logos.machida}',
  machidazelvia:'${logos.machida}',
  visselkobe:'${logos.vissel}',
  kashiwareysol:'${logos.kashiwa}',
  kawasakifrontale:'${logos.kawasaki}',`;
main=main.replace(aliasAnchor,aliases);

// Subtle attribution for the downloaded crest assets.
const toolbarCredit = 'รายการทั้งหมดเรียงตามวันและเวลาแข่งขัน · การ์ดจะเปลี่ยนเป็นสถานะจบแล้วเมื่อมีการนำเข้าผลที่ยืนยัน';
if (main.includes(toolbarCredit) && !main.includes('โลโก้สโมสรจาก FootyLogos')) {
  main=main.replace(toolbarCredit,toolbarCredit+' · โลโก้สโมสรจาก FootyLogos');
}

if (!main.includes(`const APP_VERSION='1.12';`)) throw new Error('V1.13 expected app version 1.12');
main=main.replace(`const APP_VERSION='1.12';`,`const APP_VERSION='1.13';`)
         .replace(`const PREVIOUS_APP_VERSION='1.11';`,`const PREVIOUS_APP_VERSION='1.12';`);
html=html.replace('main.js?v=20261115-v1-12','main.js?v=20261115-v1-13');
sw=sw.replaceAll('football-rich-shell-v20','football-rich-shell-v21');

css += css.includes('V1.13 logo attribution') ? '' : `
/* V1.13 logo attribution */
.mc-logo-credit{font-size:9px;color:#81745c}
`;

fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.13',release:'V1.13'}));

for (const url of Object.values(logos)) if (!main.includes(url)) throw new Error('V1.13 official crest URL missing: '+url);
for (const key of ['fcmachidazelvia','machidazelvia','visselkobe','kashiwareysol','kawasakifrontale']) if (!main.includes(key)) throw new Error('V1.13 normalized crest alias missing: '+key);
if (!html.includes('main.js?v=20261115-v1-13')) throw new Error('V1.13 cache-busted entry missing');
if (!sw.includes('football-rich-shell-v21')) throw new Error('V1.13 service worker cache missing');
console.log('V1.13: switched four J.League club crests to verified FootyLogos SVG download URLs and added normalized aliases.');
