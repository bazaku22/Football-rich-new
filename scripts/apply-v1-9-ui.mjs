import fs from 'node:fs';
const mp='dist/main.js',cp='dist/styles/main.css',sp='dist/sw.js',hp='dist/index.html';
let m=fs.readFileSync(mp,'utf8'),c=fs.readFileSync(cp,'utf8'),s=fs.readFileSync(sp,'utf8'),h=fs.readFileSync(hp,'utf8');
const profit='<div class="stat panel"><small>กำไรจำลองสุทธิ</small><strong>'+ '$' + '{fmtNum(profit)}</strong><span>หน่วยเดิมพันจำลอง</span></div>';
if(!m.includes(profit))throw Error('profit card anchor missing');m=m.replace(profit,'');
const settlement='$'+'{card(\\'ผลชำระเดิมพัน\\',settled.length?\\'<div class="metrics">\\'+[\\'FULL_WIN\\',\\'HALF_WIN\\',\\'PUSH\\',\\'HALF_LOSS\\',\\'FULL_LOSS\\'].map(k=>\\'<span>\\'+statusText[k]+\\' <b>\\'+settled.filter(p=>p.settlement===k).length+\\'</b></span>\\').join(\\'\\')+\\'</div>\\':\\'<p class="muted">ยังไม่มีผลที่ตัดสินแล้ว</p>\\')}';
if(!m.includes(settlement))throw Error('settlement card anchor missing');m=m.replace(settlement,'');
m=m.replace("pageTitle('PERFORMANCE INTELLIGENCE','ผลงานและความแม่นยำ','ประเมินจากผลจริงที่บันทึกไว้ · แยกผลชำระแฮนดิแคปและความน่าจะเป็น')","pageTitle('PERFORMANCE INTELLIGENCE','ผลงานและความแม่นยำ','ประเมินความแม่นยำจากผลการแข่งขันจริงและโอกาสผ่านแฮนดิแคป')");
m=m.replace("const profit=settled.reduce((sum,p)=>sum+Number(p.simulatedProfit||0),0);",'');
const a=m.indexOf('// V1.6 local notification center.'),b=m.indexOf('\nrender().catch(showFatal);',a);if(a<0||b<0)throw Error('notification block anchors missing');
const block=`// V1.9 local notification center: unread count and safer history controls.
(function installFootballRichNotifications(){
 if(window.__frNotifyInstalled)return;window.__frNotifyInstalled=true;
 const key='footballRichNotificationsV1',read=()=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.slice(0,50):[]}catch(_){return[]}},write=a=>{try{localStorage.setItem(key,JSON.stringify(a.slice(0,50)))}catch(_){}};
 const root=document.createElement('div');root.id='fr-notification-root';
 root.innerHTML='<button id="fr-notification-bell" type="button" aria-label="เปิดศูนย์แจ้งเตือน" aria-controls="fr-notification-panel" aria-expanded="false"><span aria-hidden="true">🔔</span><b id="fr-notification-count" hidden>0</b></button><section id="fr-notification-panel" hidden aria-label="ศูนย์แจ้งเตือน"><header><div class="fr-notification-heading"><strong>ศูนย์แจ้งเตือน</strong><small id="fr-notification-unread-label">อ่านครบแล้ว</small></div><div><button type="button" id="fr-notification-clear">ล้างประวัติ</button><button type="button" id="fr-notification-close" aria-label="ปิดศูนย์แจ้งเตือน">×</button></div></header><div id="fr-notification-list" aria-live="polite"></div></section><div id="fr-notification-toast" role="status" aria-live="polite"></div>';
 document.body.appendChild(root);const head=document.querySelector('.mobile-head'),settings=head?.querySelector('.settings-shortcut'),bell=root.querySelector('#fr-notification-bell');if(head&&settings&&bell){settings.insertAdjacentElement('beforebegin',bell);bell.classList.add('fr-notification-header-button')}
 const panel=root.querySelector('#fr-notification-panel'),list=root.querySelector('#fr-notification-list'),count=root.querySelector('#fr-notification-count'),label=root.querySelector('#fr-notification-unread-label'),kind=t=>t==='error'?'ข้อผิดพลาด':t==='success'?'สำเร็จ':'แจ้งข้อมูล';
 const draw=()=>{const items=read(),n=items.filter(x=>!x.readAt).length;count.textContent=n>99?'99+':String(n);count.hidden=!n;bell.setAttribute('aria-label',n?'มีการแจ้งเตือนที่ยังไม่อ่าน '+n+' รายการ':'เปิดศูนย์แจ้งเตือน');label.textContent=n?'ยังไม่อ่าน '+n+' รายการ':'อ่านครบแล้ว';list.replaceChildren();if(!items.length){const e=document.createElement('p');e.className='fr-notification-empty';e.textContent='ยังไม่มีการแจ้งเตือน';list.appendChild(e);return}items.forEach(x=>{const row=document.createElement('article');row.className='fr-notification-item is-'+(x.type||'info')+(!x.readAt?' is-unread':'');const head=document.createElement('div');head.className='fr-notification-item-heading';const tag=document.createElement('span');tag.className='fr-notification-type';tag.textContent=kind(x.type);const msg=document.createElement('p');msg.textContent=x.message||'';const time=document.createElement('time'),d=new Date(x.at);time.textContent=Number.isNaN(d.getTime())?'':d.toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'});head.append(tag);row.append(head,msg,time);list.appendChild(row)})};
 const markRead=()=>{const a=read();let changed=false;a.forEach(x=>{if(!x.readAt){x.readAt=new Date().toISOString();changed=true}});if(changed)write(a);draw()};let timer;const toast=(msg,type='info',ms=4200)=>{const el=root.querySelector('#fr-notification-toast');el.textContent=msg;el.className='is-visible is-'+type;clearTimeout(timer);timer=setTimeout(()=>el.className='',ms)};
 window.__frNotify=(message,type='info')=>{const msg=String(message||'').trim();if(!msg)return;const a=read();a.unshift({id:Date.now()+'-'+Math.random().toString(36).slice(2,7),message:msg,type,at:new Date().toISOString(),readAt:null});write(a);draw();toast(msg,type)};
 const open=v=>{panel.hidden=!v;bell.setAttribute('aria-expanded',String(v));if(v)markRead()};
 document.addEventListener('click',e=>{const btn=e.target.closest('button');if(btn?.id==='fr-notification-bell'){open(panel.hidden);return}if(btn?.id==='fr-notification-close'){open(false);return}if(btn?.id==='fr-notification-clear'){if(!read().length){toast('ไม่มีประวัติให้ล้าง','info',2600);return}if(!window.confirm('ยืนยันล้างประวัติการแจ้งเตือนทั้งหมดหรือไม่?'))return;write([]);draw();toast('ล้างประวัติการแจ้งเตือนแล้ว','info',3000);return}if(!panel.hidden&&!root.contains(e.target))open(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)open(false)});window.alert=msg=>window.__frNotify(String(msg),/ไม่สำเร็จ|ผิดพลาด|ไม่ถูกต้อง|ไม่สามารถ|พบรายการซ้ำ/i.test(String(msg))?'error':'info');document.addEventListener('click',e=>{if(e.target.closest('#export-json'))window.__frNotify('กำลังเตรียมไฟล์สำรองข้อมูล JSON','info')},true);draw();
})();`;
m=m.slice(0,a)+block+m.slice(b);m=m.replace("const APP_VERSION='1.8';","const APP_VERSION='1.9';").replace("const PREVIOUS_APP_VERSION='1.7';","const PREVIOUS_APP_VERSION='1.8';");
h=h.replace('main.js?v=20261115-v1-8','main.js?v=20261115-v1-9');s=s.replaceAll('football-rich-shell-v16','football-rich-shell-v17');
c+=`
/* V1.9 notification center polish */
#fr-notification-panel header{gap:10px;align-items:center}
.fr-notification-heading{display:flex;flex-direction:column;gap:3px;min-width:0}
.fr-notification-heading strong{font-size:14px;color:#f4d27b}
.fr-notification-heading small{font-size:10px;color:#a99d83}
.fr-notification-item{padding:10px 9px;border-radius:9px;margin:3px 0}
.fr-notification-item.is-unread{background:#2b2416;border-left:3px solid #b78b32;padding-left:8px}
.fr-notification-item-heading{display:flex;align-items:center;gap:7px;margin-bottom:4px}
.fr-notification-type{display:inline-flex;padding:2px 7px;border-radius:20px;background:#302a1e;color:#d8bd7c;font-size:9px;line-height:1.5}
.fr-notification-item.is-error .fr-notification-type{background:#3b2420;color:#ffd0c7}
.fr-notification-item.is-success .fr-notification-type{background:#203126;color:#bce7c4}
#fr-notification-count{min-width:17px;height:17px;padding:0 4px;border-radius:12px;background:#d6a944;color:#121212;font-size:10px;line-height:17px;text-align:center}
#fr-notification-list{overscroll-behavior:contain}
@media(max-width:420px){#fr-notification-panel{right:8px;width:calc(100vw - 16px);max-height:65vh}#fr-notification-list{max-height:calc(65vh - 58px)}}
`;
fs.writeFileSync(mp,m);fs.writeFileSync(cp,c);fs.writeFileSync(sp,s);fs.writeFileSync(hp,h);fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.9',release:'V1.9'}));
if(m.includes('กำไรจำลองสุทธิ')||m.includes("$"+"{card('ผลชำระเดิมพัน'"))throw Error('betting summary cards remain');
if(!m.includes('fr-notification-unread-label')||!m.includes('readAt:null')||!m.includes('ศูนย์แจ้งเตือน'))throw Error('notification center V1.9 missing');
if(!h.includes('main.js?v=20261115-v1-9')||!s.includes("const CACHE_NAME = 'football-rich-shell-v17'"))throw Error('V1.9 cache metadata missing');
console.log('V1.9 UI patch verified.');
