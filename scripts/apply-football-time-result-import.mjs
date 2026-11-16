import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

if (!main.includes("currentView === 'football-time-import'") ||
    !main.includes("db.transaction(['matches'],'readwrite')") ||
    main.includes("currentView === 'football-time-result-import'")) {
  throw new Error('Read-only result import requires the merged Football Time fixture importer.');
}

const toolsStart=main.indexOf("currentView === 'tools'");
const resultRoute=main.indexOf("else if (currentView === 'result-import') {",toolsStart);
if(toolsStart<0||resultRoute<0)throw new Error('Tools Center / Result Import route anchors missing');
let tools=main.slice(toolsStart,resultRoute);
const label=tools.indexOf('นำเข้าข้อมูลจาก Football Time');
const cardEnd=label<0?-1:tools.indexOf("</button>' +",label);
if(cardEnd<0)throw new Error('Could not find the existing Football Time fixture import card');
const resultCard="'<button class=\\\"panel tools-card\\\" data-tool-target=\\\"football-time-result-import\\\"><span class=\\\"tools-icon\\\">✓</span><b>นำเข้าผลจริงจาก Football Time</b><small>รับผล FINISHED พร้อม Revision และประวัติแก้ไขแบบ Read-only</small><span class=\\\"tools-open\\\">ตรวจสอบผลจริง ›</span></button>' +";
tools=tools.slice(0,cardEnd+("</button>' +").length)+resultCard+tools.slice(cardEnd+("</button>' +").length);
main=main.slice(0,toolsStart)+tools+main.slice(resultRoute);

