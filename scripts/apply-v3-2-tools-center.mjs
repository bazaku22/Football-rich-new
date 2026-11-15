import fs from 'node:fs';

const mainPath='dist/main.js',cssPath='dist/styles/main.css',htmlPath='dist/index.html',swPath='dist/sw.js',versionPath='dist/app-version.json';
let main=fs.readFileSync(mainPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),html=fs.readFileSync(htmlPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));
if(!main.includes("const APP_VERSION='3.1';")||!html.includes('main.js?v=20261116-v3-1')||!sw.includes("const CACHE_NAME = 'football-rich-shell-v47'"))throw Error('V3.2 expected V3.1 build anchors missing');
if(!/currentView\s*===\s*['"]import['"]/.test(main)||!main.includes('analysis-import-existing-only'))throw Error('Existing safe Analysis Import route missing');
if(!main.includes("else if (currentView === 'settings')"))throw Error('Settings route missing');

const navStart=main.indexOf('const navItems = ['),navEnd=main.indexOf('];',navStart);
if(navStart<0||navEnd<=navStart)throw Error('Navigation array not found');
const navBlock=main.slice(navStart,navEnd);
const importNav=navBlock.match(/\[\s*['"]import['"]\s*,\s*['"][^'"]*['"]\s*\]/);
if(importNav)main=main.slice(0,navStart)+navBlock.replace(importNav[0],"['tools', 'เครื่องมือ']")+main.slice(navEnd);
else if(!navBlock.includes("['tools', 'เครื่องมือ']")) {
  const dashboardNav=navBlock.match(/\[\s*['"]dashboard['"]\s*,\s*['"][^'"]*['"]\s*\]/);
  if(!dashboardNav)throw Error('Could not find a primary navigation item to place Tools');
  const updatedNav=navBlock.replace(dashboardNav[0],dashboardNav[0]+", ['tools', 'เครื่องมือ']");
  main=main.slice(0,navStart)+updatedNav+main.slice(navEnd);
}

const toolsBranch = [
"else if (currentView === 'tools') {",
"  root.innerHTML=pageTitle('TOOLS','เครื่องมือ','รวมเครื่องมือจัดการโปรแกรม รายงานวิเคราะห์ และผลการแข่งขันไว้ในหมวดเดียว')+'<div class=\"tools-grid\">'+",
"    '<button class=\"panel tools-card\" data-tool-target=\"fixture-import\"><span class=\"tools-icon\">▤</span><b>นำเข้าโปรแกรมแข่งขัน</b><small>เพิ่มโปรแกรมหลายคู่จากไฟล์ JSON และตรวจรายการซ้ำ</small><span class=\"tools-open\">เปิดเครื่องมือ ›</span></button>'+",
"    '<button class=\"panel tools-card\" data-tool-target=\"import\"><span class=\"tools-icon\">◈</span><b>นำเข้ารายงานวิเคราะห์</b><small>นำเข้า Analysis JSON และผูกกับ Match ID เดิม</small><span class=\"tools-open\">เปิดเครื่องมือ ›</span></button>'+",
"    '<button class=\"panel tools-card\" data-tool-target=\"result-import\"><span class=\"tools-icon\">✓</span><b>สรุปผลการแข่งขัน</b><small>นำเข้า Result JSON ตรวจสกอร์ เหตุการณ์ และประวัติการแก้ไข</small><span class=\"tools-open\">เปิดเครื่องมือ ›</span></button></div>';",
"  root.querySelectorAll('[data-tool-target]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.toolTarget)));",
"}",
"else if (currentView === 'fixture-import') {",
"  root.innerHTML=pageTitle('TOOLS · FIXTURES','นำเข้าโปรแกรมแข่งขัน','นำเข้าโปรแกรมจาก JSON · รายการซ้ำจะถูกข้ามและไม่เขียนทับแมตช์เดิม')+card('เลือกไฟล์โปรแกรมแข่งขัน','<p class=\"muted\">รองรับ JSON ที่มี fixtures หรือ matches จำนวน 1–200 คู่ แต่ละคู่ต้องมีรายการแข่งขัน ทีมเหย้า ทีมเยือน และวันเวลาแข่งขัน</p><button class=\"outline\" id=\"download-fixture-template\">ดาวน์โหลดแม่แบบ JSON</button><label class=\"file-label\">เลือกไฟล์โปรแกรม<input id=\"fixture-import-file\" type=\"file\" accept=\"application/json,.json\"></label><p id=\"fixture-import-message\" class=\"notice\" role=\"status\">เลือกไฟล์ JSON เพื่อเริ่มตรวจสอบ</p><div id=\"fixture-import-preview\"></div>');",
"  const fileInput=document.querySelector('#fixture-import-file'),preview=document.querySelector('#fixture-import-preview');",
"  const template={schema_version:'1.0.0',report_type:'football-rich-fixtures',batch_id:'fr-fixtures-example-001',created_at:nowISO(),fixtures:[{competition:'UEFA Nations League',home_team:'Home FC',away_team:'Away FC',kickoff_at:'2026-11-20T20:00:00+07:00'}]};",
"  document.querySelector('#download-fixture-template').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(template,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='football-rich-fixtures-template.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});",
"  fileInput.addEventListener('change',async()=>{preview.innerHTML='';const file=fileInput.files?.[0];if(!file)return;if(file.size>5*1024*1024){setMessage('#fixture-import-message','ไฟล์ใหญ่เกิน 5 MB','error');return;}try{",
"    const payload=JSON.parse(await file.text());if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('ไฟล์ต้องเป็น JSON Object');",
"    if(payload.schema_version!=='1.0.0'||!['football-rich-fixtures','football-rich-fixture-schedule'].includes(payload.report_type))throw Error('รูปแบบไฟล์ไม่ถูกต้อง ต้องเป็น Football rich Fixtures JSON v1.0.0');",
"    const raw=Array.isArray(payload.fixtures)?payload.fixtures:payload.matches;if(!Array.isArray(raw)||raw.length<1||raw.length>200)throw Error('ต้องมีโปรแกรมแข่งขัน 1–200 คู่');",
"    const items=raw.map((x,i)=>{const league=String(x.competition??x.league??'').trim(),home=String(x.home_team??x.homeTeam??'').trim(),away=String(x.away_team??x.awayTeam??'').trim(),kick=x.kickoff_at??x.kickoffAt??x.date_time??x.dateTime,date=new Date(kick);if(!league||!home||!away||home.toLowerCase()===away.toLowerCase()||!kick||Number.isNaN(date.getTime()))throw Error('ข้อมูลคู่แข่งขันลำดับ '+(i+1)+' ไม่ครบหรือวันเวลาไม่ถูกต้อง');return {league,homeTeam:home,awayTeam:away,kickoffAt:date.toISOString(),notes:x.notes?String(x.notes).slice(0,500):undefined};});",
"    const key=x=>[x.league,x.homeTeam,x.awayTeam,x.kickoffAt].map(v=>String(v||'').trim().toLowerCase()).join('|'),seen=new Set();for(const x of items){if(seen.has(key(x)))throw Error('มีคู่แข่งขันซ้ำภายในไฟล์');seen.add(key(x));}",
"    const d=await records(),existing=new Set(d.matches.map(key)),fresh=items.filter(x=>!existing.has(key(x))),duplicates=items.length-fresh.length;",
"    preview.innerHTML='<div class=\"panel import-preview\"><p><b>พบโปรแกรม '+items.length+' คู่</b></p><p>เพิ่มใหม่ '+fresh.length+' คู่ · ข้ามรายการซ้ำ '+duplicates+' คู่</p>'+items.slice(0,30).map(x=>'<div class=\"fixture-preview-row\"><b>'+esc(x.homeTeam)+' vs '+esc(x.awayTeam)+'</b><small>'+esc(x.league)+' · '+esc(fmtDate(x.kickoffAt))+(existing.has(key(x))?' · มีอยู่แล้ว':' · รายการใหม่')+'</small></div>').join('')+'<button class=\"primary\" id=\"confirm-fixture-import\" '+(fresh.length?'':'disabled')+'>นำเข้าโปรแกรมใหม่ '+fresh.length+' คู่</button></div>';",
"    setMessage('#fixture-import-message',fresh.length?'ตรวจสอบผ่าน กรุณาตรวจรายการก่อนยืนยัน':'ทุกคู่มีอยู่แล้ว ไม่มีรายการใหม่ให้เพิ่ม','success');",
"    document.querySelector('#confirm-fixture-import')?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;try{const latest=await records(),keys=new Set(latest.matches.map(key)),add=fresh.filter(x=>!keys.has(key(x)));for(const x of add)await addRecord('matches',{...base(),league:x.league,homeTeam:x.homeTeam,awayTeam:x.awayTeam,kickoffAt:x.kickoffAt,status:'UPCOMING',notes:x.notes});setMessage('#fixture-import-message','นำเข้าโปรแกรมสำเร็จ '+add.length+' คู่ · ข้ามรายการซ้ำ '+(items.length-add.length)+' คู่','success');await render();}catch(err){b.disabled=false;setMessage('#fixture-import-message',err instanceof Error?err.message:'นำเข้าไม่สำเร็จ','error');}});",
"  }catch(err){setMessage('#fixture-import-message',err instanceof Error?err.message:'อ่านไฟล์ไม่สำเร็จ','error');}});",
"}"
].join('\n');

const source=fs.readFileSync('../scripts/match-center-branch.js.txt','utf8');
const start=source.indexOf("const resultFile = document.querySelector('#result-import-file');");
if(start<0)throw Error('Existing Result JSON importer source missing');
let handler=source.slice(start).trim();
handler=handler.replace("if (!ev || typeof ev !== 'object' || ev.type !== 'goal' || !['home','away'].includes(ev.team)) fail('เหตุการณ์ต้องเป็น goal และระบุทีม home/away');","if (!ev || typeof ev !== 'object' || !['goal','yellow_card','red_card'].includes(ev.type) || !['home','away'].includes(ev.team)) fail('เหตุการณ์ต้องเป็น goal, yellow_card หรือ red_card และระบุทีม home/away');");
if(handler.includes("ev.type !== 'goal'"))throw Error('Could not enable card-event validation');
handler=handler.replace(/\n\s*}\s*$/, '');
const resultBranch=[
"else if (currentView === 'result-import') {",
"  const d=await records(),upcomingMatches=d.matches.filter(m=>!d.results.some(r=>r.matchId===m.id));",
"  root.innerHTML=pageTitle('TOOLS · RESULTS','สรุปผลการแข่งขัน','นำเข้า Result JSON · ตรวจสอบ Match ID และเก็บประวัติเมื่อแก้ไขผลเดิม')+'<div class=\"mc-toolbar\"><button class=\"outline\" id=\"download-result-template\">ดาวน์โหลดแม่แบบ Result JSON</button></div>'+card('นำเข้าผลการแข่งขัน','<p class=\"muted\">รองรับ 1–100 คู่ต่อไฟล์ · ต้องระบุ Match ID หรือ Analysis Report ID ที่มีอยู่ในเครื่อง · ตรวจสอบทุกคู่ก่อนบันทึก</p><label class=\"file-label\">เลือกไฟล์ผลการแข่งขัน<input id=\"result-import-file\" type=\"file\" accept=\"application/json,.json\"></label><p id=\"result-import-message\" class=\"notice\" role=\"status\">เลือกไฟล์ JSON เพื่อดูตัวอย่างก่อนยืนยัน</p><div id=\"result-import-preview\"></div>');",
"  document.querySelector('#download-result-template').addEventListener('click',()=>{const t={schema_version:'1.0.0',report_type:'football-rich-result',result_id:'fr-result-'+crypto.randomUUID(),created_at:nowISO(),verified_at:'',source:'กรุณาระบุแหล่งยืนยันผลการแข่งขันจริง',matches:upcomingMatches.map(m=>({match_id:m.id,home_team:m.homeTeam,away_team:m.awayTeam,home_goals:null,away_goals:null,events:[]}))},blob=new Blob([JSON.stringify(t,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='football-rich-result-template.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});",
handler,
"}"
].join('\n');

const settings="else if (currentView === 'settings') {";
if(!main.includes(settings))throw Error('Settings route anchor missing');
main=main.replace(settings,toolsBranch+'\n'+resultBranch+'\n'+settings);

const importerAnchor="const input=document.querySelector('#analysis-import-file'), preview=document.querySelector('#analysis-import-preview');";
if(!main.includes(importerAnchor)) throw new Error('Analysis ZIP importer anchor missing');
main=main.replace(importerAnchor,"const safeImportMessage=(message,kind='notice')=>{const node=root.querySelector('#analysis-import-message');if(node){node.textContent=String(message);node.className='notice '+kind;}else{const fallback=root.querySelector('#analysis-import-preview');if(fallback){const p=document.createElement('p');p.className='notice error';p.textContent=String(message);fallback.replaceChildren(p);}}}; const input=root.querySelector('#analysis-import-file'), preview=root.querySelector('#analysis-import-preview');");
main=main.replaceAll("setMessage('#analysis-import-message',","safeImportMessage(");
if(main.includes("setMessage('#analysis-import-message',"))throw Error('Unsafe Analysis import status updater remains');
if(!main.includes('application/zip')||!main.includes('const zipReports=async file=>'))throw Error('ZIP batch import support missing');

main=main.replace("const APP_VERSION='3.1';","const APP_VERSION='3.2';").replace("const PREVIOUS_APP_VERSION='3.0';","const PREVIOUS_APP_VERSION='3.1';").replaceAll('FOOTBALL RICH · BLACK & GOLD · V3.1','FOOTBALL RICH · BLACK & GOLD · V3.2').replace('<span class="tag">V3.1</span>','<span class="tag">V3.2</span>');
html=html.replaceAll('main.js?v=20261116-v3-1','main.js?v=20261116-v3-2');
sw=sw.replaceAll('football-rich-shell-v47','football-rich-shell-v48');
version.version='3.2';version.previous_version='3.1';version.release='V3.2-beta.1';
css+='\n/* V3.2 Tools category */\n.tools-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:14px 0}.tools-card{display:flex;min-width:0;min-height:166px;flex-direction:column;align-items:flex-start;gap:9px;padding:17px;text-align:left;color:#e9e3d5;cursor:pointer}.tools-card:hover{border-color:#b78b32;transform:translateY(-1px)}.tools-icon{display:grid;width:38px;height:38px;place-items:center;border:1px solid #66512b;border-radius:11px;background:#211d14;color:#f4d27b;font-size:20px}.tools-card b{color:#f4d27b;font-size:14px}.tools-card small{color:#a99d83;font-size:11px;line-height:1.6}.tools-open{margin-top:auto;color:#d8bd79;font-size:11px;font-weight:750}.fixture-preview-row{display:flex;flex-direction:column;gap:3px;padding:9px;margin:7px 0;border:1px solid #40351f;border-radius:9px;background:#17140f}.fixture-preview-row b{color:#e9e3d5;font-size:11px}.fixture-preview-row small{color:#a99d83;font-size:9px}@media(max-width:700px){.tools-grid{grid-template-columns:minmax(0,1fr)}.tools-card{min-height:0;padding:14px}.tools-card small{font-size:10px}}\n';
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);fs.writeFileSync(versionPath,JSON.stringify(version,null,2)+'\n');
for(const marker of ["['tools', 'เครื่องมือ']","currentView === 'tools'","currentView === 'fixture-import'","currentView === 'result-import'","currentView === 'import'","fixture-import-file","result-import-file","validateAnalysisImport","yellow_card","red_card"])if(!main.includes(marker))throw Error('V3.2 marker missing: '+marker);
if(main.includes("['import', 'นำเข้ารายงาน']"))throw Error('Analysis Import should be grouped inside Tools');
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear('))throw Error('Destructive database operation detected');
console.log('V3.2 Tools category applied; fixture, analysis and result import tools are grouped without clearing local records.');
