import fs from 'node:fs';

const mainPath='dist/main.js', htmlPath='dist/index.html', swPath='dist/sw.js', versionPath='dist/app-version.json';
let main=fs.readFileSync(mainPath,'utf8'), html=fs.readFileSync(htmlPath,'utf8'), sw=fs.readFileSync(swPath,'utf8');
if(!main.includes("const APP_VERSION='1.31';") || !html.includes('main.js?v=20261116-v1-31') || !sw.includes("const CACHE_NAME = 'football-rich-shell-v39'")) throw new Error('V1.32 expected V1.31 build anchors missing');

// Audit the two real templates emitted by Match Center, not synthetic test buttons.
const realButtonTemplate='data-open-match-detail="\' + esc(m.id) + \'">';
const realTemplateCount=main.split(realButtonTemplate).length-1;
if(realTemplateCount!==2) throw new Error('V1.32 expected actual upcoming + finished renderer templates; found '+realTemplateCount);
main=main.replaceAll(' onclick="window.__footballRichOpenMatchDetail(this.dataset.openMatchDetail)"','');

// Move every operation that can fail, including showModal(), inside the handler try/catch.
const oldPrelude=`          const requestId=++detailRequestId;
          if(!detailModal.open) detailModal.showModal();
          document.body.classList.add('mc-detail-open');
          detailContent.textContent='กำลังโหลดรายละเอียดแมตช์…';
          try {
            const d=await records();`;
const newPrelude=`          const requestId=++detailRequestId;
          try {
            if(!detailModal || !detailContent) throw new Error('ไม่พบหน้าต่างรายละเอียดแมตช์');
            if(!detailModal.open) detailModal.showModal();
            document.body.classList.add('mc-detail-open');
            detailContent.textContent='กำลังโหลดรายละเอียดแมตช์…';
            const d=await records();`;
if(!main.includes(oldPrelude)) throw new Error('V1.32 async detail error boundary anchor missing');
main=main.replace(oldPrelude,newPrelude);

// Replace the fragile capture listener with a delegated listener that does not depend on instanceof Element,
// reports synchronous and asynchronous errors, and is bound to the real renderer's data attribute.
const captureStart='        /* V1.30: one stable capture handler for every Match Center detail button. */';
const closeStart='        const closeMatchDetail=()=>{';
const cs=main.indexOf(captureStart), ce=main.indexOf(closeStart,cs);
if(cs<0 || ce<0 || ce<=cs) throw new Error('V1.32 Match Center click listener boundaries missing');
const capture=`        /* V1.32: robust delegated tap handler for the actual Match Center card buttons. */
        if(!window.__footballRichDetailCaptureInstalled){
          window.__footballRichDetailCaptureInstalled=true;
          document.addEventListener('click',event=>{
            let target=event.target;
            if(target && target.nodeType===3) target=target.parentElement;
            const button=target && typeof target.closest==='function' ? target.closest('button[data-open-match-detail]') : null;
            if(!button)return;
            const matchId=button.getAttribute('data-open-match-detail')||'';
            if(!matchId)return;
            event.preventDefault();
            try{
              const open=window.__footballRichOpenMatchDetail;
              if(typeof open!=='function') throw new Error('ไม่พบตัวเปิดรายละเอียดแมตช์');
              const pending=open(matchId);
              if(pending && typeof pending.catch==='function') pending.catch(error=>{
                console.error('Football rich V1.32 async detail error:',error);
                const content=document.querySelector('#mc-detail-content');
                if(content) content.textContent='เปิดรายละเอียดไม่สำเร็จ: '+(error instanceof Error?error.message:'เกิดข้อผิดพลาด');
                const modal=document.querySelector('#mc-detail-modal');
                if(modal && !modal.open) { try{modal.showModal();}catch(showError){console.error(showError);} }
              });
            }catch(error){
              console.error('Football rich V1.32 match detail error:',error);
              const content=document.querySelector('#mc-detail-content');
              if(content) content.textContent='เปิดรายละเอียดไม่สำเร็จ: '+(error instanceof Error?error.message:'เกิดข้อผิดพลาด');
              const modal=document.querySelector('#mc-detail-modal');
              if(modal && !modal.open) { try{modal.showModal();}catch(showError){console.error(showError);} }
            }
          },true);
        }
`;
main=main.slice(0,cs)+capture+main.slice(ce);
main=main.replace("const APP_VERSION='1.31';","const APP_VERSION='1.32';").replace("const PREVIOUS_APP_VERSION='1.30';","const PREVIOUS_APP_VERSION='1.31';");
html=html.replace('main.js?v=20261116-v1-31','main.js?v=20261116-v1-32');
sw=sw.replaceAll('football-rich-shell-v39','football-rich-shell-v40');
fs.writeFileSync(mainPath,main); fs.writeFileSync(htmlPath,html); fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify({version:'1.32',release:'V1.32'}));
for(const f of ['V1.32: robust delegated tap handler','window.__footballRichOpenMatchDetail = async matchId =>','const d=await records();','data-open-match-detail']) if(!main.includes(f)) throw new Error('V1.32 feature missing: '+f);
if(main.includes('onclick="window.__footballRichOpenMatchDetail(')) throw new Error('V1.32 duplicate inline and delegated click actions remain');
if(!html.includes('main.js?v=20261116-v1-32')||!sw.includes('football-rich-shell-v40')) throw new Error('V1.32 cache/version audit failed');
console.log('V1.32 applied: real renderer templates verified (upcoming + finished); safe async error boundary; robust delegated mobile tap; no storage/schema/ID/import/calculation changes.');
