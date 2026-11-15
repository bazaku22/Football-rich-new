import fs from 'node:fs';
const mainPath='dist/main.js', htmlPath='dist/index.html', swPath='dist/sw.js';
let main=fs.readFileSync(mainPath,'utf8'), html=fs.readFileSync(htmlPath,'utf8'), sw=fs.readFileSync(swPath,'utf8');
if(!main.includes("const APP_VERSION='1.28';") || !html.includes('main.js?v=20261116-v1-28') || !sw.includes('football-rich-shell-v36')) {
  throw new Error('V1.29 expected V1.28 anchors missing');
}

// Remove the V1.28 document capture listener. It could consume taps before
// confirming that the detail handler existed, leaving the user with no feedback.
const captureMarker='/* V1.28: capture Match Center taps before inline handlers and stale view listeners. */';
const captureStart=main.indexOf(captureMarker);
if(captureStart<0) throw new Error('V1.28 capture listener marker missing');
const captureEnd=main.indexOf('\n}\n',captureStart);
if(captureEnd<0) throw new Error('V1.28 capture listener boundary missing');
main=main.slice(0,captureStart)+main.slice(captureEnd+3);

// Avoid duplicate modal elements when the user leaves and re-enters Match Center.
const modalStart="document.body.insertAdjacentHTML('beforeend', '<div id=\\\"mc-detail-modal\\\"";
if(!main.includes(modalStart)) throw new Error('V1.25 modal creation anchor missing');
main=main.replace(modalStart,"if(!document.querySelector('#mc-detail-modal')) document.body.insertAdjacentHTML('beforeend', '<div id=\\\"mc-detail-modal\\\"");

// Use direct listeners on the actual rendered buttons, inside the same render
// scope as the detail function and its data. No document-level interception.
main=main.replaceAll(' onclick=\\\"window.__footballRichOpenMatchDetail(this.dataset.openMatchDetail)\\\"','');
const bindAnchor='        const closeMatchDetail=()=>{';
if(!main.includes(bindAnchor)) throw new Error('V1.25 close handler anchor missing');
const directBindings=`        document.querySelectorAll('[data-open-match-detail]').forEach(button => {
          button.addEventListener('click', event => {
            event.preventDefault();
            const matchId = button.getAttribute('data-open-match-detail') || '';
            try {
              if (!matchId || typeof window.__footballRichOpenMatchDetail !== 'function') {
                throw new Error('Match detail action is not ready');
              }
              window.__footballRichOpenMatchDetail(matchId);
              if (detailModal.hidden) throw new Error('Match detail modal did not open');
            } catch (error) {
              console.error('Football rich: direct match detail action failed.', error);
              detailContent.textContent = 'เปิดรายละเอียดไม่สำเร็จ กรุณาออกจาก Match Center แล้วเข้าใหม่อีกครั้ง';
              detailModal.hidden = false;
              document.body.classList.add('mc-detail-open');
            }
          });
        });
`;
main=main.replace(bindAnchor,directBindings+bindAnchor);

main=main.replace("const APP_VERSION='1.28';","const APP_VERSION='1.29';").replace("const PREVIOUS_APP_VERSION='1.27';","const PREVIOUS_APP_VERSION='1.28';");
html=html.replace('main.js?v=20261116-v1-28','main.js?v=20261116-v1-29');
sw=sw.replaceAll('football-rich-shell-v36','football-rich-shell-v37');
fs.writeFileSync(mainPath,main); fs.writeFileSync(htmlPath,html); fs.writeFileSync(swPath,sw);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.29',release:'V1.29'}));
if(main.includes('V1.28: capture Match Center taps')) throw new Error('V1.28 capture listener was not removed');
if(!main.includes("querySelectorAll('[data-open-match-detail]')") || !main.includes("button.addEventListener('click'")) throw new Error('V1.29 direct button listeners missing');
if(main.includes('onclick=\\\"window.__footballRichOpenMatchDetail')) throw new Error('V1.27 inline handlers remain');
if(!main.includes("if(!document.querySelector('#mc-detail-modal'))")) throw new Error('V1.29 modal duplicate guard missing');
if(!html.includes('main.js?v=20261116-v1-29') || !sw.includes('football-rich-shell-v37')) throw new Error('V1.29 cache/version audit failed');
console.log('V1.29 direct per-button match-detail actions verified; capture interception removed; duplicate modal guard added; local data/schema/calculations untouched.');
