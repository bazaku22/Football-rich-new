import fs from 'node:fs';
const mainPath='dist/main.js', htmlPath='dist/index.html', swPath='dist/sw.js';
let main=fs.readFileSync(mainPath,'utf8'), html=fs.readFileSync(htmlPath,'utf8'), sw=fs.readFileSync(swPath,'utf8');

const historySourcePattern = /\s*\+\s*' · '\s*\+\s*esc\(old\.source\s*\|\|\s*'ไม่ระบุแหล่ง'\)/;
main=main.replace(historySourcePattern,'');

// Remove the complete top metadata fragment, if it is still present.
const finishedStart=main.indexOf("const renderFinished =");
const metaLabel=main.indexOf('ยืนยันผล:',finishedStart);
const reviewLabel=main.indexOf('<div class="mc-review">',finishedStart);
if (finishedStart<0 || reviewLabel<0) throw new Error('V1.16 finished-match review section not found');
if (metaLabel>=finishedStart && metaLabel<reviewLabel) {
  const metaStart=main.lastIndexOf("'<",metaLabel);
  if (metaStart<finishedStart) throw new Error('V1.16 result metadata start not found');
  main=main.slice(0,metaStart) + "'<div class=\"mc-review\">" + main.slice(reviewLabel + '<div class="mc-review">'.length);
}
const footerText = "+ revisionHtml + '<div class=\"mc-confirmed-at\">ยืนยันผลแล้ว · ' + esc(fmtDate(r.verifiedAt || r.importedAt || r.createdAt)) + '</div></article>';";
const plainEnd = "+ revisionHtml + '</article>';";
if (!main.includes(footerText) && main.includes(plainEnd)) main=main.replace(plainEnd,footerText);
// The current Match Center renderer is compact-card based; V1.25 carries result IDs and revision history in its detail panel.
const duplicateBeforeHistory = /'<div class="mc-confirmed-at">ยืนยันผลแล้ว · ' \+ esc\(fmtDate\(r\.verifiedAt \|\| r\.importedAt \|\| r\.createdAt\)\) \+ '<\/div>' \+ revisionHtml/;
if (duplicateBeforeHistory.test(main)) main=main.replace(duplicateBeforeHistory,'revisionHtml');

if (!main.includes("const APP_VERSION='1.15';")) throw new Error('V1.16 expected app version 1.15');
main=main.replace("const APP_VERSION='1.15';","const APP_VERSION='1.16';")
         .replace("const PREVIOUS_APP_VERSION='1.14';","const PREVIOUS_APP_VERSION='1.15';");
if (!html.includes('main.js?v=20261115-v1-15')) throw new Error('V1.16 HTML cache anchor missing');
html=html.replace('main.js?v=20261115-v1-15','main.js?v=20261115-v1-16');
if (!sw.includes('football-rich-shell-v23')) throw new Error('V1.16 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v23','football-rich-shell-v24');

const finishedBlock=main.slice(main.indexOf('const renderFinished ='),main.indexOf("root.innerHTML = pageTitle",main.indexOf('const renderFinished =')));
if (finishedBlock.includes('แหล่งข้อมูล:') || finishedBlock.includes('ยืนยันผล:')) throw new Error('V1.16 source or old confirmation text still visible in finished-match renderer');
if (!main.includes('mc-confirmed-at') && !fs.readFileSync('dist/styles/main.css','utf8').includes('mc-confirmed-at')) throw new Error('V1.16 confirmation footer style missing');
if (!html.includes('main.js?v=20261115-v1-16') || !sw.includes('football-rich-shell-v24')) throw new Error('V1.16 cache metadata missing');
fs.writeFileSync(mainPath,main); fs.writeFileSync(htmlPath,html); fs.writeFileSync(swPath,sw);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.16',release:'V1.16'}));
console.log('V1.16 verified: source references hidden from match cards and confirmation timestamp retained only at card bottom.');
