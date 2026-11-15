import fs from 'node:fs';
const mainPath='dist/main.js', htmlPath='dist/index.html', swPath='dist/sw.js';
let main=fs.readFileSync(mainPath,'utf8'), html=fs.readFileSync(htmlPath,'utf8'), sw=fs.readFileSync(swPath,'utf8');
if(!main.includes("const APP_VERSION='1.27';") || !html.includes('main.js?v=20261116-v1-27') || !sw.includes('football-rich-shell-v35')) {
  throw new Error('V1.28 expected V1.27 anchors missing');
}
const rootAnchor="const app=document.querySelector('#app');";
if(!main.includes(rootAnchor)) throw new Error('V1.28 app root anchor missing');
const capture=`
/* V1.28: capture Match Center taps before inline handlers and stale view listeners. */
if (!window.__footballRichMatchDetailCaptureInstalled) {
  window.__footballRichMatchDetailCaptureInstalled = true;
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('[data-open-match-detail]');
    if (!button) return;
    const matchId = button.getAttribute('data-open-match-detail') || '';
    if (!matchId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const open = window.__footballRichOpenMatchDetail;
    if (typeof open !== 'function') {
      console.error('Football rich: match detail handler is not ready.');
      return;
    }
    try {
      open(matchId);
      const modal = document.querySelector('#mc-detail-modal');
      if (modal && modal.hidden) {
        console.error('Football rich: match detail handler returned without opening the modal.', matchId);
      }
    } catch (error) {
      console.error('Football rich: failed to open match detail.', error);
      const modal = document.querySelector('#mc-detail-modal');
      const content = document.querySelector('#mc-detail-content');
      if (modal && content) {
        content.textContent = 'ไม่สามารถเปิดรายละเอียดแมตช์นี้ได้ กรุณาลองอีกครั้ง';
        modal.hidden = false;
        document.body.classList.add('mc-detail-open');
      }
    }
  }, true);
}
`;
main=main.replace(rootAnchor,rootAnchor+'\n'+capture);
main=main.replace("const APP_VERSION='1.27';","const APP_VERSION='1.28';").replace("const PREVIOUS_APP_VERSION='1.26';","const PREVIOUS_APP_VERSION='1.27';");
html=html.replace('main.js?v=20261116-v1-27','main.js?v=20261116-v1-28');
sw=sw.replaceAll('football-rich-shell-v35','football-rich-shell-v36');
fs.writeFileSync(mainPath,main); fs.writeFileSync(htmlPath,html); fs.writeFileSync(swPath,sw);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.28',release:'V1.28'}));
if(!main.includes('window.__footballRichMatchDetailCaptureInstalled') || !main.includes("document.addEventListener('click', event =>") || !main.includes("button?.closest")) {
  if(!main.includes("target?.closest('[data-open-match-detail]')")) throw new Error('V1.28 capture handler audit failed');
}
if(!main.includes('window.__footballRichOpenMatchDetail') || !main.includes('event.stopImmediatePropagation()')) throw new Error('V1.28 direct capture route missing');
if(!html.includes('main.js?v=20261116-v1-28') || !sw.includes('football-rich-shell-v36')) throw new Error('V1.28 cache/version audit failed');
console.log('V1.28 capture-phase Match Center action wiring passed; IndexedDB, imported data, schema and calculations untouched.');
