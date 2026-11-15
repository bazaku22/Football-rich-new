import fs from 'node:fs';

const mainPath='dist/main.js',cssPath='dist/styles/main.css',htmlPath='dist/index.html',swPath='dist/sw.js',versionPath='dist/app-version.json';
let main=fs.readFileSync(mainPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),html=fs.readFileSync(htmlPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));
const replaceOnce=(source,from,to,label)=>{const i=source.indexOf(from);if(i<0)throw new Error('V3.4 patch anchor missing: '+label);return source.slice(0,i)+to+source.slice(i+from.length);};

if(version.version!=='3.3'||!main.includes("const APP_VERSION='3.3';")||!html.includes('main.js?v=20261116-v3-3')||!sw.includes("const CACHE_NAME = 'football-rich-shell-v49'"))throw Error('V3.4 expected V3.3 build anchors missing');

// Tools Center B: replace Fixture Import + Analysis Import with one combined import entry.
const toolsStart=main.indexOf("currentView === 'tools'");
const fixtureText=main.indexOf('fixture-import',toolsStart);
const resultText=main.indexOf('result-import',fixtureText);
const fixtureCard=main.lastIndexOf("'<button",fixtureText);
const resultCard=main.lastIndexOf("'<button",resultText);
if(toolsStart<0||fixtureCard<0||resultCard<=fixtureCard)throw Error('Could not locate the two old import cards in Tools Center');
const combinedCard="'<button class=\\\"panel tools-card\\\" data-tool-target=\\\"import\\\"><span class=\\\"tools-icon\\\">◈</span><b>นำเข้าโปรแกรมพร้อมบทวิเคราะห์</b><small>สร้าง Match ID และผูกบทวิเคราะห์จาก JSON ชุดเดียว</small><span class=\\\"tools-open\\\">เปิดเครื่องมือ ›</span></button>'+\n    ";
main=main.slice(0,fixtureCard)+combinedCard+main.slice(resultCard);

// Remove the now-obsolete standalone Fixture Import route. Result Import remains unchanged.
const fixtureRoute=main.indexOf("else if (currentView === 'fixture-import') {");
const resultRoute=main.indexOf("else if (currentView === 'result-import') {",fixtureRoute);
if(fixtureRoute<0||resultRoute<fixtureRoute)throw Error('Could not locate old Fixture Import route');
main=main.slice(0,fixtureRoute)+main.slice(resultRoute);

// Rename the existing analysis importer as the combined fixture + analysis workflow.
main=replaceOnce(main,"pageTitle('ANALYSIS IMPORT','นำเข้ารายงานวิเคราะห์','เลือก JSON แบบชุด หรือ ZIP ที่มี JSON หลายคู่ แล้วนำเข้าพร้อมกันในครั้งเดียว')",
"pageTitle('MATCH + ANALYSIS IMPORT','นำเข้าโปรแกรมพร้อมบทวิเคราะห์','นำเข้า JSON ชุดเดียว · สร้าง Match ID อัตโนมัติและเชื่อมบทวิเคราะห์ให้ทุกคู่')",'combined importer heading');
main=replaceOnce(main,"card('เลือกไฟล์รายงาน',","card('เลือกไฟล์โปรแกรมพร้อมบทวิเคราะห์',",'combined importer file card');
main=replaceOnce(main,'Football rich Analysis v1.0.0 · JSON หรือ ZIP · สูงสุด 20 MB · ไม่เกิน 100 คู่',
'Football rich Analysis Batch v1.0.0 · JSON 1 ไฟล์ · 1–100 คู่ · แต่ละรายงานต้องมีรายการแข่งขัน ทีม และเวลาเตะ',
'combined importer description');

main=replaceOnce(main,'เลือกไฟล์ JSON / ZIP','เลือกไฟล์ JSON','combined JSON picker label');
main=replaceOnce(main,'.json,application/json,.zip,application/zip','.json,application/json','combined JSON picker accept type');

