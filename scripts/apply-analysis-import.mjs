import fs from 'node:fs';
const file = 'src/main.ts';
let main = fs.readFileSync(file, 'utf8');
const oldImport = "import { addRecord, deleteRecord, downloadBackupFile, exportBackup, importBackup, listRecords, putRecord } from './data/database.js';";
const newImport = "import { addRecord, deleteRecord, downloadBackupFile, exportBackup, importBackup, listRecords, openDatabase, putRecord } from './data/database.js';";
if (main.includes(oldImport)) main = main.replace(oldImport, newImport);
if (!main.includes("openDatabase, putRecord")) throw new Error('Could not wire IndexedDB transaction helper');
const oldNav = "['performance', 'ผลงาน'], ['settings', 'ตั้งค่า']";
const newNav = "['performance', 'ผลงาน'], ['import', 'นำเข้ารายงาน'], ['settings', 'ตั้งค่า']";
if (main.includes(oldNav)) main = main.replace(oldNav, newNav);
if (!main.includes("['import', 'นำเข้ารายงาน']")) throw new Error('Could not add Import Analysis navigation');

const helper = [
"function validateAnalysisImport(input: unknown): asserts input is Record<string, any> {",
"  const fail = (message: string): never => { throw new TypeError(message); };",
"  const obj = input as Record<string, any>;",
"  const isObject = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);",
"  const validDate = (v: unknown) => typeof v === 'string' && !Number.isNaN(Date.parse(v));",
"  if (!isObject(obj)) fail('ไฟล์ต้องเป็น JSON Object');",
"  if (obj.schema_version !== '1.0.0' || obj.report_type !== 'football-rich-analysis') fail('ไม่รองรับรูปแบบรายงานนี้ (ต้องเป็น Football rich Analysis v1.0.0)');",
"  if (typeof obj.report_id !== 'string' || obj.report_id.length < 8) fail('ไม่พบ report_id ที่ถูกต้อง');",
"  if (!validDate(obj.created_at) || !validDate(obj.analysis_as_of)) fail('วันเวลาของรายงานไม่ถูกต้อง');",
"  if (!isObject(obj.match) || !['competition','home_team','away_team','kickoff_at','timezone'].every(k => k in obj.match)) fail('ข้อมูลคู่แข่งขันไม่ครบ');",
"  if (typeof obj.match.competition !== 'string' || !obj.match.competition.trim() || typeof obj.match.home_team !== 'string' || !obj.match.home_team.trim() || typeof obj.match.away_team !== 'string' || !obj.match.away_team.trim()) fail('ชื่อรายการหรือทีมแข่งขันไม่ถูกต้อง');",
"  if (obj.match.kickoff_at !== null && !validDate(obj.match.kickoff_at)) fail('เวลาแข่งขันไม่ถูกต้อง');",
"  if (!isObject(obj.market) || obj.market.market_type !== 'asian_handicap' || !['home','away'].includes(obj.market.selected_team)) fail('ข้อมูลตลาด Asian Handicap ไม่ถูกต้อง');",
"  const allowedLines = [-0.25,-0.5,-0.75,-1,-1.25,-1.5,-1.75,-2];",
"  if (!allowedLines.some(v => Math.abs(v - Number(obj.market.handicap_line)) < 0.0001)) fail('เส้นแฮนดิแคปไม่อยู่ในรายการที่ Football rich รองรับ');",
"  if (obj.market.decimal_odds !== null && (!Number.isFinite(obj.market.decimal_odds) || obj.market.decimal_odds <= 1)) fail('ราคาต่อรองไม่ถูกต้อง');",
"  if (!isObject(obj.analysis) || !isObject(obj.recommendation) || !Array.isArray(obj.evidence)) fail('ข้อมูลวิเคราะห์ คำแนะนำ หรือหลักฐานไม่ครบ');",
"  const cover = obj.analysis.cover_probability;",
"  if (cover !== null && (!Number.isFinite(cover) || cover < 0 || cover > 1)) fail('เปอร์เซ็นต์โอกาสกินราคาไม่ถูกต้อง');",
"  if (obj.analysis.probability_status === 'insufficient_data' && cover !== null) fail('ข้อมูลไม่เพียงพอ ต้องไม่ระบุ cover_probability');",
"  if (obj.analysis.probability_status !== 'insufficient_data' && obj.analysis.probability_status !== 'estimated') fail('สถานะความน่าจะเป็นไม่ถูกต้อง');",
"  const checkDistribution = (value: any, keys: string[], label: string) => {",
"    if (value === null) return;",
"    if (!isObject(value) || !keys.every(k => Number.isFinite(value[k]) && value[k] >= 0 && value[k] <= 1)) fail(label + ' ไม่ถูกต้อง');",
"    const total = keys.reduce((sum,k) => sum + value[k], 0);",
"    if (Math.abs(total - 1) > 0.015) fail(label + ' ต้องรวมกันเท่ากับ 100%');",
"  };",
"  checkDistribution(obj.analysis.match_outcome_probabilities, ['home_win','draw','away_win'], 'ความน่าจะเป็น 1X2');",
"  checkDistribution(obj.analysis.handicap_settlement_probabilities, ['full_win','half_win','push','half_loss','full_loss'], 'ความน่าจะเป็นผลชำระแฮนดิแคป');",
"  if (!['recommended','provisional','pass','no_recommendation'].includes(obj.recommendation.status)) fail('สถานะคำแนะนำไม่ถูกต้อง');",
"  if (!['home','away','none'].includes(obj.recommendation.selected_team)) fail('ทีมที่เลือกในคำแนะนำไม่ถูกต้อง');",
"  if (obj.recommendation.handicap_line !== null && Math.abs(Number(obj.recommendation.handicap_line) - Number(obj.market.handicap_line)) > 0.0001) fail('เส้นแฮนดิแคปในคำแนะนำไม่ตรงกับตลาด');",
"  for (const item of obj.evidence) {",
"    if (!isObject(item) || typeof item.publisher !== 'string' || typeof item.claim !== 'string') fail('รูปแบบแหล่งอ้างอิงไม่ถูกต้อง');",
"    if (item.url !== null && typeof item.url === 'string' && item.url && !/^https?:\\/\\//i.test(item.url)) fail('URL แหล่งอ้างอิงต้องเป็น HTTP หรือ HTTPS');",
"    if (item.checked_at !== null && !validDate(item.checked_at)) fail('วันเวลาตรวจสอบแหล่งอ้างอิงไม่ถูกต้อง');",
"  }",
"}"
].join('\n');
if (!main.includes('function validateAnalysisImport(')) {
  const marker = "function pageTitle(kicker:string,title:string,sub:string='')";
  if (!main.includes(marker)) throw new Error('Could not locate main.ts helper insertion point');
  main = main.replace(marker, helper + '\n\n' + marker);
}

