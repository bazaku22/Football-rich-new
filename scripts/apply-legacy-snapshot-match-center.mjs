import fs from 'node:fs';

const root='football-rich-v1/dist';
const mainPath=root+'/main.js', cssPath=root+'/styles/main.css';
const htmlPath=root+'/index.html', swPath=root+'/sw.js', versionPath=root+'/app-version.json';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));

if(version.version!=='3.9.6' ||
   !main.includes("const APP_VERSION='3.9.6';") ||
   !html.includes('main.js?v=20261116-v3-9-6') ||
   !sw.includes("const CACHE_NAME = 'football-rich-shell-v61'")) {
  throw new Error('Expected V3.9.6 build anchors missing; no changes applied');
}
if(!main.includes('const card=m=>{') ||
   !main.includes('footballTimeLegacyResultSnapshot') ||
   !main.includes('const results=new Map(d.results.map(r=>[r.matchId,r]));')) {
  throw new Error('Match Center or Legacy Snapshot source missing');
}

// Legacy is display-only. Keep r bound exclusively to verified d.results so all
// forecast checks and event rendering remain restricted to verified results.
const oldRead="const a=latest(m.id),r=results.get(m.id),p=a?.probabilities,market=a?.marketSnapshot,rec=a?.recommendation,side=";
const newRead="const a=latest(m.id),r=results.get(m.id),legacy=m.footballTimeLegacyResultSnapshot||null,legacyValid=!r&&legacy?.status==='FINISHED'&&legacy?.verification_status==='not_independently_verified'&&legacy?.evidence?.classification==='legacy_database_snapshot'&&legacy?.evidence?.revision_history_available===false&&Number.isInteger(legacy?.home_score)&&legacy.home_score>=0&&Number.isInteger(legacy?.away_score)&&legacy.away_score>=0,p=a?.probabilities,market=a?.marketSnapshot,rec=a?.recommendation,side=";
if(!main.includes(oldRead)) throw new Error('V2.4 card result binding anchor missing');
main=main.replace(oldRead,newRead);

const oldStatus="const status=r?'จบแล้ว':m.status==='LIVE'||m.status==='IN_PLAY'?'กำลังแข่งขัน':m.status==='FINISHED'?'รอยืนยันผล':m.status==='CANCELLED'?'ยกเลิก':'รอแข่งขัน';";
const newStatus="const status=r?'จบแล้ว':legacyValid?'จบแล้ว · Legacy':m.status==='LIVE'||m.status==='IN_PLAY'?'กำลังแข่งขัน':m.status==='FINISHED'?'รอยืนยันผล':m.status==='CANCELLED'?'ยกเลิก':'รอแข่งขัน';";
if(!main.includes(oldStatus)) throw new Error('Match status anchor missing');
main=main.replace(oldStatus,newStatus);
const oldClass="const statusClass=r?'finished':m.status==='LIVE'||m.status==='IN_PLAY'?'live':m.status==='CANCELLED'?'cancelled':'waiting';";
const newClass="const statusClass=r?'finished':legacyValid?'legacy':m.status==='LIVE'||m.status==='IN_PLAY'?'live':m.status==='CANCELLED'?'cancelled':'waiting';";
if(!main.includes(oldClass)) throw new Error('Match status class anchor missing');
main=main.replace(oldClass,newClass);

const oldScore="(r?Number(r.homeGoals)+' – '+Number(r.awayGoals):'VS')";
const newScore="(r?Number(r.homeGoals)+' – '+Number(r.awayGoals):legacyValid?Number(legacy.home_score)+' – '+Number(legacy.away_score):'VS')";
if(!main.includes(oldScore)) throw new Error('Match score renderer anchor missing');
main=main.replace(oldScore,newScore);

const oldSource="+(r?'<p>แหล่งยืนยันผล: '+esc(r.source||'ไม่ระบุ')+'</p>'+eventHtml:'')+'</div></details>';";
const newSource="+(r?'<p>แหล่งยืนยันผล: '+esc(r.source||'ไม่ระบุ')+'</p>'+eventHtml:legacyValid?'<p class=\"v21-muted\">แหล่งข้อมูล: Football Time · Legacy Snapshot · ยังไม่ได้ตรวจสอบอิสระ · ไม่รวมใน Verified Performance</p>':'')+'</div></details>';";
if(!main.includes(oldSource)) throw new Error('Match details source anchor missing');
main=main.replace(oldSource,newSource);

main=main.replace("const APP_VERSION='3.9.6';","const APP_VERSION='3.9.7';")
  .replace("const PREVIOUS_APP_VERSION='3.9.5';","const PREVIOUS_APP_VERSION='3.9.6';")
  .replaceAll('FOOTBALL RICH · BLACK & GOLD · V3.9.6','FOOTBALL RICH · BLACK & GOLD · V3.9.7')
  .replace('<span class="tag">V3.9.6</span>','<span class="tag">V3.9.7</span>');
html=html.replaceAll('main.js?v=20261116-v3-9-6','main.js?v=20261116-v3-9-7');
sw=sw.replace("const CACHE_NAME = 'football-rich-shell-v61'","const CACHE_NAME = 'football-rich-shell-v62'");
version.previous_version='3.9.6';version.version='3.9.7';version.release='V3.9.7-beta.1';
css+='\n/* V3.9.7: Legacy Snapshot scores are display-only and visually distinct from verified results */\n.v24-status.legacy{color:#e8c982;background:#302719;border:1px dashed #8b713c}\n';
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);fs.writeFileSync(versionPath,JSON.stringify(version,null,2)+'\n');

if(!main.includes("const APP_VERSION='3.9.7';") ||
   !main.includes("legacyValid?'จบแล้ว · Legacy'") ||
   !main.includes("legacyValid?Number(legacy.home_score)+' – '+Number(legacy.away_score)") ||
   !main.includes('ยังไม่ได้ตรวจสอบอิสระ · ไม่รวมใน Verified Performance') ||
   !html.includes('main.js?v=20261116-v3-9-7') ||
   !sw.includes("const CACHE_NAME = 'football-rich-shell-v62'")) {
  throw new Error('V3.9.7 Legacy display audit failed');
}
if(main.includes('legacy.home_score') && main.includes('if(legacyValid){\n   const predicted')) {
  throw new Error('Legacy result must never enter prediction evaluation');
}
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear(')) {
  throw new Error('Destructive database operation detected');
}
console.log('V3.9.7: Legacy Snapshot scores/status shown separately; prediction evaluation remains verified-only.');