// Remove the old update-only checkbox from the combined workflow.
const importHeading=main.indexOf("pageTitle('MATCH + ANALYSIS IMPORT'");
const importInput=main.indexOf("const input=document.querySelector('#analysis-import-file')",importHeading);
if(importHeading<0||importInput<0)throw Error('Could not scope combined importer UI');
let importUi=main.slice(importHeading,importInput);
importUi=importUi.replace(/<label class=\\?"mc-check\\?"[\s\S]*?<\/label>/,'');
main=main.slice(0,importHeading)+importUi+main.slice(importInput);

main=replaceOnce(main,"const r=entry.value,eg=r?.analysis?.expected_goals;",
"const r=entry.value,eg=r?.analysis?.expected_goals;if(!r?.match?.kickoff_at||!Number.isFinite(Date.parse(r.match.kickoff_at)))throw Error('ต้องระบุวันและเวลาแข่งขันที่ถูกต้องก่อนสร้าง Match ID');",
'require valid kickoff');
main=replaceOnce(main,
"const ids=items.map(x=>x.report.report_id),keys=items.map(x=>[x.report.match.competition,x.report.match.home_team,x.report.match.away_team].map(s=>String(s).trim().toLowerCase()).join('|'));",
"const ids=items.map(x=>x.report.report_id),keys=items.map(x=>[x.report.match.competition,x.report.match.home_team,x.report.match.away_team,new Date(x.report.match.kickoff_at).toISOString()].map(s=>String(s).trim().toLowerCase()).join('|'));",
'fixture uniqueness includes kickoff');
main=replaceOnce(main,
"const updateExistingOnly=document.querySelector('#analysis-import-existing-only')?.checked!==false;",
"const updateExistingOnly=false;",
'combined import auto-create mode');
main=replaceOnce(main,
"&&(!updateExistingOnly||sameKickoff(x.kickoffAt,report.match.kickoff_at))",
"&&sameKickoff(x.kickoffAt,report.match.kickoff_at)",
'exact kickoff matching');
main=replaceOnce(main,
"(updateExistingOnly?'โหมดปลอดภัย: ทุกคู่เชื่อมกับ Match ID เดิมเท่านั้น และเพิ่มเฉพาะบทวิเคราะห์เวอร์ชันใหม่':'โหมดทั่วไป: อาจสร้างแมตช์ใหม่สำหรับคู่ที่ไม่พบ')",
"'โหมดรวม: ใช้ Match ID เดิมเมื่อรายการแข่งขัน ทีม และเวลาเตะตรงกัน หรือสร้าง Match ID ใหม่เมื่อไม่พบแมตช์เดิม'",
'combined mode preview note');

// Re-check both reused and newly-created fixture identities immediately before the one IndexedDB transaction.
const oldGuard="if(updateExistingOnly&&plan.some(x=>!x.match||!latest.matches.some(m=>m.id===x.match.id)))throw Error('แมตช์เดิมเปลี่ยนแปลงหรือไม่พบแล้ว กรุณาตรวจสอบใหม่ · ไม่มีการบันทึกข้อมูล');";
const newGuard=oldGuard+"for(const item of plan){const candidates=latest.matches.filter(x=>sameCompetition(x.league,item.report.match.competition)&&normTeam(x.homeTeam)===normTeam(item.report.match.home_team)&&normTeam(x.awayTeam)===normTeam(item.report.match.away_team)&&sameKickoff(x.kickoffAt,item.report.match.kickoff_at));if(item.match?!candidates.some(x=>x.id===item.match.id):candidates.length)throw Error('รายการแข่งขันเปลี่ยนแปลงระหว่างตรวจสอบ กรุณาเลือกไฟล์อีกครั้ง · ไม่มีการบันทึกข้อมูล');}";
main=replaceOnce(main,oldGuard,newGuard,'concurrent fixture identity check');
main=replaceOnce(main,"});\\n      const pct=x=>x==null?'—':(Number(x)*100).toFixed(1)+'%';",
"});\\n      for(let i=0;i<plan.length;i++)for(let j=i+1;j<plan.length;j++){const a=plan[i].report.match,b=plan[j].report.match;if(sameCompetition(a.competition,b.competition)&&normTeam(a.home_team)===normTeam(b.home_team)&&normTeam(a.away_team)===normTeam(b.away_team)&&sameKickoff(a.kickoff_at,b.kickoff_at))throw Error('พบโปรแกรมแข่งขันซ้ำในไฟล์ แม้ชื่อรายการจะต่างรูปแบบกัน: '+a.home_team+' vs '+a.away_team); }\\n      const pct=x=>x==null?'—':(Number(x)*100).toFixed(1)+'%';",
'normalized duplicate fixture rejection');