const branch = [
"  } else if(currentView==='import') {",
"    root.innerHTML=pageTitle('ANALYSIS IMPORT','นำเข้ารายงานวิเคราะห์','นำเข้าไฟล์ JSON ที่ Jeff จัดทำ ตรวจสอบก่อนบันทึกลงอุปกรณ์') +",
"      card('เลือกไฟล์รายงาน', '<p class=\"muted\">รองรับเฉพาะไฟล์ Football rich Analysis JSON เวอร์ชัน 1.0.0 · PDF ใช้สำหรับอ่าน ไม่สามารถนำเข้าเป็นข้อมูลได้</p><label class=\"file-label\">เลือกไฟล์ JSON<input id=\"analysis-import-file\" type=\"file\" accept=\"application/json,.json\"></label><p id=\"analysis-import-message\" class=\"notice\" role=\"status\">เลือกไฟล์ JSON จากโฟลเดอร์ Downloads เพื่อเริ่มตรวจสอบ</p><div id=\"analysis-import-preview\"></div>');",
"    const fileInput=document.querySelector<HTMLInputElement>('#analysis-import-file')!;",
"    const preview=document.querySelector<HTMLDivElement>('#analysis-import-preview')!;",
"    fileInput.addEventListener('change',async()=>{",
"      preview.innerHTML='';",
"      const file=fileInput.files?.[0];",
"      if(!file)return;",
"      if(file.size>2*1024*1024){setMessage('#analysis-import-message','ไฟล์ใหญ่เกิน 2 MB','error');return;}",
"      try{",
"        const parsed:unknown=JSON.parse(await file.text());",
"        validateAnalysisImport(parsed);",
"        const report=parsed;",
"        const latest=await records();",
"        const duplicate=latest.analyses.some(a=>(a as any).importReportId===report.report_id);",
"        const matching=latest.matches.filter(m=>m.league.trim().toLowerCase()===String(report.match.competition).trim().toLowerCase()&&m.homeTeam.trim().toLowerCase()===String(report.match.home_team).trim().toLowerCase()&&m.awayTeam.trim().toLowerCase()===String(report.match.away_team).trim().toLowerCase());",
"        const existingMatch=matching.length===1?matching[0]:undefined;",
"        const ambiguous=matching.length>1;",
"        const selected=report.market.selected_team==='home'?report.match.home_team:report.match.away_team;",
"        const odds=report.market.decimal_odds===null?'ไม่ระบุ':Number(report.market.decimal_odds).toFixed(2);",
"        const cover=report.analysis.cover_probability===null?'ข้อมูลไม่เพียงพอ':(Number(report.analysis.cover_probability)*100).toFixed(1)+'%';",
"        const statusLabel=report.recommendation.status==='provisional'?'รอยืนยัน (Provisional)':report.recommendation.status==='recommended'?'แนะนำ':'ผ่าน/ไม่มีคำแนะนำ';",
"        preview.innerHTML='<div class=\"panel import-preview\"><div class=\"record-top\"><span class=\"tag\">รายงานถูกต้อง · v'+esc(report.schema_version)+'</span><small>'+esc(report.report_id)+'</small></div><h3>'+esc(report.match.home_team)+' <i>VS</i> '+esc(report.match.away_team)+'</h3><p class=\"muted\">'+esc(report.match.competition)+' · '+(report.match.kickoff_at?esc(fmtDate(report.match.kickoff_at)):'ไม่ระบุเวลาแข่งขัน')+'</p><div class=\"metrics\"><span>ทีมที่เลือก <b>'+esc(selected)+'</b></span><span>แฮนดิแคป <b>'+Number(report.market.handicap_line).toFixed(2)+'</b></span><span>ราคาอ้างอิง <b>'+odds+'</b></span></div><div class=\"import-probability\"><span>โอกาสกินราคา</span><strong>'+cover+'</strong></div><p><b>สถานะ:</b> '+esc(statusLabel)+'</p><p>'+esc(report.recommendation.summary)+'</p><p class=\"muted\">ตรวจข้อมูลล่าสุด: '+esc(fmtDate(report.analysis_as_of))+'</p>'+(duplicate?'<p class=\"error-text\">รายงานนี้ถูกนำเข้าแล้ว ระบบจะไม่สร้างรายการซ้ำ</p>':ambiguous?'<p class=\"error-text\">พบคู่แข่งขันชื่อซ้ำหลายรายการ กรุณาตรวจสอบรายการแข่งขันก่อนนำเข้า</p>':existingMatch?'<p class=\"notice\">พบคู่แข่งขันเดิม ระบบจะเพิ่มบทวิเคราะห์เวอร์ชันใหม่โดยไม่เขียนทับข้อมูลเดิม</p>':'<p class=\"notice\">จะเพิ่มคู่แข่งขันใหม่และบันทึกบทวิเคราะห์ลงในเครื่อง</p>')+'<p class=\"muted\">การนำเข้าจะไม่สร้างคำทำนายที่ยืนยัน และไม่แก้ไข Prediction เดิม</p><button class=\"primary\" id=\"confirm-analysis-import\" '+(duplicate||ambiguous?'disabled':'')+'>นำเข้ารายงานนี้</button></div>';",
"        setMessage('#analysis-import-message',duplicate?'พบรายงานซ้ำ':ambiguous?'พบคู่แข่งขันที่อาจซ้ำหลายรายการ':'ตรวจสอบไฟล์เรียบร้อย กรุณาตรวจตัวอย่างก่อนยืนยัน','success');",
"        const confirmButton=document.querySelector<HTMLButtonElement>('#confirm-analysis-import');",
"        confirmButton?.addEventListener('click',async()=>{",
"          confirmButton.disabled=true;",
"          try{",
"            const latestNow=await records();",
"            if(latestNow.analyses.some(a=>(a as any).importReportId===report.report_id))throw new Error('รายงานนี้ถูกนำเข้าไปแล้ว');",
"            const linked=existingMatch??undefined;",
"            const matchRecord=(linked??({...base(),league:String(report.match.competition),homeTeam:String(report.match.home_team),awayTeam:String(report.match.away_team),kickoffAt:report.match.kickoff_at?new Date(report.match.kickoff_at).toISOString():'',status:report.match.match_status==='finished'?'FINISHED':'UPCOMING',notes:'นำเข้าจากรายงาน '+report.report_id} as MatchRecord));",
"            const nextVersion=latestNow.analyses.filter(a=>a.matchId===matchRecord.id).reduce((n,a)=>Math.max(n,a.version||0),0)+1;",
"            const outcome=report.analysis.match_outcome_probabilities;",
"            const research={...base(),matchId:matchRecord.id,researchType:'รายงานวิเคราะห์ที่นำเข้า',content:[String(report.recommendation.summary),...(Array.isArray(report.analysis.reasoning)?report.analysis.reasoning:[]),...(Array.isArray(report.analysis.limitations)?report.analysis.limitations.map((v:string)=>'ข้อจำกัด: '+v):[])].join('\\n')} as ResearchRecord;",
"            const analysisRecord={...base(),matchId:matchRecord.id,version:nextVersion,summary:research.content,confidence:report.analysis.cover_probability===null?undefined:Number(report.analysis.cover_probability)*100,probabilities:outcome?{homeWin:Number(outcome.home_win)*100,draw:Number(outcome.draw)*100,awayWin:Number(outcome.away_win)*100}:undefined,importReportId:report.report_id,importSchemaVersion:report.schema_version,importedAt:nowISO(),analysisAsOf:report.analysis_as_of,recommendation:report.recommendation,marketSnapshot:report.market,handicapSettlementProbabilities:report.analysis.handicap_settlement_probabilities,coverProbability:report.analysis.cover_probability,probabilityStatus:report.analysis.probability_status,riskLevel:report.analysis.risk_level,evidence:report.evidence,sourceReport:report} as AnalysisRecord;",
"            const evidenceRecords:SourceEvidenceRecord[]=report.evidence.filter((v:any)=>typeof v.url==='string'&&v.url.trim()).map((v:any)=>({...base(),matchId:matchRecord.id,sourceName:String(v.publisher),url:String(v.url),verificationStatus:'UNVERIFIED',retrievedAt:v.checked_at??report.analysis_as_of,notes:String(v.claim)} as SourceEvidenceRecord));",
"            const storeNames:string[]=['analyses','research_records'];",
"            if(!linked)storeNames.push('matches');",
"            if(evidenceRecords.length)storeNames.push('source_evidence');",
"            const db=await openDatabase();",
"            const tx=db.transaction(storeNames,'readwrite');",
"            if(!linked)tx.objectStore('matches').add(matchRecord);",
"            tx.objectStore('analyses').add(analysisRecord);",
"            tx.objectStore('research_records').add(research);",
"            for(const evidenceRecord of evidenceRecords)tx.objectStore('source_evidence').add(evidenceRecord);",
"            await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('บันทึกข้อมูลไม่สำเร็จ'));tx.onabort=()=>reject(tx.error??new Error('ยกเลิกการบันทึกข้อมูล'));});",
"            setMessage('#analysis-import-message','นำเข้ารายงานสำเร็จ · บันทึกบทวิเคราะห์เวอร์ชัน '+nextVersion+' แล้ว','success');",
"            preview.innerHTML='<div class=\"notice success\">นำเข้ารายงานสำเร็จแล้ว ข้อมูลถูกบันทึกในอุปกรณ์นี้ คุณสามารถไปที่เมนู วิเคราะห์ เพื่อดูรายการได้</div>';",
"          }catch(error){confirmButton.disabled=false;setMessage('#analysis-import-message',error instanceof Error?error.message:'ไม่สามารถนำเข้ารายงานได้','error');}",
"        });",
"      }catch(error){setMessage('#analysis-import-message',error instanceof Error?error.message:'อ่านไฟล์ JSON ไม่สำเร็จ','error');}",
"    });"
].join('\n');
if (!main.includes("} else if(currentView==='import') {")) {
  const anchor = "  } else if(currentView==='settings') {";
  if (!main.includes(anchor)) throw new Error('Could not locate Settings view insertion point');
  main = main.replace(anchor, branch + '\n' + anchor);
}
fs.writeFileSync(file, main);

const cssPath='src/styles/main.css';
let css=fs.readFileSync(cssPath,'utf8');
if(!css.includes('/* Analysis JSON import */')){
  css += '\n/* Analysis JSON import */\n.import-preview { margin-top:18px; border:1px solid #8d6b2b; }\n.import-preview h3 { line-height:1.45; }\n.import-probability { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:18px 0; padding:14px 16px; border-radius:12px; background:#211D14; color:#E9E3D5; }\n.import-probability strong { color:#F4D27B; font-size:1.35rem; }\n.import-preview .metrics { flex-wrap:wrap; }\n.import-preview .metrics span { min-width:110px; }\n#analysis-import-file { display:block; margin-top:10px; max-width:100%; color:#E9E3D5; }\n#confirm-analysis-import:disabled { opacity:.45; cursor:not-allowed; }\n';
  fs.writeFileSync(cssPath,css);
}
console.log('Analysis Import UI patch applied.');
