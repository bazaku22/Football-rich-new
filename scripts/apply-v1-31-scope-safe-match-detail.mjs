import fs from 'node:fs';
const mainPath='dist/main.js', htmlPath='dist/index.html', swPath='dist/sw.js', versionPath='dist/app-version.json';
let main=fs.readFileSync(mainPath,'utf8'), html=fs.readFileSync(htmlPath,'utf8'), sw=fs.readFileSync(swPath,'utf8');
if(!main.includes("const APP_VERSION='1.30';") || !html.includes('main.js?v=20261116-v1-30') || !sw.includes("const CACHE_NAME = 'football-rich-shell-v38'")) throw new Error('V1.31 expected V1.30 build anchors missing');
const startMarker='window.__footballRichOpenMatchDetail = matchId => {';
const endMarker='        // V1.27: match detail buttons call the exposed handler directly.';
const start=main.indexOf(startMarker), end=main.indexOf(endMarker,start);
if(start<0 || end<0 || end<=start) throw new Error('V1.30 global match detail handler boundaries not found');
const replacement = String.raw`window.__footballRichOpenMatchDetail = async matchId => {
          const requestId=++detailRequestId;
          if(!detailModal.open) detailModal.showModal();
          document.body.classList.add('mc-detail-open');
          detailContent.textContent='กำลังโหลดรายละเอียดแมตช์…';
          try {
            const d=await records();
            const m=d.matches.find(x=>String(x.id)===String(matchId));
            if(!m) { detailContent.textContent='ไม่พบข้อมูลแมตช์นี้ในอุปกรณ์'; return; }
            const resultByMatch=new Map(d.results.map(x=>[x.matchId,x]));
            const r=resultByMatch.get(m.id);
            const latestAnalysis=id=>d.analyses.filter(x=>x.matchId===id).slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
            const latestPrediction=id=>d.predictions.filter(x=>x.matchId===id).slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
            const a=latestAnalysis(m.id), p=latestPrediction(m.id), probs=a?.probabilities, rec=a?.recommendation, market=a?.marketSnapshot;
            const side=['home','away'].includes(rec?.selected_team)?rec.selected_team:['home','away'].includes(market?.selected_team)?market.selected_team:p?.snapshot?.selectedTeam;
            const line=rec?.handicap_line??market?.handicap_line??p?.selectedLine, cover=a?.coverProbability;
            const status=r?'จบแล้ว':(['LIVE','IN_PLAY','INPLAY','1H','2H','HT','ET','PEN','PAUSED'].includes(String(m.status||'').toUpperCase())?'กำลังแข่ง':m.status==='CANCELLED'?'ยกเลิก':'รอแข่ง');
            const score=r?'<strong class="mc-detail-score">'+Number(r.homeGoals)+' – '+Number(r.awayGoals)+'</strong>':'VS';
            const detailPercent=v=>typeof v==='number'&&Number.isFinite(v)?v.toFixed(1)+'%':'—';
            const prob=probs?'<div class="mc-detail-probs"><div><span>เจ้าบ้านชนะ</span><b>'+detailPercent(probs.homeWin)+'</b></div><div><span>เสมอ</span><b>'+detailPercent(probs.draw)+'</b></div><div><span>ทีมเยือนชนะ</span><b>'+detailPercent(probs.awayWin)+'</b></div></div>':'<p class="mc-muted">ยังไม่มีข้อมูลความน่าจะเป็น 1X2</p>';
            const ah=side&&typeof line==='number'?'<div class="mc-detail-ah"><span>ทีมต่อ</span><b>'+esc(side==='home'?m.homeTeam:m.awayTeam)+' '+Number(line).toFixed(2)+'</b><span>โอกาสผ่าน AH</span><b>'+(typeof cover==='number'?detailPercent(cover*100):'ข้อมูลไม่เพียงพอ')+'</b></div>':'<p class="mc-muted">ยังไม่มีข้อมูลทีมต่อและเส้นแฮนดิแคปครบถ้วน</p>';
            let review='';
            if(r) {
              const actual=r.homeGoals>r.awayGoals?'homeWin':r.homeGoals<r.awayGoals?'awayWin':'draw';
              const names={homeWin:'เจ้าบ้านชนะ',draw:'เสมอ',awayWin:'ทีมเยือนชนะ'}, keys=['homeWin','draw','awayWin'];
              const valid=probs&&keys.every(k=>typeof probs[k]==='number');
              const top=valid?keys.reduce((best,k)=>probs[k]>probs[best]?k:best,keys[0]):null;
              review='<div class="mc-detail-review"><b>ตรวจผลวิเคราะห์</b><p>'+(top?((top===actual?'✓ ':'✗ ')+'1X2: '+names[top]+(top===actual?' · ตรงผลจริง':' · ไม่ตรงผลจริง')):'ไม่มีข้อมูล 1X2 สำหรับประเมิน')+'</p></div>';
            }
            const events=Array.isArray(r?.events)?r.events:[];
            const eventLabel=ev=>ev.type==='yellow_card'?'🟨 ใบเหลือง':ev.type==='red_card'?'🟥 ใบแดง':'⚽ ประตู';
            const eventHtml=events.length?events.map(ev=>'<div class="mc-detail-event"><span>'+esc(ev.minute||'—')+'</span><b>'+eventLabel(ev)+'</b><p>'+esc(ev.team==='home'?m.homeTeam:m.awayTeam)+(ev.scorer?' · '+esc(ev.scorer):'')+(ev.assist?' · แอสซิสต์: '+esc(ev.assist):'')+'</p></div>').join(''):'<p class="mc-muted">ไม่มีเหตุการณ์ที่บันทึกไว้</p>';
            const evidence=(d.evidence||[]).filter(x=>x.matchId===m.id);
            const evidenceHtml=evidence.length?evidence.map(x=>'<li><b>'+esc(x.publisher||'แหล่งข้อมูล')+'</b> · '+esc(x.claim||'')+(x.url?' <a href="'+esc(x.url)+'" target="_blank" rel="noopener">เปิดแหล่งข้อมูล</a>':'')+'</li>').join(''):'<li>ไม่มีหลักฐานที่แนบไว้</li>';
            const analysis=a?'<p>'+esc(a.summary||'ไม่มีสรุปการวิเคราะห์')+'</p><p class="mc-muted">ความมั่นใจ: '+detailPercent(a.confidence)+' · '+esc(fmtDate(a.createdAt))+'</p><ul>'+evidenceHtml+'</ul>':'<p class="mc-muted">ยังไม่มีบทวิเคราะห์ที่บันทึก</p>';
            const history=Array.isArray(r?.revisionHistory)?r.revisionHistory:[];
            const historyHtml='<p>MATCH ID: '+esc(m.id)+'</p>'+(r?'<p>RESULT ID: '+esc(r.importResultId||'legacy')+'</p><p>แก้ไขผลแล้ว '+Math.max(0,Number(r.revisionNumber||1)-1)+' ครั้ง</p>':'<p>ยังไม่มี RESULT ID</p>')+(history.length?'<ol>'+history.slice().reverse().map(x=>'<li>'+Number(x.homeGoals)+'–'+Number(x.awayGoals)+' · '+esc(x.source||'ไม่ระบุแหล่ง')+' · '+esc(fmtDate(x.verifiedAt||x.recordedAt||''))+'</li>').join('')+'</ol>':'<p class="mc-muted">ยังไม่มีประวัติแก้ไขผล</p>');
            if(requestId!==detailRequestId)return;
            detailContent.innerHTML='<div class="mc-detail-kicker">'+esc(m.league)+' · '+esc(m.kickoffAt?fmtDate(m.kickoffAt):'ไม่ระบุเวลา')+'</div><div class="mc-detail-status">'+status+'</div><h2 id="mc-detail-title">'+esc(m.homeTeam)+' <span>'+score+'</span> '+esc(m.awayTeam)+'</h2><section class="mc-detail-summary"><h3>ผลวิเคราะห์</h3>'+prob+ah+review+'</section><details class="mc-detail-accordion"><summary>เหตุการณ์การแข่งขัน</summary>'+eventHtml+'</details><details class="mc-detail-accordion"><summary>รายละเอียดการวิเคราะห์</summary>'+analysis+'</details><details class="mc-detail-accordion"><summary>ประวัติและข้อมูลรายการ</summary>'+historyHtml+'</details>';
            detailModal.querySelector('[data-detail-close]').focus();
          } catch(error) {
            console.error('Football rich V1.31 detail data load failed:',error);
            detailContent.textContent='โหลดรายละเอียดไม่สำเร็จ: '+(error instanceof Error?error.message:'เกิดข้อผิดพลาด');
          }
        };`;
