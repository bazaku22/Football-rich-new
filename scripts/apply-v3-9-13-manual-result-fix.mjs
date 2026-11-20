import fs from 'node:fs';
const root=process.argv[2]||'football-rich-v1/dist';
const mp=root+'/main.js',hp=root+'/index.html',sp=root+'/sw.js',vp=root+'/app-version.json';
let main=fs.readFileSync(mp,'utf8'),html=fs.readFileSync(hp,'utf8'),sw=fs.readFileSync(sp,'utf8');
const version=JSON.parse(fs.readFileSync(vp,'utf8'));
if(version.version!=='3.9.12'||!main.includes("const APP_VERSION='3.9.12';"))throw Error('Expected V3.9.12 output');
if(!html.includes('main.js?v=20261120-v3-9-12')||!sw.includes("const CACHE_NAME = 'football-rich-shell-v67'"))throw Error('Expected V3.9.12 PWA build anchors');

const changeStart=`        resultFile.addEventListener('change', async () => {
          preview.innerHTML = '';
          const file = resultFile.files?.[0];
          if (!file) return;
          if (file.size > 2 * 1024 * 1024) { safeResultMessage( 'ไฟล์ใหญ่เกิน 2 MB', 'error'); return; }
          try {
            const payload = JSON.parse(await file.text());
`;
const changeReplacement=`        const processResultPayload = async payload => {
          preview.innerHTML = '';
          try {
`;
if(!main.includes(changeStart))throw Error('Result Import file-change handler start not found');
main=main.replace(changeStart,changeReplacement);
const changeEnd=`          } catch (error) {
            safeResultMessage( error instanceof Error ? error.message : 'อ่านหรือเชื่อมโยงไฟล์ผลไม่สำเร็จ', 'error');
          }
        });
}
else if (currentView === 'football-time-import') {
`;
const changeEndReplacement=`          } catch (error) {
            safeResultMessage( error instanceof Error ? error.message : 'อ่านหรือเชื่อมโยงไฟล์ผลไม่สำเร็จ', 'error');
          }
        };
        // Shared payload entry point: manual Match Center forms and JSON files use
        // the exact same validation, preview, duplicate guard and IndexedDB transaction.
        window.__frPrepareResultPayload = processResultPayload;
        resultFile.addEventListener('change', async () => {
          preview.innerHTML = '';
          const file = resultFile.files?.[0];
          if (!file) return;
          if (file.size > 2 * 1024 * 1024) { safeResultMessage('ไฟล์ใหญ่เกิน 2 MB', 'error'); return; }
          try {
            await processResultPayload(JSON.parse(await file.text()));
          } catch (error) {
            safeResultMessage(error instanceof Error ? error.message : 'อ่านไฟล์ผลไม่สำเร็จ', 'error');
          }
        });
}
else if (currentView === 'football-time-import') {
`;
if(!main.includes(changeEnd))throw Error('Result Import file-change handler end not found');
main=main.replace(changeEnd,changeEndReplacement);

const oldTransfer=`  const transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify(payload)],'football-rich-manual-result.json',{type:'application/json'}));
  submit.disabled=true;submit.textContent='กำลังเปิดตรวจสอบผล…';
  try{currentView='result-import';await render();const input=document.querySelector('#result-import-file');if(!input)throw Error('ไม่พบหน้า Result Import กรุณาเปิดเมนูนำเข้าผลการแข่งขัน');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));input.scrollIntoView({behavior:'smooth',block:'center'});}
  catch(error){submit.disabled=false;submit.textContent='ตรวจสอบผลก่อนบันทึก';const note=form.querySelector('.v39-manual-note');if(note)note.textContent='เปิดหน้าตรวจสอบไม่สำเร็จ: '+(error?.message||'กรุณาลองใหม่');}
`;
const newTransfer=`  submit.disabled=true;submit.textContent='กำลังตรวจสอบผล…';
  try{
   currentView='result-import';await render();
   if(typeof window.__frPrepareResultPayload!=='function')throw Error('ไม่พบตัวตรวจสอบผล กรุณาลองเปิดหน้า Result Import อีกครั้ง');
   await window.__frPrepareResultPayload(payload);
   const confirmButton=root.querySelector('#confirm-result-import');
   const message=root.querySelector('#result-import-message');
   if(!confirmButton&&message?.classList.contains('error'))message.scrollIntoView({behavior:'smooth',block:'center'});
   else if(confirmButton)confirmButton.scrollIntoView({behavior:'smooth',block:'center'});
  }catch(error){
   const message=root.querySelector('#result-import-message');
   if(message){message.textContent=error?.message||'ตรวจสอบผลไม่สำเร็จ';message.className='notice error';}
   submit.disabled=false;submit.textContent='ตรวจสอบผลก่อนบันทึก';
  }
`;
if(!main.includes(oldTransfer))throw Error('Manual form DataTransfer bridge not found');
main=main.replace(oldTransfer,newTransfer);

