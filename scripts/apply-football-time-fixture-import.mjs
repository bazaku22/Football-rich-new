import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', htmlPath='dist/index.html', swPath='dist/sw.js', versionPath='dist/app-version.json';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));

if(version.version!=='3.6' || !main.includes("const APP_VERSION='3.6';") ||
   !html.includes('main.js?v=20261116-v3-6') ||
   !sw.includes("const CACHE_NAME = 'football-rich-shell-v52'")) {
  throw new Error('Football Time import patch requires the V3.6 build before V3.7.');
}

const toolsStart=main.indexOf("currentView === 'tools'");
const resultStart=main.indexOf("else if (currentView === 'result-import') {",toolsStart);
if(toolsStart<0 || resultStart<0) throw new Error('Tools Center / Result Import routes not found');
let toolsBlock=main.slice(toolsStart,resultStart);
if(toolsBlock.includes('football-time-import')) throw new Error('Football Time import card already exists');
const gridEnd=toolsBlock.indexOf("</div>';");
if(gridEnd<0) throw new Error('Tools Center card grid end not found');
const card="'<button class=\\\"panel tools-card\\\" data-tool-target=\\\"football-time-import\\\"><span class=\\\"tools-icon\\\">⇄</span><b>นำเข้าข้อมูลจาก Football Time</b><small>รับโปรแกรม 5 ลีกจากไฟล์ JSON พร้อมจับคู่ Shared Match ID โดยรักษา Match ID เดิม</small><span class=\\\"tools-open\\\">ตรวจสอบไฟล์ ›</span></button>' +";
toolsBlock=toolsBlock.slice(0,gridEnd)+card+toolsBlock.slice(gridEnd);
main=main.slice(0,toolsStart)+toolsBlock+main.slice(resultStart);

