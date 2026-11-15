import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', htmlPath='dist/index.html', swPath='dist/sw.js';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');

if(!main.includes("const APP_VERSION='1.29';") ||
   !html.includes('main.js?v=20261116-v1-29') ||
   !sw.includes("const CACHE_NAME = 'football-rich-shell-v37'")) {
  throw new Error('V1.30 expected V1.29 build anchors missing');
}

const oldModal="document.body.insertAdjacentHTML('beforeend', '<div id=\"mc-detail-modal\" class=\"mc-detail-overlay\" hidden><section class=\"mc-detail-dialog\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"mc-detail-title\"><button type=\"button\" class=\"mc-detail-close\" data-detail-close aria-label=\"ปิด\">×</button><div id=\"mc-detail-content\"></div></section></div>');";
const newModal="document.body.insertAdjacentHTML('beforeend', '<dialog id=\"mc-detail-modal\" class=\"mc-detail-overlay\" aria-labelledby=\"mc-detail-title\"><section class=\"mc-detail-dialog\"><button type=\"button\" class=\"mc-detail-close\" data-detail-close aria-label=\"ปิด\">×</button><div id=\"mc-detail-content\"></div></section></dialog>');";
if(!main.includes(oldModal)) throw new Error('V1.30 existing match detail shell was not found');
main=main.replace(oldModal,newModal);

const directStart="        document.querySelectorAll('[data-open-match-detail]').forEach(button => {";
const directEnd="        const closeMatchDetail=()=>{";
const ds=main.indexOf(directStart), de=main.indexOf(directEnd,ds);
if(ds<0||de<0) throw new Error('V1.29 direct button binding block was not found');
main=main.slice(0,ds)+main.slice(de);

const oldOpen="          detailModal.hidden=false; document.body.classList.add('mc-detail-open'); detailModal.querySelector('[data-detail-close]').focus();";
const newOpen="          if(!detailModal.open) detailModal.showModal(); document.body.classList.add('mc-detail-open'); detailModal.querySelector('[data-detail-close]').focus();";
if(!main.includes(oldOpen)) throw new Error('V1.30 modal open lifecycle anchor missing');
main=main.replace(oldOpen,newOpen);

const oldClose="        const closeMatchDetail=()=>{detailModal.hidden=true;document.body.classList.remove('mc-detail-open');};";
const newClose="        const closeMatchDetail=()=>{if(detailModal.open)detailModal.close();document.body.classList.remove('mc-detail-open');};";
if(!main.includes(oldClose)) throw new Error('V1.30 modal close lifecycle anchor missing');
main=main.replace(oldClose,newClose);

const oldBackdrop="        detailModal.addEventListener('click',e=>{if(e.target===detailModal)closeMatchDetail();});";
const newBackdrop="        detailModal.addEventListener('click',e=>{if(e.target===detailModal)closeMatchDetail();});\n        detailModal.addEventListener('close',()=>document.body.classList.remove('mc-detail-open'));";
if(!main.includes(oldBackdrop)) throw new Error('V1.30 backdrop close anchor missing');
main=main.replace(oldBackdrop,newBackdrop);

const capture = [
"        /* V1.30: one stable capture handler for every Match Center detail button. */",
"        if(!window.__footballRichDetailCaptureInstalled){",
"          window.__footballRichDetailCaptureInstalled=true;",
"          document.addEventListener('click',event=>{",
"            const target=event.target instanceof Element?event.target:null;",
"            const button=target?.closest('button[data-open-match-detail]');",
"            if(!button)return;",
"            const matchId=button.getAttribute('data-open-match-detail')||'';",
"            const open=window.__footballRichOpenMatchDetail;",
"            if(!matchId||typeof open!=='function')return;",
"            event.preventDefault();",
"            event.stopImmediatePropagation();",
"            try{",
"              open(matchId);",
"              if(!detailModal.open)throw new Error('Native match detail dialog did not open');",
"            }catch(error){",
"              console.error('Football rich V1.30 match detail error:',error);",
"              detailContent.textContent='ไม่สามารถเปิดรายละเอียดแมตช์นี้ได้ กรุณาลองแตะอีกครั้ง';",
"              if(!detailModal.open)detailModal.showModal();",
"              document.body.classList.add('mc-detail-open');",
"            }",
"          },true);",
"        }"
].join('\n')+'\n';
if(main.includes('V1.30: one stable capture handler')) throw new Error('V1.30 capture handler already exists unexpectedly');
main=main.replace(directEnd,capture+directEnd);

const cssPatch = [
"/* V1.30: native dialog lifecycle for rebuilt Match Center details */",
"dialog.mc-detail-overlay{position:fixed;inset:0;box-sizing:border-box;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:12px;border:0;background:rgba(0,0,0,.78);color:inherit;overflow:auto;align-items:center;justify-content:center;}",
"dialog.mc-detail-overlay:not([open]){display:none!important}",
"dialog.mc-detail-overlay[open]{display:flex!important}",
"dialog.mc-detail-overlay::backdrop{background:rgba(0,0,0,.78);backdrop-filter:blur(5px)}",
"dialog.mc-detail-overlay .mc-detail-dialog{position:relative;width:min(100%,620px);max-height:92dvh;overflow:auto;margin:auto;}",
"@media(max-width:420px){dialog.mc-detail-overlay{padding:6px}dialog.mc-detail-overlay .mc-detail-dialog{max-height:95dvh}}",
"body.mc-detail-open{overflow:hidden}"
].join('\n');
if(!css.includes('V1.30: native dialog lifecycle for rebuilt Match Center details')) css+='\n'+cssPatch+'\n';

main=main.replace("const APP_VERSION='1.29';","const APP_VERSION='1.30';")
         .replace("const PREVIOUS_APP_VERSION='1.28';","const PREVIOUS_APP_VERSION='1.29';");
html=html.replace('main.js?v=20261116-v1-29','main.js?v=20261116-v1-30');
sw=sw.replaceAll('football-rich-shell-v37','football-rich-shell-v38');

fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync(swPath,sw);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.30',release:'V1.30'}));

for(const feature of ['<dialog id="mc-detail-modal"','detailModal.showModal()','detailModal.close()','V1.30: one stable capture handler','data-open-match-detail','window.__footballRichOpenMatchDetail = matchId =>']) {
  if(!main.includes(feature)) throw new Error('V1.30 detail feature missing: '+feature);
}
if(main.includes("querySelectorAll('[data-open-match-detail]')") || main.includes('detailModal.hidden=false') || main.includes('detailModal.hidden=true')) {
  throw new Error('V1.29 per-render button/hidden-modal lifecycle remains');
}
for(const feature of ['V1.30: native dialog lifecycle for rebuilt Match Center details','dialog.mc-detail-overlay[open]','dialog.mc-detail-overlay::backdrop']) {
  if(!css.includes(feature)) throw new Error('V1.30 dialog CSS missing: '+feature);
}
if(!html.includes('main.js?v=20261116-v1-30') || !sw.includes('football-rich-shell-v38')) throw new Error('V1.30 cache/version audit failed');
console.log('V1.30 native dialog and stable delegated click audit passed; no storage, schema, ID, import or calculation code modified.');
