import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

if (!main.includes("currentView === 'football-time-result-import'") ||
    !main.includes('footballTimeResultReadOnly:true') ||
    main.includes("currentView === 'football-time-legacy-result-import'")) {
  throw new Error('Legacy snapshot import requires the verified Football Time result importer and must be applied once.');
}

const toolsStart=main.indexOf("currentView === 'tools'");
const settingsRoute=main.indexOf("else if (currentView === 'settings') {",toolsStart);
if(toolsStart<0||settingsRoute<0)throw new Error('Tools Center / Settings route anchors missing');
let tools=main.slice(toolsStart,settingsRoute);
const resultCardMarker='นำเข้าผลจริงจาก Football Time';
const resultCardAt=tools.indexOf(resultCardMarker);
const resultCardEnd=resultCardAt<0?-1:tools.indexOf("</button>' +",resultCardAt);
if(resultCardEnd<0)throw new Error('Verified result import tool card missing');
const legacyCard="'<button class=\\\"panel tools-card\\\" data-tool-target=\\\"football-time-legacy-result-import\\\"><span class=\\\"tools-icon\\\">◷</span><b>นำเข้า Legacy Snapshot จาก Football Time</b><small>รับผลเก่าที่ไม่มี Revision History แยกจากผลที่ตรวจสอบแล้ว</small><span class=\\\"tools-open\\\">ตรวจสอบ Legacy Snapshot ›</span></button>' +";
const endToken="</button>' +";
const insertAt=resultCardEnd+endToken.length;
tools=tools.slice(0,insertAt)+legacyCard+tools.slice(insertAt);
main=main.slice(0,toolsStart)+tools+main.slice(settingsRoute);