const route = [
"else if (currentView === 'football-time-import') {",
"  root.innerHTML=pageTitle('FOOTBALL TIME · DATA IMPORT','นำเข้าข้อมูลจาก Football Time','นำเข้าโปรแกรมจากไฟล์ JSON ที่ส่งออกจาก Football Time เท่านั้น · ตรวจสอบก่อนบันทึกทุกครั้ง')+card('เลือกไฟล์โปรแกรมจาก Football Time','<p class=\"muted\">รองรับเฉพาะ Fixtures v1.0.0 · 5 ลีก PL, PD, BL1, SA, FL1 · ฤดูกาล 2026/27 · ไม่ดึงข้อมูลจาก API</p><label class=\"file-label\">เลือกไฟล์ Football Time JSON<input id=\"ft-fixture-file\" type=\"file\" accept=\"application/json,.json\"></label><p id=\"ft-fixture-message\" class=\"notice\" role=\"status\">เลือกไฟล์ JSON เพื่อเริ่มตรวจสอบ</p><div id=\"ft-fixture-preview\"></div>');",
"  const input=root.querySelector('#ft-fixture-file'), preview=root.querySelector('#ft-fixture-preview'), message=root.querySelector('#ft-fixture-message');",
"  const setFtMessage=(value,kind='notice')=>{if(message){message.textContent=String(value);message.className='notice '+kind;}};",
"  const leagueNames={PL:'Premier League',PD:'La Liga',BL1:'Bundesliga',SA:'Serie A',FL1:'Ligue 1'};",
"  const coreLeagues=new Set(Object.keys(leagueNames));",
"  const normFtTeam=value=>String(value??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\\s+/g,' ');",
"  const normFtLeague=value=>{const raw=String(value??'').trim();const code=leagueNames[raw.toUpperCase()]?raw.toUpperCase():Object.keys(leagueNames).find(k=>leagueNames[k].toLowerCase()===raw.toLowerCase());return code||raw.toLowerCase().replace(/[—–]/g,'-').replace(/\\s+/g,' ').trim();};",
"  const sameFtKickoff=(a,b)=>{const x=Date.parse(a??''),y=Date.parse(b??'');return Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=120000;};",
"  const validFtTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));",
"  const validateFtEnvelope=payload=>{",
"    const fail=message=>{throw new TypeError(message);};",
"    if(!payload||typeof payload!=='object'||Array.isArray(payload))fail('ไฟล์ต้องเป็น JSON Object');",
"    if(payload.schema_version!=='1.0.0'||payload.exported_by!=='football-time'||payload.data_type!=='fixtures')fail('ไฟล์ไม่ใช่ Football Time Fixtures v1.0.0');",
"    if(typeof payload.export_id!=='string'||!payload.export_id.trim()||!validFtTime(payload.exported_at))fail('ไม่พบ Export ID หรือเวลาส่งออกที่ถูกต้อง');",
"    if(!payload.scope||!Array.isArray(payload.scope.league_ids)||!Array.isArray(payload.scope.season_ids)||!payload.scope.season_ids.includes('2026-2027'))fail('ขอบเขตลีกหรือฤดูกาลไม่ถูกต้อง');",
"    if(payload.scope.league_ids.some(id=>!coreLeagues.has(id)))fail('ไฟล์มีลีกนอกขอบเขต 5 ลีกที่อนุมัติ');",
"    if(!Array.isArray(payload.records)||payload.records.length<1||payload.records.length>2500)fail('จำนวนโปรแกรมต้องอยู่ระหว่าง 1–2,500 คู่');",
"    const seen=new Set();",
"    payload.records.forEach((r,index)=>{",
"      if(!r||typeof r!=='object'||Array.isArray(r))fail('รายการลำดับ '+(index+1)+' ไม่ถูกต้อง');",
"      const providerId=String(r.provider_match_id??'').trim();",
"      if(r.provider!=='football-data'||!providerId||!/^FT-M-FOOTBALLDATA-[A-Za-z0-9_-]+$/.test(r.match_id||'')||r.match_id!=='FT-M-FOOTBALLDATA-'+providerId)fail('Shared Match ID / Provider Match ID ไม่ตรงกันในรายการ '+(index+1));",
"      if(seen.has(r.match_id))fail('พบ Shared Match ID ซ้ำภายในไฟล์: '+r.match_id);seen.add(r.match_id);",
"      if(!coreLeagues.has(r.league_id)||!payload.scope.league_ids.includes(r.league_id)||String(r.season_id)!=='2026-2027')fail('รายการ '+(index+1)+' อยู่นอกขอบเขตลีกหรือฤดูกาลที่อนุมัติ');",
"      if(!String(r.home_team_id??'').trim()||!String(r.away_team_id??'').trim()||String(r.home_team_id)===String(r.away_team_id))fail('รหัสทีมไม่ถูกต้องในรายการ '+(index+1));",
"      if(!String(r.home_team_name??'').trim()||!String(r.away_team_name??'').trim()||normFtTeam(r.home_team_name)===normFtTeam(r.away_team_name))fail('ชื่อทีมไม่ถูกต้องในรายการ '+(index+1));",
"      if(!validFtTime(r.kickoff_at)||!['SCHEDULED','TIMED','IN_PLAY','PAUSED','FINISHED','POSTPONED','SUSPENDED','CANCELLED','AWARDED'].includes(r.status))fail('วันเวลาแข่งขันหรือสถานะไม่ถูกต้องในรายการ '+(index+1));",
"      if(!r.source||typeof r.source.provider!=='string'||!r.source.provider.trim()||!validFtTime(r.source.retrieved_at)||!validFtTime(r.record_updated_at))fail('ข้อมูลแหล่งที่มาหรือเวลาปรับปรุงไม่ครบในรายการ '+(index+1));",
"    });",
"    return payload.records;",
"  };",
"  const buildFtPlan=(records,currentMatches)=>{",
"    const plan=[],errors=[],claimed=new Set(),seenFixtures=[];",
"    for(const record of records){",
"      if(seenFixtures.some(x=>x.league_id===record.league_id&&normFtTeam(x.home_team_name)===normFtTeam(record.home_team_name)&&normFtTeam(x.away_team_name)===normFtTeam(record.away_team_name)&&sameFtKickoff(x.kickoff_at,record.kickoff_at))){errors.push(record.match_id+' ซ้ำกับโปรแกรมทีมและเวลาเดียวกันภายในไฟล์');continue;}",
"      seenFixtures.push(record);",
"      const shared=currentMatches.filter(m=>m.sharedMatchId===record.match_id);",
"      if(shared.length>1){errors.push(record.match_id+' ถูกผูกกับ Local Match หลายรายการ');continue;}",
"      const provider=currentMatches.filter(m=>m.provider==='football-data'&&String(m.providerMatchId??'')===String(record.provider_match_id));",
"      if(provider.length>1){errors.push(record.match_id+' มี Provider Match ID ซ้ำในเครื่อง');continue;}",
"      let match=shared[0]||null;",
"      if(match&&provider.length===1&&provider[0].id!==match.id){errors.push(record.match_id+' ชี้ไปยัง Local Match ID ขัดแย้งกัน');continue;}",
"      if(!match&&provider.length===1)match=provider[0];",
"      const sameTeams=currentMatches.filter(m=>normFtTeam(m.homeTeam)===normFtTeam(record.home_team_name)&&normFtTeam(m.awayTeam)===normFtTeam(record.away_team_name)&&sameFtKickoff(m.kickoffAt,record.kickoff_at));",
"      if(!match){",
"        const sameLeague=sameTeams.filter(m=>normFtLeague(m.league)===record.league_id||normFtLeague(m.league)===normFtLeague(leagueNames[record.league_id]));",
"        if(sameLeague.length>1){errors.push(record.match_id+' ตรงกับแมตช์เดิมหลายรายการ จึงไม่สามารถจับคู่ได้อย่างปลอดภัย');continue;}",
"        if(sameLeague.length===1)match=sameLeague[0];",
"        else if(sameTeams.length){errors.push(record.match_id+' พบทีมและเวลาเตะตรงกัน แต่ลีกไม่ตรงกัน กรุณาตรวจสอบก่อน');continue;}",
"      }",
"      if(match){",
"        if(claimed.has(match.id)){errors.push(record.match_id+' พยายามจับคู่กับ Local Match เดียวกับรายการอื่นในไฟล์');continue;}",
"        if(match.sharedMatchId&&match.sharedMatchId!==record.match_id){errors.push(record.match_id+' ชนกับ Shared Match ID ที่ผูกไว้แล้วใน Local Match '+match.id);continue;}",
"        if(match.providerMatchId!=null&&String(match.providerMatchId)!==String(record.provider_match_id)){errors.push(record.match_id+' ชนกับ Provider Match ID อื่นใน Local Match '+match.id);continue;}",
"        if(normFtTeam(match.homeTeam)!==normFtTeam(record.home_team_name)||normFtTeam(match.awayTeam)!==normFtTeam(record.away_team_name)){errors.push(record.match_id+' ชื่อทีมไม่ตรงกับ Local Match '+match.id);continue;}",
"        if(match.homeTeamExternalId&&String(match.homeTeamExternalId)!==String(record.home_team_id)){errors.push(record.match_id+' รหัสทีมเหย้าขัดแย้งกับข้อมูลเดิม');continue;}",
"        if(match.awayTeamExternalId&&String(match.awayTeamExternalId)!==String(record.away_team_id)){errors.push(record.match_id+' รหัสทีมเยือนขัดแย้งกับข้อมูลเดิม');continue;}",
"        if(match.kickoffAt&&!sameFtKickoff(match.kickoffAt,record.kickoff_at)){errors.push(record.match_id+' เวลาแข่งขันไม่ตรงกับ Local Match '+match.id);continue;}",
"        if(normFtLeague(match.league)!==record.league_id&&normFtLeague(match.league)!==normFtLeague(leagueNames[record.league_id])){errors.push(record.match_id+' ลีกไม่ตรงกับ Local Match '+match.id);continue;}",
"        claimed.add(match.id);plan.push({record,match,action:'matched'});",
"      }else{plan.push({record,match:null,action:'new'});}",
"    }",
"    return {plan,errors};",
"  };",
"  input.addEventListener('change',async()=>{",
"    preview.replaceChildren();const file=input.files?.[0];if(!file)return;",
"    if(file.size>10*1024*1024){setFtMessage('ไฟล์ใหญ่เกิน 10 MB','error');return;}",
"    try{",
"      const local=await records();",
"      const payload=JSON.parse(await file.text()),ftRecords=validateFtEnvelope(payload);",
"      const result=buildFtPlan(ftRecords,local.matches);",
"      const created=result.plan.filter(x=>x.action==='new').length,matched=result.plan.length-created;",
"      const summary=document.createElement('div');summary.className='panel import-preview';",
"      const heading=document.createElement('p');heading.innerHTML='<b>พบโปรแกรม '+ftRecords.length+' คู่</b>';summary.append(heading);",
"      const counts=document.createElement('p');counts.textContent='สร้าง Local Match ใหม่ '+created+' คู่ · จับคู่กับ Match เดิม '+matched+' คู่ · ข้อขัดแย้ง '+result.errors.length+' รายการ';summary.append(counts);",
"      const list=document.createElement('div');",
"      result.plan.slice(0,12).forEach((entry,index)=>{const row=document.createElement('div');row.className='fixture-preview-row';const title=document.createElement('b');title.textContent=(index+1)+'. '+entry.record.home_team_name+' vs '+entry.record.away_team_name;const detail=document.createElement('small');detail.textContent=leagueNames[entry.record.league_id]+' · '+fmtDate(entry.record.kickoff_at)+' · '+(entry.action==='new'?'สร้าง Local Match ใหม่':'ใช้ Match ID เดิม '+entry.match.id);row.append(title,detail);list.append(row);});",
"      if(ftRecords.length>12){const more=document.createElement('p');more.className='muted';more.textContent='แสดงตัวอย่าง 12 คู่แรก จากทั้งหมด '+ftRecords.length+' คู่';list.append(more);}summary.append(list);",
"      if(result.errors.length){const errors=document.createElement('div');errors.className='notice error';errors.textContent='พบข้อขัดแย้ง '+result.errors.length+' รายการ: '+result.errors.slice(0,8).join(' · ');summary.append(errors);}",
"      const confirm=document.createElement('button');confirm.className='primary';confirm.id='confirm-ft-fixture-import';confirm.textContent='ยืนยันนำเข้า '+ftRecords.length+' คู่';confirm.disabled=result.errors.length>0;summary.append(confirm);preview.append(summary);",
"      setFtMessage(result.errors.length?'พบข้อขัดแย้ง · ยังไม่มีการบันทึกข้อมูล':'ตรวจสอบผ่าน · ยังไม่ได้บันทึกข้อมูล',result.errors.length?'error':'success');",
"      confirm.addEventListener('click',async()=>{",
"        confirm.disabled=true;let processingError=null;",
"        try{",
"          const db=await openDatabase(),tx=db.transaction(['matches'],'readwrite'),store=tx.objectStore('matches'),request=store.getAll();",
"          const completion=new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(processingError||tx.error||new Error('บันทึกไม่สำเร็จ'));tx.onabort=()=>reject(processingError||tx.error||new Error('ยกเลิกธุรกรรม'));});",
"          request.onsuccess=()=>{try{",
"            const latest=buildFtPlan(ftRecords,request.result);",
"            if(latest.errors.length)throw new Error('ข้อมูลในเครื่องเปลี่ยนระหว่างตรวจสอบ: '+latest.errors.slice(0,5).join(' · '));",
"            if(latest.plan.length!==result.plan.length||latest.plan.some((entry,index)=>entry.action!==result.plan[index].action||(entry.match?.id||null)!==(result.plan[index].match?.id||null)))throw new Error('การจับคู่ Local Match เปลี่ยนหลังแสดงตัวอย่าง กรุณาเลือกไฟล์และตรวจสอบใหม่');",
"            for(const entry of latest.plan){",
"              const r=entry.record,m=entry.match;",
"              const metadata={kickoffAt:new Date(r.kickoff_at).toISOString(),sharedMatchId:r.match_id,provider:'football-data',providerMatchId:String(r.provider_match_id),externalLeagueId:r.league_id,externalSeasonId:r.season_id,homeTeamExternalId:String(r.home_team_id),awayTeamExternalId:String(r.away_team_id),footballTimeStatus:r.status,footballTimeSource:r.source,footballTimeRecordUpdatedAt:r.record_updated_at,footballTimeExportId:payload.export_id,footballTimeImportedAt:nowISO()};",
"              if(m)store.put({...m,...metadata});",
"              else store.add({...base(),league:leagueNames[r.league_id],homeTeam:r.home_team_name,awayTeam:r.away_team_name,kickoffAt:new Date(r.kickoff_at).toISOString(),status:'UPCOMING',...metadata,notes:'นำเข้าจาก Football Time · '+r.match_id});",
"            }",
"          }catch(error){processingError=error;try{tx.abort();}catch(_){}}};",
"          request.onerror=()=>{processingError=request.error||new Error('อ่านรายการแข่งขันในเครื่องไม่สำเร็จ');try{tx.abort();}catch(_){}};",
"          await completion;",
"          setFtMessage('นำเข้าสำเร็จ '+ftRecords.length+' คู่ · สร้างใหม่ '+created+' คู่ · เชื่อมกับ Match ID เดิม '+matched+' คู่ · ไม่ได้นำเข้าผลการแข่งขันจริง','success');",
"          preview.innerHTML='<div class=\"notice success\">บันทึกโปรแกรมจาก Football Time เรียบร้อยแล้ว · Local Match UUID และประวัติการวิเคราะห์เดิมยังคงเดิม · ยังไม่มีการนำเข้าผลจริง</div>';",
"          await render();",
"        }catch(error){confirm.disabled=false;setFtMessage(error instanceof Error?error.message:'นำเข้าไม่สำเร็จ','error');}",
"      });",
"    }catch(error){setFtMessage(error instanceof Error?error.message:'อ่านไฟล์ Football Time ไม่สำเร็จ','error');}",
"  });",
"}"
].join('\n');

const settingsRoute="else if (currentView === 'settings') {";
if(!main.includes(settingsRoute)) throw new Error('Settings route anchor missing');
if(main.includes("currentView === 'football-time-import'")) throw new Error('Football Time route already exists');
main=main.replace(settingsRoute,route+'\n'+settingsRoute);

css+='\n/* Football Time fixture import preview */\n.fixture-preview-row{display:flex;flex-direction:column;gap:4px;padding:10px;margin:7px 0;border:1px solid #40351f;border-radius:9px;background:#17140f}.fixture-preview-row b{color:#e9e3d5;font-size:12px}.fixture-preview-row small{color:#a99d83;font-size:10px;line-height:1.5}\n';
fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
if(main.includes('indexedDB.deleteDatabase(')||main.includes("objectStore('matches').clear(")||main.includes("objectStore('matches').delete(")) throw new Error('Destructive match-store operation detected');
if(!main.includes("currentView === 'football-time-import'")||!main.includes('sharedMatchId')||!main.includes('FT-M-FOOTBALLDATA-')||!main.includes("db.transaction(['matches'],'readwrite')")) throw new Error('Football Time import implementation markers missing');
console.log('Football Time fixture import preview and atomic, idempotent Local Match mapping applied.');