main=main.slice(0,start)+replacement+main.slice(end);
const marker='/* V1.30: one stable capture handler for every Match Center detail button. */';
if(!main.includes(marker)) throw new Error('V1.30 delegated click handler marker missing');
main=main.replace(marker,'/* V1.31: scope-safe controller; detail reads its own current records snapshot. */\n        let detailRequestId=0;\n        '+marker);
main=main.replace("if(e.key==='Escape'&&!detailModal.hidden)closeMatchDetail();","if(e.key==='Escape'&&detailModal.open)closeMatchDetail();");
main=main.replace("const APP_VERSION='1.30';","const APP_VERSION='1.31';").replace("const PREVIOUS_APP_VERSION='1.29';","const PREVIOUS_APP_VERSION='1.30';");
html=html.replace('main.js?v=20261116-v1-30','main.js?v=20261116-v1-31');
sw=sw.replaceAll('football-rich-shell-v38','football-rich-shell-v39');
fs.writeFileSync(mainPath,main); fs.writeFileSync(htmlPath,html); fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify({version:'1.31',release:'V1.31'}));
for(const feature of ['V1.31: scope-safe controller','const d=await records();','detailModal.showModal()','detailRequestId','window.__footballRichOpenMatchDetail = async matchId =>']) if(!main.includes(feature)) throw new Error('V1.31 scope-safe detail feature missing: '+feature);
if(main.includes("const m=d.matches.find(x=>x.id===matchId); if(!m)return; activeDetailMatchId=matchId;")) throw new Error('V1.30 out-of-scope detail handler remains');
if(!html.includes('main.js?v=20261116-v1-31') || !sw.includes('football-rich-shell-v39')) throw new Error('V1.31 cache/version audit failed');
console.log('V1.31 scope-safe match detail controller applied; reads current IndexedDB records independently; no data writes, schema or calculation changes.');
