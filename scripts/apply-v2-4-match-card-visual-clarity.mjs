import fs from 'node:fs';
const mainPath='dist/main.js',cssPath='dist/styles/main.css',htmlPath='dist/index.html',swPath='dist/sw.js';
let main=fs.readFileSync(mainPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),html=fs.readFileSync(htmlPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
if(!main.includes("const APP_VERSION='2.3';")||!html.includes('main.js?v=20261116-v2-3')||!sw.includes("const CACHE_NAME = 'football-rich-shell-v44'"))throw Error('V2.4 expected V2.3 build anchors missing');
const cardStart=main.indexOf(' const card=m=>{');
const cardEnd=main.indexOf(' const count=k=>',cardStart);
if(cardStart<0||cardEnd<=cardStart)throw Error('V2.1 Match Center card renderer boundaries missing');
const card=String.raw` const actualOutcome=(home,away)=>Number(home)>Number(away)?'home':Number(home)<Number(away)?'away':'draw';
 const forecastOutcome=p=>{
  if(!p||!['homeWin','draw','awayWin'].every(k=>Number.isFinite(Number(p[k]))))return '';
  return ['home','draw','away'].reduce((best,k)=>Number(p[k==='home'?'homeWin':k==='away'?'awayWin':'draw'])>Number(p[best==='home'?'homeWin':best==='away'?'awayWin':'draw'])?k:best,'home');
 };
 const settleLine=(goalDiff,line)=>{
  if(!Number.isFinite(goalDiff)||!Number.isFinite(line))return 'unknown';
  const quarter=Math.abs(line*4-Math.round(line*4))<0.0001&&Math.abs(Math.round(line*4)%2)===1;
  const parts=quarter?[line-0.25,line+0.25]:[line];
  const outcomes=parts.map(x=>goalDiff+x>0.00001?'W':goalDiff+x< -0.00001?'L':'P');
  const wins=outcomes.filter(x=>x==='W').length,losses=outcomes.filter(x=>x==='L').length;
  if(wins===outcomes.length)return 'win';
  if(losses===outcomes.length)return 'loss';
  if(wins&&outcomes.includes('P'))return 'halfwin';
  if(losses&&outcomes.includes('P'))return 'halfloss';
  return 'push';
 };
 const checkMark=(state)=>state==='win'||state==='halfwin'?'<span class="v24-symbol win" aria-label="ผ่าน">✓</span>':state==='push'?'<span class="v24-symbol push" aria-label="คืนทุน">=</span>':state==='loss'||state==='halfloss'?'<span class="v24-symbol loss" aria-label="ไม่ผ่าน">✕</span>':'<span class="v24-symbol unknown" aria-label="ไม่มีข้อมูล">—</span>';
 const card=m=>{
  const a=latest(m.id),r=results.get(m.id),p=a?.probabilities,market=a?.marketSnapshot,rec=a?.recommendation,side=['home','away'].includes(rec?.selected_team)?rec.selected_team:market?.selected_team,line=typeof rec?.handicap_line==='number'?rec.handicap_line:typeof market?.handicap_line==='number'?market.handicap_line:NaN,cover=a?.coverProbability,level=risk(a?.riskLevel||a?.sourceReport?.analysis?.risk_level);
  const status=r?'จบแล้ว':m.status==='LIVE'||m.status==='IN_PLAY'?'กำลังแข่งขัน':m.status==='FINISHED'?'รอยืนยันผล':m.status==='CANCELLED'?'ยกเลิก':'รอแข่งขัน';
  const statusClass=r?'finished':m.status==='LIVE'||m.status==='IN_PLAY'?'live':m.status==='CANCELLED'?'cancelled':'waiting';
  const time=m.kickoffAt?new Intl.DateTimeFormat('th-TH',{hour:'2-digit',minute:'2-digit'}).format(new Date(m.kickoffAt)):'ไม่ระบุเวลา';
  const selected=side==='home'?m.homeTeam:side==='away'?m.awayTeam:'ไม่ระบุทีมต่อ';
  const probs=p?'<div class="v21-probs v24-probs">'+[['เจ้าบ้านชนะ',p.homeWin,'home'],['เสมอ',p.draw,'draw'],['ทีมเยือนชนะ',p.awayWin,'away']].map(([n,v,c])=>'<div class="v24-prob '+c+'"><small>'+n+'</small><b>'+pct(v)+'</b></div>').join('')+'</div>':'<p class="v21-empty-data">ยังไม่มีเปอร์เซ็นต์ 1X2</p>';
  const ah=side==='home'||side==='away'?'<div class="v21-ah"><div><small>แฮนดิแคป</small><b>'+esc(selected)+' '+(Number.isFinite(line)?line.toFixed(2):'—')+'</b></div><div><small>โอกาสผ่าน AH</small><b class="v21-cover">'+(typeof cover==='number'?(cover*100).toFixed(1)+'%':'ข้อมูลไม่เพียงพอ')+'</b></div></div>':'<p class="v21-empty-data">ยังไม่มีข้อมูลทีมต่อและเส้นแฮนดิแคป</p>';
  let review='';
  if(r){
   const predicted=forecastOutcome(p),actual=actualOutcome(r.homeGoals,r.awayGoals),oneX2=predicted?(predicted===actual?'win':'loss'):'unknown';
   const oneX2Text=predicted?('คาดการณ์: '+(predicted==='home'?'เจ้าบ้านชนะ':predicted==='draw'?'เสมอ':'ทีมเยือนชนะ')+' · ผลจริง: '+(actual==='home'?'เจ้าบ้านชนะ':actual==='draw'?'เสมอ':'ทีมเยือนชนะ')):'ไม่มีข้อมูลคาดการณ์ 1X2';
   let ahState='unknown',ahText='ไม่มีข้อมูลราคาแฮนดิแคปสำหรับตรวจสอบ';
   if((side==='home'||side==='away')&&Number.isFinite(line)){
    const diff=side==='home'?Number(r.homeGoals)-Number(r.awayGoals):Number(r.awayGoals)-Number(r.homeGoals);
    ahState=settleLine(diff,line);
    ahText=selected+' '+(line>0?'+':'')+line.toFixed(2)+' · '+(ahState==='win'?'ผ่านเต็ม':ahState==='halfwin'?'ผ่านครึ่ง':ahState==='push'?'คืนทุน':ahState==='halfloss'?'เสียครึ่ง':ahState==='loss'?'ไม่ผ่าน':'ตรวจสอบไม่ได้');
   }
   review='<section class="v24-review"><div class="v24-review-title">สรุปผลการคาดการณ์</div><div class="v24-review-row">'+checkMark(oneX2)+'<div><b>ตรวจสอบผล 1X2</b><small>'+oneX2Text+'</small></div></div><div class="v24-review-row">'+checkMark(ahState)+'<div><b>ตรวจสอบแฮนดิแคป</b><small>'+ahText+'</small></div></div></section>';
  }
  const events=Array.isArray(r?.events)?r.events:[],eventHtml=events.length?events.map(e=>'<div><time>'+esc(e.minute||'—')+'</time><span>'+esc(e.type==='yellow_card'?'🟨 ใบเหลือง':e.type==='red_card'?'🟥 ใบแดง':'⚽ ประตู')+' · '+esc(e.team==='home'?m.homeTeam:m.awayTeam)+(e.scorer?' · '+esc(e.scorer):'')+(e.assist?' · แอสซิสต์ '+esc(e.assist):'')+'</span></div>').join(''):'<p class="v21-muted">ยังไม่มีรายละเอียดเหตุการณ์ที่ยืนยันได้</p>';
  const details='<details class="v21-details"><summary>ดูรายละเอียดเพิ่มเติม</summary><div>'+(a?.summary?'<p>'+esc(a.summary)+'</p>':'<p class="v21-muted">ยังไม่มีสรุปบทวิเคราะห์</p>')+'<p>สถานะข้อมูล: '+(a?.probabilityStatus==='insufficient_data'?'ข้อมูลไม่เพียงพอ':a?'มีบทวิเคราะห์':'ยังไม่มีบทวิเคราะห์')+'</p><p>อัปเดต: '+(a?.createdAt?esc(fmtDate(a.createdAt)):'—')+'</p>'+(r?'<p>แหล่งยืนยันผล: '+esc(r.source||'ไม่ระบุ')+'</p>'+eventHtml:'')+'</div></details>';
  return '<article class="panel v21-card v24-card"><div class="v21-top"><span>'+esc(m.league||'ไม่ระบุรายการ')+'</span><span>'+time+' · <b class="v24-status '+statusClass+'">'+status+'</b></span></div><div class="v21-teams"><div>'+mark(m.homeTeam)+'<b>'+esc(m.homeTeam)+'</b></div><strong>'+(r?Number(r.homeGoals)+' – '+Number(r.awayGoals):'VS')+'</strong><div>'+mark(m.awayTeam)+'<b>'+esc(m.awayTeam)+'</b></div></div><small class="v21-label">โอกาสผลการแข่งขัน 1X2</small>'+probs+ah+review+'<div class="v21-bottom"><span class="v21-risk '+level[1]+'">ความเสี่ยง '+level[0]+'</span><small>Match ID · '+esc(m.id)+'</small></div>'+details+'</article>';
 };
`;
main=main.slice(0,cardStart)+card+main.slice(cardEnd);
main=main.replace("const APP_VERSION='2.3';","const APP_VERSION='2.4';")
 .replace("const PREVIOUS_APP_VERSION='2.2';","const PREVIOUS_APP_VERSION='2.3';")
 .replaceAll('FOOTBALL RICH · BLACK & GOLD · V2.3','FOOTBALL RICH · BLACK & GOLD · V2.4')
 .replace('<span class="tag">V2.3</span>','<span class="tag">V2.4</span>');
css += String.raw`
/* V2.4 Match Center visual clarity */
.v24-card{font-family:"Noto Sans Thai","Inter",system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif}
.v24-status{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap}
.v24-status.finished{color:#9be4b5;background:#153b2b;border:1px solid #286b4a}
.v24-status.waiting{color:#f5d77c;background:#443716;border:1px solid #79612a}
.v24-status.live{color:#ffaaa5;background:#482326;border:1px solid #814047}
.v24-status.cancelled{color:#c8c1b5;background:#302d28;border:1px solid #514b40}
.v24-probs>div{border-width:1px}
.v24-probs>.home{background:linear-gradient(160deg,#173c2d,#14251e);border-color:#286b4a}
.v24-probs>.home b{color:#8fe0ae}
.v24-probs>.home small{color:#b8d9c5}
.v24-probs>.draw{background:linear-gradient(160deg,#433717,#282112);border-color:#80662a}
.v24-probs>.draw b{color:#f5d77c}
.v24-probs>.draw small{color:#e4d39d}
.v24-probs>.away{background:linear-gradient(160deg,#1d3450,#172333);border-color:#345b86}
.v24-probs>.away b{color:#91c5ff}
.v24-probs>.away small{color:#c0d8f2}
.v24-review{display:grid;gap:8px;margin-top:10px;padding:11px;border:1px solid #514226;border-radius:11px;background:linear-gradient(145deg,#211d14,#171510)}
.v24-review-title{font-size:11px;font-weight:800;color:#f4d27b;padding-bottom:5px;border-bottom:1px solid #40351f}
.v24-review-row{display:flex;align-items:center;gap:9px;min-width:0}
.v24-review-row>div{display:flex;min-width:0;flex-direction:column;gap:2px}
.v24-review-row b{font-size:11px;color:#e9e3d5}
.v24-review-row small{font-size:9px;color:#a99d83;line-height:1.5;overflow-wrap:anywhere}
.v24-symbol{display:inline-flex;align-items:center;justify-content:center;width:27px;height:27px;flex:0 0 27px;border-radius:50%;font-family:system-ui,sans-serif;font-size:19px;font-weight:900;line-height:1}
.v24-symbol.win{color:#8fe0ae;background:#153b2b}
.v24-symbol.push{color:#f5d77c;background:#443716}
.v24-symbol.loss{color:#ffaaa5;background:#482326}
.v24-symbol.unknown{color:#b9b1a2;background:#302d28}
body{font-family:"Noto Sans Thai","Inter",system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif}
button,input,select,textarea{font:inherit}
h1,h2,h3,h4,.panel-title,.section-title{font-family:"Noto Sans Thai","Inter",system-ui,sans-serif;letter-spacing:0}
`;
html=html.replace('main.js?v=20261116-v2-3','main.js?v=20261116-v2-4');
if(!html.includes('Noto Sans Thai'))html=html.replace('</head>','<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap" rel="stylesheet"></head>');
sw=sw.replaceAll('football-rich-shell-v44','football-rich-shell-v45');
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'2.4',release:'V2.4'}));
for(const marker of ["const APP_VERSION='2.4';",'v24-review','v24-status','v24-symbol','actualOutcome','forecastOutcome','settleLine'])if(!main.includes(marker))throw Error('V2.4 audit missing '+marker);
for(const marker of ['.v24-probs>.home','.v24-probs>.draw','.v24-probs>.away','.v24-status.finished','.v24-status.waiting','.v24-review','.v24-symbol.win','.v24-symbol.push','.v24-symbol.loss','Noto Sans Thai'])if(!css.includes(marker)&&!html.includes(marker))throw Error('V2.4 style audit missing '+marker);
if(!html.includes('main.js?v=20261116-v2-4')||!sw.includes("football-rich-shell-v45"))throw Error('V2.4 cache-busting audit failed');
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear('))throw Error('Destructive database operation detected');
console.log('V2.4 applied: color-coded 1X2, clear match status, 1X2/AH result checks, Thai-first typography; match data preserved.');