const oldCopy=`  if(copy){const id=copy.dataset.v39CopyId;try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(id);else{const field=document.createElement('textarea');field.value=id;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();const ok=document.execCommand('copy');field.remove();if(!ok)throw Error('clipboard unavailable');}const old=copy.textContent;copy.textContent='คัดลอกแล้ว';copy.disabled=true;window.setTimeout(()=>{copy.textContent=old;copy.disabled=false;},1400);}catch(error){copy.textContent='คัดลอกไม่สำเร็จ';window.setTimeout(()=>{copy.textContent='คัดลอก Match ID';},1800);}return;}
`;
const newCopy=`  if(copy){
   const id=copy.dataset.v39CopyId;
   const fallbackCopy=()=>{
    const field=document.createElement('textarea');
    field.value=id;field.setAttribute('readonly','');
    field.style.position='fixed';field.style.left='0';field.style.top='0';field.style.opacity='0';
    document.body.appendChild(field);field.focus();field.select();field.setSelectionRange(0,field.value.length);
    let ok=false;try{ok=document.execCommand('copy');}finally{field.remove();}
    return ok;
   };
   try{
    let copied=false;
    if(navigator.clipboard?.writeText&&window.isSecureContext){try{await navigator.clipboard.writeText(id);copied=true;}catch(_){copied=false;}}
    if(!copied)copied=fallbackCopy();
    if(!copied)throw Error('clipboard unavailable');
    const old='คัดลอก Match ID';copy.textContent='คัดลอกแล้ว';copy.disabled=true;
    window.setTimeout(()=>{copy.textContent=old;copy.disabled=false;},1400);
   }catch(error){copy.textContent='คัดลอกไม่สำเร็จ';window.setTimeout(()=>{copy.textContent='คัดลอก Match ID';},1800);}
   return;
  }
`;
if(!main.includes(oldCopy))throw Error('Match ID copy handler not found');
main=main.replace(oldCopy,newCopy);
main=main.replace("const APP_VERSION='3.9.12';","const APP_VERSION='3.9.13';");
if(main.includes('new DataTransfer()')||main.includes('input.files=transfer.files'))throw Error('Fragile DataTransfer bridge remains');
if(!main.includes('window.__frPrepareResultPayload = processResultPayload'))throw Error('Shared result payload processor missing');
if(!main.includes('if(!copied)copied=fallbackCopy()'))throw Error('Clipboard fallback missing');
const oldNotification=`const panel=root.querySelector('#fr-notification-panel'),list=root.querySelector('#fr-notification-list'),count=root.querySelector('#fr-notification-count'),label=root.querySelector('#fr-notification-unread-label'),kind=`;
const newNotification=`const panel=root.querySelector('#fr-notification-panel'),list=root.querySelector('#fr-notification-list'),count=bell?.querySelector('#fr-notification-count'),label=root.querySelector('#fr-notification-unread-label'),kind=`;
if(!main.includes(oldNotification))throw Error('Notification bell relocation selector anchor missing');
main=main.replace(oldNotification,newNotification);

html=html.replace('main.js?v=20261120-v3-9-12','main.js?v=20261121-v3-9-13');
sw=sw.replace("const CACHE_NAME = 'football-rich-shell-v67'","const CACHE_NAME = 'football-rich-shell-v68'");
version.version='3.9.13';version.previous_version='3.9.12';version.release='V3.9.13 — Reliable Match ID copy and manual result import';
if(!html.includes('main.js?v=20261121-v3-9-13')||!sw.includes("const CACHE_NAME = 'football-rich-shell-v68'"))throw Error('V3.9.13 cache bust failed');
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear('))throw Error('Destructive database operation detected');
fs.writeFileSync(mp,main);fs.writeFileSync(hp,html);fs.writeFileSync(sp,sw);fs.writeFileSync(vp,JSON.stringify(version,null,2)+'\n');
console.log('V3.9.13: manual result payload now calls the same Result Import processor directly (no synthetic File/DataTransfer); clipboard falls back after API rejection.');