const route = [
"else if (currentView === 'football-time-result-import') {",
"  root.innerHTML=pageTitle('FOOTBALL TIME · READ-ONLY RESULTS','นำเข้าผลจริงจาก Football Time','ผลจริงเป็นข้อมูลของ Football Time เท่านั้น · Football rich รับเข้าเพื่อใช้อ้างอิงและประเมินผล โดยไม่สร้างหรือแก้ไขผลจริงเอง')+card('เลือกไฟล์ผลการแข่งขันจาก Football Time','<p class=\"muted\">รองรับ Match Results v1.0.0 · 5 ลีก PL, PD, BL1, SA, FL1 · ฤดูกาล 2026/27 · ต้องมี Revision และประวัติครบทุกเวอร์ชัน</p><label class=\"file-label\">เลือกไฟล์ผลจริง JSON<input id=\"ft-result-file\" type=\"file\" accept=\"application/json,.json\"></label><p id=\"ft-result-message\" class=\"notice\" role=\"status\">เลือกไฟล์ JSON เพื่อเริ่มตรวจสอบ</p><div id=\"ft-result-preview\"></div>');",
"  const input=root.querySelector('#ft-result-file'),preview=root.querySelector('#ft-result-preview'),message=root.querySelector('#ft-result-message');",
"  const setFtResultMessage=(value,kind='notice')=>{if(message){message.textContent=String(value);message.className='notice '+kind;}};",
"  const leagueNames={PL:'Premier League',PD:'La Liga',BL1:'Bundesliga',SA:'Serie A',FL1:'Ligue 1'};",
"  const allowed=new Set(Object.keys(leagueNames));",
"  const validTime=value=>typeof value==='string'&&/(?:Z|[+-][0-9]{2}:[0-9]{2})$/i.test(value)&&Number.isFinite(Date.parse(value));",
"  const stableHistory=row=>JSON.stringify((row||[]).map(x=>({result_revision:x.result_revision,home_score:x.home_score,away_score:x.away_score,status:x.status,change_type:x.change_type||'baseline',reason:x.reason||'',recorded_at:x.recorded_at,source:{provider:x.source?.provider,verified_at:x.source?.verified_at}})));",
"  const validateResultEnvelope=payload=>{",
"    const fail=value=>{throw new TypeError(value);};",
"    if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.schema_version!=='1.0.0'||payload.exported_by!=='football-time'||payload.data_type!=='match_results')fail('ไฟล์ไม่ใช่ Football Time Match Results v1.0.0');",
"    if(!String(payload.export_id||'').trim()||!validTime(payload.exported_at))fail('Export ID หรือเวลาส่งออกไม่ถูกต้อง');",
"    if(!payload.scope||!Array.isArray(payload.scope.league_ids)||!payload.scope.season_ids?.includes('2026-2027')||payload.scope.league_ids.some(x=>!allowed.has(x)))fail('ขอบเขตลีก/ฤดูกาลไม่ตรงกับ Phase 1');",
"    if(!Array.isArray(payload.records)||payload.records.length<1||payload.records.length>2500)fail('จำนวนผลการแข่งขันต้องอยู่ระหว่าง 1–2,500 รายการ');",
"    const ids=new Set();",
"    for(const [i,r] of payload.records.entries()){",
"      const matchId=String(r?.match_id||'');",
"      if(!/^FT-M-FOOTBALLDATA-[A-Za-z0-9_-]+$/.test(matchId)||ids.has(matchId))fail('Shared Match ID หายไปหรือซ้ำในรายการ '+(i+1));ids.add(matchId);",
"      if(!allowed.has(r.league_id)||!payload.scope.league_ids.includes(r.league_id)||r.season_id!=='2026-2027')fail('ลีกหรือฤดูกาลของผลจริงไม่ตรงกับขอบเขตในรายการ '+(i+1));",
"      if(!Number.isInteger(r.home_score)||r.home_score<0||!Number.isInteger(r.away_score)||r.away_score<0||r.status!=='FINISHED')fail('สกอร์หรือสถานะไม่ถูกต้องในรายการ '+(i+1));",
"      if(!Number.isInteger(r.result_revision)||r.result_revision<1||!validTime(r.updated_at)||!r.source?.provider||!validTime(r.source?.verified_at))fail('ขาด Revision หรือ Source Provenance ในรายการ '+(i+1));",
"      if(!Array.isArray(r.revision_history)||r.revision_history.length!==r.result_revision)fail('ประวัติ Revision ไม่ครบในรายการ '+(i+1));",
"      const h=r.revision_history;",
"      for(let j=0;j<h.length;j++){const x=h[j];if(x.result_revision!==j+1||!Number.isInteger(x.home_score)||x.home_score<0||!Number.isInteger(x.away_score)||x.away_score<0||x.status!=='FINISHED'||!validTime(x.recorded_at)||!x.source?.provider||!validTime(x.source?.verified_at))fail('ประวัติ Revision ไม่ต่อเนื่อง/ไม่ครบในรายการ '+(i+1));}",
"      const last=h[h.length-1];if(last.home_score!==r.home_score||last.away_score!==r.away_score||last.result_revision!==r.result_revision)fail('สกอร์ล่าสุดไม่ตรงกับประวัติ Revision ในรายการ '+(i+1));",
"    }",
"    return payload.records;",
"  };",
"  const buildResultPlan=(records,matches)=>{",
"    const plan=[],errors=[],claimed=new Set();",
"    for(const record of records){",
"      const found=matches.filter(m=>m.sharedMatchId===record.match_id);",
"      if(found.length!==1){errors.push(record.match_id+(found.length?' ผูกกับ Local Match มากกว่า 1 รายการ':' ยังไม่มี Shared Match ID mapping จาก Fixtures'));continue;}",
"      const match=found[0];",
"      if(claimed.has(match.id)){errors.push(record.match_id+' ซ้ำกับ Local Match ที่ถูกใช้แล้ว');continue;}claimed.add(match.id);",
"      if(match.provider!=='football-data'){errors.push(record.match_id+' Provider ไม่ตรงกับ Football Time');continue;}",
"      if(String(match.providerMatchId??'')!==record.match_id.replace('FT-M-FOOTBALLDATA-','')){errors.push(record.match_id+' Provider Match ID ไม่ตรงกับ Fixture mapping');continue;}",
"      if(match.externalLeagueId!==record.league_id){errors.push(record.match_id+' League ID ไม่ตรงกับ Fixture mapping');continue;}",
"      if(match.externalSeasonId!==record.season_id){errors.push(record.match_id+' Season ID ไม่ตรงกับ Fixture mapping');continue;}",
"      const previous=match.footballTimeResult||null;",
"      if(previous){",
"        const oldRevision=Number(previous.result_revision||0),newRevision=record.result_revision;",
"        if(newRevision<oldRevision){errors.push(record.match_id+' เป็น Revision เก่า ('+newRevision+' < '+oldRevision+')');continue;}",
"        const oldHistory=match.footballTimeResultHistory||previous.revision_history||[];",
"        if(newRevision===oldRevision){",
"          if(previous.home_score!==record.home_score||previous.away_score!==record.away_score||stableHistory(oldHistory)!==stableHistory(record.revision_history)){errors.push(record.match_id+' ใช้ Revision เดิมแต่เนื้อหาผล/ประวัติไม่ตรงกัน');continue;}",
"          plan.push({record,match,action:'unchanged'});continue;",
"        }",
"        if(oldHistory.length>record.revision_history.length||stableHistory(oldHistory)!==stableHistory(record.revision_history.slice(0,oldHistory.length))){errors.push(record.match_id+' ประวัติ Revision ใหม่ไม่ต่อเนื่องจากข้อมูลที่เคยนำเข้า');continue;}",
"      }",
"      plan.push({record,match,action:previous?'updated':'new'});",
"    }",
"    return {plan,errors};",
"  };",
"  input.addEventListener('change',async()=>{",
"    preview.replaceChildren();const file=input.files?.[0];if(!file)return;if(file.size>10*1024*1024){setFtResultMessage('ไฟล์ใหญ่เกิน 10 MB','error');return;}",
"    try{",
"      const payload=JSON.parse(await file.text()),recordsIn=validateResultEnvelope(payload),local=await records();",
"      const result=buildResultPlan(recordsIn,local.matches);",
"      const fresh=result.plan.filter(x=>x.action==='new').length,updated=result.plan.filter(x=>x.action==='updated').length,unchanged=result.plan.filter(x=>x.action==='unchanged').length;",
"      const panel=document.createElement('div');panel.className='panel import-preview';",
"      const summary=document.createElement('p');summary.textContent='ผลจริง '+recordsIn.length+' รายการ · ใหม่ '+fresh+' · Revision ใหม่ '+updated+' · ข้อมูลเดิมตรงกัน '+unchanged+' · ข้อขัดแย้ง '+result.errors.length;panel.append(summary);",
"      const list=document.createElement('div');result.plan.slice(0,15).forEach((x,i)=>{const row=document.createElement('div');row.className='fixture-preview-row';const title=document.createElement('b');title.textContent=(i+1)+'. '+x.match.homeTeam+' vs '+x.match.awayTeam+' · '+x.record.home_score+'-'+x.record.away_score;const detail=document.createElement('small');detail.textContent=leagueNames[x.record.league_id]+' · Revision '+x.record.result_revision+' · '+(x.action==='new'?'ผลจริง FT รายการใหม่':x.action==='updated'?'รับ Revision ใหม่':'ตรงกับข้อมูลที่นำเข้าแล้ว');row.append(title,detail);list.append(row);});panel.append(list);",
"      if(result.errors.length){const e=document.createElement('div');e.className='notice error';e.textContent=result.errors.slice(0,10).join(' · ');panel.append(e);}",
"      const confirm=document.createElement('button');confirm.className='primary';confirm.id='confirm-ft-result-import';confirm.textContent='ยืนยันนำเข้าผลจริง';confirm.disabled=result.errors.length>0||fresh+updated===0;panel.append(confirm);preview.append(panel);",
"      setFtResultMessage(result.errors.length?'พบข้อขัดแย้ง · ไม่มีการบันทึกข้อมูล':fresh+updated===0?'ข้อมูลตรงกับที่นำเข้าแล้ว · ไม่มีการเปลี่ยนแปลง':'ตรวจสอบผ่าน · ยังไม่ได้บันทึกข้อมูล',result.errors.length?'error':'success');",
"      confirm.addEventListener('click',async()=>{",
"        confirm.disabled=true;let processingError=null;",
"        try{",
"          const db=await openDatabase(),tx=db.transaction(['matches'],'readwrite'),store=tx.objectStore('matches'),request=store.getAll();",
"          const completion=new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(processingError||tx.error||new Error('บันทึกไม่สำเร็จ'));tx.onabort=()=>reject(processingError||tx.error||new Error('ยกเลิกธุรกรรม'));});",
"          request.onsuccess=()=>{try{",
"            const latest=buildResultPlan(recordsIn,request.result);",
"            if(latest.errors.length||latest.plan.length!==result.plan.length||latest.plan.some((x,i)=>x.match.id!==result.plan[i].match.id||x.action!==result.plan[i].action))throw new Error('ข้อมูลหรือการจับคู่เปลี่ยนหลังแสดงตัวอย่าง กรุณาตรวจสอบไฟล์ใหม่');",
"            for(const item of latest.plan){if(item.action==='unchanged')continue;const r=item.record,m=item.match;store.put({...m,footballTimeResult:{match_id:r.match_id,home_score:r.home_score,away_score:r.away_score,status:'FINISHED',result_revision:r.result_revision,updated_at:r.updated_at,correction_reason:r.correction_reason||'',source:r.source,revision_history:r.revision_history},footballTimeResultHistory:r.revision_history,footballTimeResultExportId:payload.export_id,footballTimeResultImportedAt:nowISO(),footballTimeResultReadOnly:true,footballTimeEvaluationState:'pending'});}",
"          }catch(error){processingError=error;try{tx.abort();}catch(_){}}};",
"          request.onerror=()=>{processingError=request.error||new Error('อ่าน Matches ในเครื่องไม่สำเร็จ');try{tx.abort();}catch(_){}};",
"          await completion;",
"          setFtResultMessage('นำเข้าผลจริงจาก Football Time สำเร็จ '+(fresh+updated)+' รายการ · ข้อมูลเดิม '+unchanged+' รายการยังคงเดิม · ไม่แก้ไข Match ID, Predictions หรือผลเดิมใน Result Import','success');",
"          preview.innerHTML='<div class=\"notice success\">บันทึกผลจริงเป็น FT Read-only snapshot แล้ว · ประวัติ Revision ทุกเวอร์ชันถูกเก็บไว้ใน Match record · ขั้นตอนประเมิน Prediction จะอ่านข้อมูลชุดนี้ในขั้นตอนถัดไป</div>';",
"          await render();",
"        }catch(error){confirm.disabled=false;setFtResultMessage(error instanceof Error?error.message:'นำเข้าผลจริงไม่สำเร็จ','error');}",
"      });",
"    }catch(error){setFtResultMessage(error instanceof Error?error.message:'อ่านไฟล์ผลจริงไม่สำเร็จ','error');}",
"  });",
"}"
].join('\n');

const settingsMarker="else if (currentView === 'settings') {";
if(!main.includes(settingsMarker))throw new Error('Settings route anchor missing');
main=main.replace(settingsMarker,route+'\n'+settingsMarker);
css+='\n/* Football Time read-only result import */\n#confirm-ft-result-import:disabled{opacity:.45;cursor:not-allowed}\n';
if(main.includes("db.transaction(['match_results'],'readwrite')")||main.includes("objectStore('match_results').clear(")||main.includes('indexedDB.deleteDatabase('))throw new Error('Unexpected result-store or destructive database operation');
if(!main.includes("currentView === 'football-time-result-import'")||!main.includes('footballTimeResultHistory')||!main.includes('footballTimeResultReadOnly:true')||!main.includes("db.transaction(['matches'],'readwrite')"))throw new Error('Read-only result import safety markers missing');
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);
console.log('FT result revisions imported as additive read-only metadata on existing Match records; legacy result/prediction stores are untouched.');