main=replaceOnce(main,
"'นำเข้าสำเร็จครบ '+items.length+' คู่ · อัปเดตรายงานเดิม '+updatedReports+' รายงาน'",
"'นำเข้าสำเร็จครบ '+items.length+' คู่ · สร้าง Match ID ใหม่ '+plan.filter(x=>!x.match).length+' คู่ · ใช้ Match ID เดิม '+plan.filter(x=>!!x.match).length+' คู่ · เพิ่มเวอร์ชันรายงานเดิม '+updatedReports+' รายงาน'",
'import completion summary');
main=replaceOnce(main,
"'บันทึกครบ '+items.length+' คู่แล้ว · อัปเดตรายงาน report_id เดิม '+updatedReports+' รายการด้วยบทวิเคราะห์เวอร์ชันใหม่ · ใช้ Match ID เดิม · เก็บประวัติทุกเวอร์ชัน และไม่เขียนทับผลการแข่งขันหรือคำทำนายเดิม'",
"'บันทึกครบ '+items.length+' คู่แล้ว · สร้าง Match ID ใหม่ '+plan.filter(x=>!x.match).length+' คู่ · ใช้ Match ID เดิม '+plan.filter(x=>!!x.match).length+' คู่ · เพิ่มเวอร์ชัน report_id เดิม '+updatedReports+' รายการ · เก็บประวัติเดิมและไม่เขียนทับผลการแข่งขัน'",
'import completion details');

main=main.replace("const APP_VERSION='3.3';","const APP_VERSION='3.4';")
 .replace("const PREVIOUS_APP_VERSION='3.2';","const PREVIOUS_APP_VERSION='3.3';")
 .replaceAll('FOOTBALL RICH · BLACK & GOLD · V3.3','FOOTBALL RICH · BLACK & GOLD · V3.4')
 .replace('<span class="tag">V3.3</span>','<span class="tag">V3.4</span>');
html=html.replaceAll('main.js?v=20261116-v3-3','main.js?v=20261116-v3-4');
sw=sw.replaceAll('football-rich-shell-v49','football-rich-shell-v50');
version.version='3.4';version.previous_version='3.3';version.release='V3.4-beta.1';
css+='\n/* V3.4 combined fixture + analysis import */\n.tools-grid{grid-template-columns:repeat(2,minmax(0,1fr))}@media(max-width:700px){.tools-grid{grid-template-columns:minmax(0,1fr)}}\n';

const toolsBlock=main.slice(toolsStart,main.indexOf("else if (currentView === 'import') {",toolsStart));
if((toolsBlock.match(/data-tool-target=/g)||[]).length!==2||!toolsBlock.includes('นำเข้าโปรแกรมพร้อมบทวิเคราะห์'))throw Error('Tools Center must expose exactly two tools');
for(const marker of ["MATCH + ANALYSIS IMPORT","football-rich-analysis-batch","sameKickoff(x.kickoffAt,report.match.kickoff_at)","สร้าง Match ID ใหม่","result-import-file","currentView === 'result-import'"])if(!main.includes(marker))throw Error('V3.4 combined importer marker missing: '+marker);
if(main.includes('fixture-import')||main.includes("currentView === 'fixture-import'"))throw Error('Old standalone Fixture Import remains visible');
if(main.includes('analysis-import-existing-only'))throw Error('Old update-only checkbox remains');
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear('))throw Error('Destructive database operation detected');
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);fs.writeFileSync(versionPath,JSON.stringify(version,null,2)+'\n');
console.log('V3.4 combined importer applied: one JSON workflow creates/reuses Match IDs and stores analyses atomically; Result Import remains separate.');
