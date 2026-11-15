
import fs from 'node:fs';
const mainPath='dist/main.js', cssPath='dist/styles/main.css', htmlPath='dist/index.html', swPath='dist/sw.js';
let main=fs.readFileSync(mainPath,'utf8'), css=fs.readFileSync(cssPath,'utf8'), html=fs.readFileSync(htmlPath,'utf8'), sw=fs.readFileSync(swPath,'utf8');
if(!main.includes("const APP_VERSION='1.24';")||!html.includes('main.js?v=20261116-v1-24')||!sw.includes('football-rich-shell-v32')) throw new Error('V1.25 expected V1.24 build anchors missing');
if(!main.includes('data-select-match')) throw new Error('V1.25 match buttons missing; renderer may have changed');
main=main.replaceAll('data-select-match=', 'data-open-match-detail=');
const at=main.indexOf('const matchForm');
const logic = [
"        root.insertAdjacentHTML('beforeend', '<div id=\"mc-detail-modal\" class=\"mc-detail-overlay\" hidden><section class=\"mc-detail-dialog\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"mc-detail-title\"><button type=\"button\" class=\"mc-detail-close\" data-detail-close aria-label=\"ปิด\">×</button><div id=\"mc-detail-content\"></div></section></div>');",
"        const detailModal=document.querySelector('#mc-detail-modal'), detailContent=document.querySelector('#mc-detail-content');",
"        let activeDetailMatchId='';",
"        const detailPercent=v=>typeof v==='number'&&Number.isFinite(v)?v.toFixed(1)+'%':'—';",
"        const openMatchDetail=matchId=>{",
"          const m=d.matches.find(x=>x.id===matchId); if(!m)return; activeDetailMatchId=matchId;",
"          const r=resultByMatch.get(m.id), a=latestAnalysis(m.id), p=latestPrediction(m.id), probs=a?.probabilities, rec=a?.recommendation, market=a?.marketSnapshot;",
"          const side=['home','away'].includes(rec?.selected_team)?rec.selected_team:['home','away'].includes(market?.selected_team)?market.selected_team:p?.snapshot?.selectedTeam;",
"          const line=rec?.handicap_line??market?.handicap_line??p?.selectedLine, cover=a?.coverProbability;",
"          const status=r?'จบแล้ว':(['LIVE','IN_PLAY'].includes(m.status)?'กำลังแข่ง':m.status==='CANCELLED'?'ยกเลิก':'รอแข่ง');",
"          const score=r?'<strong class=\"mc-detail-score\">'+Number(r.homeGoals)+' – '+Number(r.awayGoals)+'</strong>':'VS';",
"          const prob=probs?'<div class=\"mc-detail-probs\"><div><span>เจ้าบ้านชนะ</span><b>'+detailPercent(probs.homeWin)+'</b></div><div><span>เสมอ</span><b>'+detailPercent(probs.draw)+'</b></div><div><span>ทีมเยือนชนะ</span><b>'+detailPercent(probs.awayWin)+'</b></div></div>':'<p class=\"mc-muted\">ยังไม่มีข้อมูลความน่าจะเป็น 1X2</p>';",
"          const ah=side&&typeof line==='number'?'<div class=\"mc-detail-ah\"><span>ทีมต่อ</span><b>'+esc(side==='home'?m.homeTeam:m.awayTeam)+' '+Number(line).toFixed(2)+'</b><span>โอกาสผ่าน AH</span><b>'+(typeof cover==='number'?detailPercent(cover*100):'ข้อมูลไม่เพียงพอ')+'</b></div>':'<p class=\"mc-muted\">ยังไม่มีข้อมูลทีมต่อและเส้นแฮนดิแคปครบถ้วน</p>';",
"          let review=''; if(r){const actual=r.homeGoals>r.awayGoals?'homeWin':r.homeGoals<r.awayGoals?'awayWin':'draw', names={homeWin:'เจ้าบ้านชนะ',draw:'เสมอ',awayWin:'ทีมเยือนชนะ'}, keys=['homeWin','draw','awayWin']; const valid=probs&&keys.every(k=>typeof probs[k]==='number'); const top=valid?keys.reduce((best,k)=>probs[k]>probs[best]?k:best,keys[0]):null; review='<div class=\"mc-detail-review\"><b>ตรวจผลวิเคราะห์</b><p>'+(top?((top===actual?'✓ ':'✗ ')+'1X2: '+names[top]+(top===actual?' · ตรงผลจริง':' · ไม่ตรงผลจริง')):'ไม่มีข้อมูล 1X2 สำหรับประเมิน')+'</p></div>';}",
"          const events=Array.isArray(r?.events)?r.events:[], eventHtml=events.length?events.map(ev=>'<div class=\"mc-detail-event\"><span>'+esc(ev.minute||'—')+'</span><b>'+esc(ev.team==='home'?m.homeTeam:m.awayTeam)+'</b><p>'+esc(ev.scorer||'ไม่ระบุผู้ทำประตู')+(ev.assist?' · แอสซิสต์: '+esc(ev.assist):'')+'</p></div>').join(''):'<p class=\"mc-muted\">ไม่มีเหตุการณ์ที่บันทึกไว้</p>';",
"          const evidence=d.evidence.filter(x=>x.matchId===m.id), evidenceHtml=evidence.length?evidence.map(x=>'<li><b>'+esc(x.publisher||'แหล่งข้อมูล')+'</b> · '+esc(x.claim||'')+(x.url?' <a href=\"'+esc(x.url)+'\" target=\"_blank\" rel=\"noopener\">เปิดแหล่งข้อมูล</a>':'')+'</li>').join(''):'<li>ไม่มีหลักฐานที่แนบไว้</li>';",
"          const analysis=a?'<p>'+esc(a.summary||'ไม่มีสรุปการวิเคราะห์')+'</p><p class=\"mc-muted\">ความมั่นใจ: '+detailPercent(a.confidence)+' · '+esc(fmtDate(a.createdAt))+'</p><ul>'+evidenceHtml+'</ul>':'<p class=\"mc-muted\">ยังไม่มีบทวิเคราะห์ที่บันทึก</p>';",
"          const history=Array.isArray(r?.revisionHistory)?r.revisionHistory:[], historyHtml='<p>MATCH ID: '+esc(m.id)+'</p>'+(r?'<p>RESULT ID: '+esc(r.importResultId||'legacy')+'</p><p>แก้ไขผลแล้ว '+Math.max(0,Number(r.revisionNumber||1)-1)+' ครั้ง</p>':'<p>ยังไม่มี RESULT ID</p>')+(history.length?'<ol>'+history.slice().reverse().map(x=>'<li>'+Number(x.homeGoals)+'–'+Number(x.awayGoals)+' · '+esc(x.source||'ไม่ระบุแหล่ง')+' · '+esc(fmtDate(x.verifiedAt||x.recordedAt||''))+'</li>').join('')+'</ol>':'<p class=\"mc-muted\">ยังไม่มีประวัติแก้ไขผล</p>');",
"          detailContent.innerHTML='<div class=\"mc-detail-kicker\">'+esc(m.league)+' · '+esc(m.kickoffAt?fmtDate(m.kickoffAt):'ไม่ระบุเวลา')+'</div><div class=\"mc-detail-status\">'+status+'</div><h2 id=\"mc-detail-title\">'+esc(m.homeTeam)+' <span>'+score+'</span> '+esc(m.awayTeam)+'</h2><section class=\"mc-detail-summary\"><h3>ผลวิเคราะห์</h3>'+prob+ah+review+'</section><details class=\"mc-detail-accordion\"><summary>เหตุการณ์การแข่งขัน</summary>'+eventHtml+'</details><details class=\"mc-detail-accordion\"><summary>รายละเอียดการวิเคราะห์</summary>'+analysis+'</details><details class=\"mc-detail-accordion\"><summary>ประวัติและข้อมูลรายการ</summary>'+historyHtml+'</details><div class=\"mc-detail-actions\"><button type=\"button\" class=\"primary\" data-detail-analysis>เปิดหน้าวิเคราะห์</button></div>';",
"          detailModal.hidden=false; document.body.classList.add('mc-detail-open'); detailModal.querySelector('[data-detail-close]').focus();",
"        };",
"        root.querySelectorAll('[data-open-match-detail]').forEach(b=>b.addEventListener('click',()=>openMatchDetail(b.dataset.openMatchDetail||'')));",
"        const closeMatchDetail=()=>{detailModal.hidden=true;document.body.classList.remove('mc-detail-open');};",
"        detailModal.querySelector('[data-detail-close]').addEventListener('click',closeMatchDetail);",
"        detailModal.addEventListener('click',e=>{if(e.target===detailModal)closeMatchDetail();if(e.target.closest('[data-detail-analysis]')){const mid=activeDetailMatchId;closeMatchDetail();selectedMatchId=mid;switchView('analysis');}});",
"        document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!detailModal.hidden)closeMatchDetail();});"
].join('\n');
main=main.slice(0,at)+logic+'\n'+main.slice(at);
const cssPatch = [
"/* V1.25: compact expandable single-match detail window */",
".mc-detail-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(0,0,0,.78);backdrop-filter:blur(5px)}",
".mc-detail-overlay[hidden]{display:none!important}.mc-detail-dialog{position:relative;width:min(100%,620px);max-height:92dvh;overflow:auto;padding:18px 14px 14px;border:1px solid #70582b;border-radius:17px;background:#17140f;color:#e9e3d5;box-shadow:0 24px 80px #000b}",
".mc-detail-close{position:sticky;top:0;float:right;z-index:2;width:34px;height:34px;border:1px solid #66512b;border-radius:50%;background:#292315;color:#f4d27b;font-size:24px;line-height:1}",
".mc-detail-kicker{padding-right:40px;color:#b9a46f;font-size:11px}.mc-detail-status{display:inline-block;margin:9px 0;padding:4px 9px;border:1px solid #6a5428;border-radius:99px;color:#f4d27b;font-size:10px;font-weight:800}",
".mc-detail-dialog h2{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:7px;margin:4px 0 14px;color:#f4d27b;font-size:16px;line-height:1.4;text-align:center;overflow-wrap:anywhere}.mc-detail-dialog h2 span{color:#fff;font-size:19px;white-space:nowrap}",
".mc-detail-summary{padding:12px;border:1px solid #514226;border-radius:12px;background:#211d14}.mc-detail-summary h3{margin:0 0 9px;color:#f4d27b;font-size:14px}",
".mc-detail-probs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.mc-detail-probs>div{display:flex;flex-direction:column;gap:4px;padding:8px 4px;border-radius:8px;background:#302719;text-align:center}.mc-detail-probs span,.mc-detail-ah span{color:#b9b1a2;font-size:10px}.mc-detail-probs b{color:#f4d27b;font-size:15px}",
".mc-detail-ah{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 9px;margin-top:9px;padding-top:9px;border-top:1px solid #514226}.mc-detail-ah b{color:#f4d27b;font-size:12px;text-align:right;overflow-wrap:anywhere}",
".mc-detail-review{margin-top:9px;padding:9px;border-radius:8px;background:#302719;font-size:12px}.mc-detail-review b{color:#f4d27b}.mc-detail-review p{margin:5px 0 0}",
".mc-detail-accordion{margin-top:8px;border:1px solid #514226;border-radius:10px;background:#1d1912}.mc-detail-accordion summary{padding:11px;color:#f4d27b;font-size:12px;font-weight:750;cursor:pointer}.mc-detail-accordion>p,.mc-detail-accordion>ul,.mc-detail-accordion>ol{margin:0;padding:0 13px 12px;font-size:11px;line-height:1.7;overflow-wrap:anywhere}.mc-detail-accordion li{margin:4px 0}",
".mc-detail-event{display:grid;grid-template-columns:34px minmax(0,1fr);gap:3px 7px;padding:8px 11px;border-top:1px solid #40351f;font-size:11px}.mc-detail-event>span{color:#f4d27b;font-weight:800}.mc-detail-event>b{overflow-wrap:anywhere}.mc-detail-event>p{grid-column:2;margin:0;color:#b9b1a2}.mc-detail-actions{display:flex;justify-content:flex-end;margin-top:13px}body.mc-detail-open{overflow:hidden}",
"@media(max-width:420px){.mc-detail-overlay{padding:6px}.mc-detail-dialog{max-height:95dvh;padding:15px 10px 11px}.mc-detail-dialog h2{font-size:14px;gap:4px}.mc-detail-dialog h2 span{font-size:17px}.mc-detail-probs span{font-size:9px}.mc-detail-probs b{font-size:13px}}"
].join('\n');
if(!css.includes('V1.25: compact expandable single-match detail window'))css+='\n'+cssPatch;
main=main.replace("const APP_VERSION='1.24';","const APP_VERSION='1.25';").replace("const PREVIOUS_APP_VERSION='1.23';","const PREVIOUS_APP_VERSION='1.24';");
html=html.replace('main.js?v=20261116-v1-24','main.js?v=20261116-v1-25');
sw=sw.replaceAll('football-rich-shell-v32','football-rich-shell-v33');
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.25',release:'V1.25'}));
for(const f of ['mc-detail-modal','openMatchDetail','data-open-match-detail','mc-detail-accordion','activeDetailMatchId'])if(!main.includes(f))throw new Error('V1.25 modal feature missing: '+f);
for(const f of ['V1.25: compact expandable single-match detail window','.mc-detail-overlay','.mc-detail-accordion','body.mc-detail-open'])if(!css.includes(f))throw new Error('V1.25 modal CSS missing: '+f);
if(!html.includes('main.js?v=20261116-v1-25')||!sw.includes('football-rich-shell-v33')||main.includes('data-select-match='))throw new Error('V1.25 version/cache/button audit failed');
console.log('V1.25 detail window audit passed; stores, schema, calculations and imports untouched.');