const route = [
"else if (currentView === 'football-time-legacy-result-import') {",
"  root.innerHTML=pageTitle('FOOTBALL TIME · LEGACY SNAPSHOTS','นำเข้า Legacy Snapshot','ผลเก่าที่ไม่มี Revision History · เก็บแยกจากผลจริงที่มีประวัติ · ไม่เขียนทับผลเดิมหรือประวัติการทำนาย')+card('เลือกไฟล์ Legacy Snapshot จาก Football Time','<p class=\"muted\">รองรับ Legacy Result Snapshot v1.0 · 5 ลีก PL, PD, BL1, SA, FL1 · ฤดูกาล 2026/27</p><div class=\"notice\">ข้อมูลชุดนี้ระบุว่าไม่ได้ตรวจสอบอิสระและไม่มี Revision History · จะไม่ถูกรวมกับสถิติ Verified Results หรือ Performance ปกติ</div><label class=\"file-label\">เลือกไฟล์ Legacy Snapshot JSON<input id=\"ft-legacy-result-file\" type=\"file\" accept=\"application/json,.json\"></label><p id=\"ft-legacy-result-message\" class=\"notice\" role=\"status\">เลือกไฟล์ JSON เพื่อเริ่มตรวจสอบ</p><div id=\"ft-legacy-result-preview\"></div>');",
"  const input=root.querySelector('#ft-legacy-result-file'),preview=root.querySelector('#ft-legacy-result-preview'),message=root.querySelector('#ft-legacy-result-message');",
"  const setLegacyMessage=(value,kind='notice')=>{if(message){message.textContent=String(value);message.className='notice '+kind;}};",
"  const leagueNames={PL:'Premier League',PD:'La Liga',BL1:'Bundesliga',SA:'Serie A',FL1:'Ligue 1'};",
"  const allowed=new Set(Object.keys(leagueNames));",
"  const validTime=value=>typeof value==='string'&&/(?:Z|[+-][0-9]{2}:[0-9]{2})$/i.test(value)&&Number.isFinite(Date.parse(value));",
"  const validateLegacyEnvelope=payload=>{",
"    const fail=value=>{throw new TypeError(value);};",
"    if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.schema_version!=='1.0.0'||payload.exported_by!=='football-time'||payload.data_type!=='legacy_match_result_snapshots'||payload.snapshot_policy!=='non_revision_legacy')fail('ไฟล์ไม่ใช่ Legacy Result Snapshot v1.0');",
"    if(!String(payload.export_id||'').trim()||!validTime(payload.exported_at))fail('Export ID หรือเวลาส่งออกไม่ถูกต้อง');",
"    if(!payload.scope||!Array.isArray(payload.scope.league_ids)||!Array.isArray(payload.scope.season_ids)||!payload.scope.season_ids.includes('2026-2027')||payload.scope.league_ids.length!==5||Object.keys(leagueNames).some(x=>!payload.scope.league_ids.includes(x)))fail('ขอบเขตลีก/ฤดูกาลไม่ครบตาม Phase 1');",
"    if(!Array.isArray(payload.records)||payload.records.length<1||payload.records.length>2500)fail('จำนวน Legacy Snapshot ต้องอยู่ระหว่าง 1–2,500 รายการ');",
"    const ids=new Set();",
"    for(const [i,r] of payload.records.entries()){",
"      const matchId=String(r?.match_id||'');",
"      if(!/^FT-M-FOOTBALLDATA-[A-Za-z0-9_-]+$/.test(matchId)||ids.has(matchId))fail('Shared Match ID หายไปหรือซ้ำในรายการ '+(i+1));ids.add(matchId);",
"      if(r.provider!=='football-data'||String(r.provider_match_id||'')!==matchId.replace('FT-M-FOOTBALLDATA-',''))fail('Provider หรือ Provider Match ID ไม่ตรงกันในรายการ '+(i+1));",
"      if(!allowed.has(r.league_id)||!payload.scope.league_ids.includes(r.league_id)||r.season_id!=='2026-2027')fail('ลีกหรือฤดูกาลไม่ตรงในรายการ '+(i+1));",
"      if(!Number.isInteger(r.home_score)||r.home_score<0||!Number.isInteger(r.away_score)||r.away_score<0||r.status!=='FINISHED')fail('สกอร์หรือสถานะไม่ถูกต้องในรายการ '+(i+1));",
"      if(!r.evidence||r.evidence.classification!=='legacy_database_snapshot'||r.evidence.verification_status!=='not_independently_verified'||r.evidence.revision_history_available!==false||typeof r.evidence.source_provider!=='string'||!r.evidence.source_provider.trim()||(r.evidence.database_generated_at!==null&&!validTime(r.evidence.database_generated_at)))fail('หลักฐาน Legacy Snapshot ไม่ตรงกับนโยบายข้อมูลในรายการ '+(i+1));",
"      for(const key of ['result_revision','revision_history','updated_at','correction_reason','source'])if(Object.prototype.hasOwnProperty.call(r,key))fail('Legacy Snapshot ห้ามมีฟิลด์ Revision/Verified Provenance: '+key+' · รายการ '+(i+1));",
"    }",
"    return payload.records;",
"  };",
"  const stableLegacy=r=>JSON.stringify([r.match_id,r.league_id,r.season_id,r.home_score,r.away_score,r.evidence.classification,r.evidence.source_provider,r.evidence.database_generated_at,r.evidence.verification_status,r.evidence.revision_history_available]);",
"  const buildLegacyPlan=(incoming,matches)=>{",
"    const plan=[],errors=[],claimed=new Set();",
"    for(const record of incoming){",
"      const found=matches.filter(m=>m.sharedMatchId===record.match_id);",
"      if(found.length!==1){errors.push(record.match_id+(found.length?' ผูกกับ Local Match มากกว่า 1 รายการ':' ยังไม่มี Shared Match ID mapping จาก Fixtures'));continue;}",
"      const match=found[0];",
"      if(claimed.has(match.id)){errors.push(record.match_id+' ซ้ำกับ Local Match ที่ถูกใช้แล้ว');continue;}claimed.add(match.id);",
"      if(match.provider!=='football-data'||String(match.providerMatchId??'')!==record.provider_match_id||match.externalLeagueId!==record.league_id||match.externalSeasonId!==record.season_id){errors.push(record.match_id+' Provider/League/Season ไม่ตรงกับ Fixture mapping');continue;}",
"      const previous=match.footballTimeLegacyResultSnapshot||null;",
"      if(previous){if(stableLegacy(previous)!==stableLegacy(record)){errors.push(record.match_id+' มี Legacy Snapshot เดิมแต่คะแนนหรือหลักฐานต่างกัน · ไม่เขียนทับ');continue;}plan.push({record,match,action:'unchanged'});continue;}",
"      plan.push({record,match,action:'new'});",
"    }",
"    return {plan,errors};",
"  };",
"  input.addEventListener('change',async()=>{",
"    preview.replaceChildren();const file=input.files?.[0];if(!file)return;if(file.size>10*1024*1024){setLegacyMessage('ไฟล์ใหญ่เกิน 10 MB','error');return;}",
"    try{",
"      const payload=JSON.parse(await file.text()),incoming=validateLegacyEnvelope(payload),local=await records();",
"      const result=buildLegacyPlan(incoming,local.matches);",
"      const fresh=result.plan.filter(x=>x.action==='new').length,unchanged=result.plan.filter(x=>x.action==='unchanged').length;",
"      const panel=document.createElement('div');panel.className='panel import-preview';",
"      const summary=document.createElement('p');summary.textContent='Legacy Snapshot '+incoming.length+' รายการ · ใหม่ '+fresh+' · ซ้ำตรงกัน '+unchanged+' · ข้อขัดแย้ง '+result.errors.length;panel.append(summary);",
"      const list=document.createElement('div');result.plan.slice(0,15).forEach((x,i)=>{const row=document.createElement('div');row.className='fixture-preview-row';const title=document.createElement('b');title.textContent=(i+1)+'. '+x.match.homeTeam+' vs '+x.match.awayTeam+' · '+x.record.home_score+'-'+x.record.away_score;const detail=document.createElement('small');detail.textContent=leagueNames[x.record.league_id]+' · LEGACY / ไม่ได้ตรวจสอบอิสระ · '+(x.action==='new'?'รายการใหม่': 'นำเข้าไว้แล้ว');row.append(title,detail);list.append(row);});panel.append(list);",
"      if(result.errors.length){const e=document.createElement('div');e.className='notice error';e.textContent=result.errors.slice(0,10).join(' · ');panel.append(e);}",
"      const confirm=document.createElement('button');confirm.className='primary';confirm.id='confirm-ft-legacy-result-import';confirm.textContent='ยืนยันนำเข้า Legacy Snapshot';confirm.disabled=result.errors.length>0||fresh===0;panel.append(confirm);preview.append(panel);",
"      setLegacyMessage(result.errors.length?'พบข้อขัดแย้ง · ไม่มีการบันทึกข้อมูล':fresh===0?'ข้อมูล Legacy ตรงกับที่นำเข้าแล้ว · ไม่มีการเปลี่ยนแปลง':'ตรวจสอบผ่าน · ยังไม่ได้บันทึกข้อมูล',result.errors.length?'error':'success');",
"      confirm.addEventListener('click',async()=>{",
"        confirm.disabled=true;let processingError=null;",
"        try{",
"          const db=await openDatabase(),tx=db.transaction(['matches'],'readwrite'),store=tx.objectStore('matches'),request=store.getAll();",
"          const completion=new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(processingError||tx.error||new Error('บันทึกไม่สำเร็จ'));tx.onabort=()=>reject(processingError||tx.error||new Error('ยกเลิกธุรกรรม'));});",
"          request.onsuccess=()=>{try{",
"            const latest=buildLegacyPlan(incoming,request.result);",
"            if(latest.errors.length||latest.plan.length!==result.plan.length||latest.plan.some((x,i)=>x.match.id!==result.plan[i].match.id||x.action!==result.plan[i].action))throw new Error('ข้อมูลหรือการจับคู่เปลี่ยนหลังแสดงตัวอย่าง กรุณาตรวจสอบไฟล์ใหม่');",
"            for(const item of latest.plan){if(item.action==='unchanged')continue;const r=item.record,m=item.match;store.put({...m,footballTimeLegacyResultSnapshot:{match_id:r.match_id,league_id:r.league_id,season_id:r.season_id,home_score:r.home_score,away_score:r.away_score,status:'FINISHED',evidence:r.evidence},footballTimeLegacyResultSnapshotExportId:payload.export_id,footballTimeLegacyResultSnapshotImportedAt:nowISO(),footballTimeLegacyResultReadOnly:true});}",
"          }catch(error){processingError=error;try{tx.abort();}catch(_){}}};",
"          request.onerror=()=>{processingError=request.error||new Error('อ่าน Matches ในเครื่องไม่สำเร็จ');try{tx.abort();}catch(_){}};",
"          await completion;",
"          setLegacyMessage('นำเข้า Legacy Snapshot สำเร็จ '+fresh+' รายการ · เก็บแยกใน Match record · ไม่แก้ไขผล Verified, Predictions, Analyses หรือ Performance records','success');",
"          preview.innerHTML='<div class=\"notice success\">บันทึก Legacy Snapshot แบบ Read-only แล้ว · ข้อมูลนี้ยังไม่ถูกรวมกับ Performance ปกติและไม่สร้าง Revision History</div>';",
"          await render();",
"        }catch(error){confirm.disabled=false;setLegacyMessage(error instanceof Error?error.message:'นำเข้า Legacy Snapshot ไม่สำเร็จ','error');}",
"      });",
"    }catch(error){setLegacyMessage(error instanceof Error?error.message:'ตรวจสอบ Legacy Snapshot ไม่สำเร็จ','error');}",
"  });",
"}"
].join('\n');

const settingsMarker="else if (currentView === 'settings') {";
if(!main.includes(settingsMarker))throw new Error('Settings route anchor missing');
main=main.replace(settingsMarker,route+'\n'+settingsMarker);
css+='\n/* Football Time legacy result snapshot import */\n#confirm-ft-legacy-result-import:disabled{opacity:.45;cursor:not-allowed}\n';
if(main.includes("db.transaction(['match_results'],'readwrite')")||main.includes("objectStore('match_results').clear(")||main.includes('indexedDB.deleteDatabase('))throw new Error('Unexpected result-store or destructive database operation');
if(!main.includes("currentView === 'football-time-legacy-result-import'")||!main.includes('footballTimeLegacyResultSnapshot')||!main.includes('footballTimeLegacyResultReadOnly:true')||!main.includes('not_independently_verified')||!main.includes("db.transaction(['matches'],'readwrite')"))throw new Error('Legacy result import safety markers missing');
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);
console.log('Legacy snapshots stored additively on existing Match records; verified results, predictions, analyses and performance stores remain untouched.');
