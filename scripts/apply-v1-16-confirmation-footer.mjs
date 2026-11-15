import fs from 'node:fs';
const mainPath='dist/main.js', htmlPath='dist/index.html', swPath='dist/sw.js';
let main=fs.readFileSync(mainPath,'utf8'), html=fs.readFileSync(htmlPath,'utf8'), sw=fs.readFileSync(swPath,'utf8');

const historySource = " + ' · ' + esc(old.source || 'ไม่ระบุแหล่ง')";
if (main.includes(historySource)) main=main.replace(historySource,'');
const cardMeta = /'<div class="mc-muted">ยืนยันผล: ' \+ esc\(fmtDate\(r\.verifiedAt \|\| r\.importedAt \|\| r\.createdAt\)\) \+ ' · แหล่งข้อมูล: ' \+ esc\(r\.source \|\| 'รายการเดิม'\) \+ '<\/div><div class="mc-review">/;
if (cardMeta.test(main)) main=main.replace(cardMeta,'\'<div class="mc-review">');
else if (main.includes('แหล่งข้อมูล:') || main.includes('ยืนยันผล:')) throw new Error('V1.16 result metadata removal anchor changed');

const footerText = "+ revisionHtml + '<div class=\"mc-confirmed-at\">ยืนยันผลแล้ว · ' + esc(fmtDate(r.verifiedAt || r.importedAt || r.createdAt)) + '</div></article>';";
const plainEnd = "+ revisionHtml + '</article>';";
if (!main.includes(footerText)) {
  if (!main.includes(plainEnd)) throw new Error('V1.16 finished-card footer anchor missing');
  main=main.replace(plainEnd,footerText);
}
const duplicateBeforeHistory = /'<div class="mc-confirmed-at">ยืนยันผลแล้ว · ' \+ esc\(fmtDate\(r\.verifiedAt \|\| r\.importedAt \|\| r\.createdAt\)\) \+ '<\/div>' \+ revisionHtml/;
if (duplicateBeforeHistory.test(main)) main=main.replace(duplicateBeforeHistory,'revisionHtml');

if (!main.includes("const APP_VERSION='1.15';")) throw new Error('V1.16 expected app version 1.15');
main=main.replace("const APP_VERSION='1.15';","const APP_VERSION='1.16';")
         .replace("const PREVIOUS_APP_VERSION='1.14';","const PREVIOUS_APP_VERSION='1.15';");
if (!html.includes('main.js?v=20261115-v1-15')) throw new Error('V1.16 HTML cache anchor missing');
html=html.replace('main.js?v=20261115-v1-15','main.js?v=20261115-v1-16');
if (!sw.includes('football-rich-shell-v23')) throw new Error('V1.16 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v23','football-rich-shell-v24');

if (main.includes('แหล่งข้อมูล:') || main.includes('ยืนยันผล:')) throw new Error('V1.16 source or old confirmation text still visible in match renderer');
if (!main.includes('mc-confirmed-at')) throw new Error('V1.16 confirmation footer missing');
if (!html.includes('main.js?v=20261115-v1-16') || !sw.includes('football-rich-shell-v24')) throw new Error('V1.16 cache metadata missing');
fs.writeFileSync(mainPath,main); fs.writeFileSync(htmlPath,html); fs.writeFileSync(swPath,sw);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.16',release:'V1.16'}));
console.log('V1.16 verified: source references hidden from match cards and confirmation timestamp retained only at card bottom.');
