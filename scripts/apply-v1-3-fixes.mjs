import fs from 'node:fs';

const mainPath = 'dist/main.js';
const cssPath = 'dist/styles/main.css';
let main = fs.readFileSync(mainPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

const frProbabilityModel = (expectedGoals, selectedTeam, handicapLine) => {
  const poisson = (lambda, max = 20) => {
    if (!Number.isFinite(lambda) || lambda < 0 || lambda > 8) throw new RangeError('Expected goals must be between 0 and 8.');
    const values = [Math.exp(-lambda)];
    for (let k = 1; k <= max; k++) values[k] = values[k - 1] * lambda / k;
    return values;
  };
  const split = (line) => {
    if (![0,-0.25,-0.5,-0.75,-1,-1.25,-1.5,-1.75,-2].some(v => Math.abs(v - line) < 1e-9)) throw new RangeError('Unsupported Asian Handicap line.');
    if (Math.abs(line) < 1e-9) return [0, 0];
    if (Math.abs(line * 4) % 2 !== 1) return [line, line];
    const magnitude = Math.floor(Math.abs(line) * 2) / 2;
    return [magnitude === 0 ? 0 : -magnitude, -(magnitude + 0.5)];
  };
  const home = poisson(Number(expectedGoals.home));
  const away = poisson(Number(expectedGoals.away));
  const [lineA, lineB] = split(Number(handicapLine));
  const result = { home_win:0, draw:0, away_win:0, full_win:0, half_win:0, push:0, half_loss:0, full_loss:0 };
  let total = 0;
  const settle = (margin, line) => margin + line > 1e-9 ? 1 : margin + line < -1e-9 ? -1 : 0;
  for (let h = 0; h < home.length; h++) {
    for (let a = 0; a < away.length; a++) {
      const mass = home[h] * away[a];
      total += mass;
      if (h > a) result.home_win += mass;
      else if (h === a) result.draw += mass;
      else result.away_win += mass;
      const margin = selectedTeam === 'home' ? h - a : a - h;
      const outcomes = [settle(margin, lineA), settle(margin, lineB)];
      const wins = outcomes.filter(x => x === 1).length;
      const pushes = outcomes.filter(x => x === 0).length;
      const losses = outcomes.filter(x => x === -1).length;
      if (wins === 2) result.full_win += mass;
      else if (wins === 1 && pushes === 1) result.half_win += mass;
      else if (pushes === 2) result.push += mass;
      else if (losses === 1 && pushes === 1) result.half_loss += mass;
      else result.full_loss += mass;
    }
  }
  for (const key of Object.keys(result)) result[key] /= total;
  return {
    match_outcome_probabilities: { home_win:result.home_win, draw:result.draw, away_win:result.away_win },
    handicap_settlement_probabilities: { full_win:result.full_win, half_win:result.half_win, push:result.push, half_loss:result.half_loss, full_loss:result.full_loss },
    cover_probability: result.full_win + result.half_win
  };
};

const helperSource = 'const frProbabilityModel = ' + frProbabilityModel.toString() + ';';
if (!main.includes('const frProbabilityModel =')) {
  const anchor = "const app = document.querySelector('#app');";
  if (!main.includes(anchor)) throw new Error('V1.3 probability helper insertion anchor missing');
  main = main.replace(anchor, helperSource + '\n' + anchor);
}

const oldParse = `const parsed = JSON.parse(await file.text());
                validateAnalysisImport(parsed);
                const report = parsed;`;
const newParse = `const parsed = JSON.parse(await file.text());
                const report = parsed;
                const expectedGoals = report?.analysis?.expected_goals;
                if (expectedGoals && Number.isFinite(Number(expectedGoals.home)) && Number.isFinite(Number(expectedGoals.away))) {
                    const calculated = frProbabilityModel(expectedGoals, report.market.selected_team, Number(report.market.handicap_line));
                    if (!report.analysis.match_outcome_probabilities) report.analysis.match_outcome_probabilities = calculated.match_outcome_probabilities;
                    if (!report.analysis.handicap_settlement_probabilities) report.analysis.handicap_settlement_probabilities = calculated.handicap_settlement_probabilities;
                    if (report.analysis.cover_probability === null || report.analysis.cover_probability === undefined) report.analysis.cover_probability = calculated.cover_probability;
                    if (report.recommendation.cover_probability === null || report.recommendation.cover_probability === undefined) report.recommendation.cover_probability = calculated.cover_probability;
                    report.analysis.probability_status = 'estimated';
                    report.analysis.reasoning = [...(report.analysis.reasoning || []), 'คำนวณความน่าจะเป็นจาก expected goals ด้วย Independent Poisson model ภายใน Football rich'];
                }
                validateAnalysisImport(report);`;
if (main.includes(oldParse)) main = main.replace(oldParse, newParse);
else if (!main.includes("const expectedGoals = report?.analysis?.expected_goals;")) throw new Error('V1.3 analysis import probability hook anchor missing');

const oldCard = `const percent = value => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) + '%' : '—';
        const sideName = (match, side) => side === 'home' ? match.homeTeam : side === 'away' ? match.awayTeam : 'ไม่ระบุ';`;
const newCard = `const percent = value => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) + '%' : '—';
        const sideName = (match, side) => side === 'home' ? match.homeTeam : side === 'away' ? match.awayTeam : 'ไม่ระบุ';
        const countryFlags = {'Czech Republic':'🇨🇿','Czechia':'🇨🇿','England':'🏴','United Kingdom':'🇬🇧','Scotland':'🏴','Wales':'🏴','Northern Ireland':'🇬🇧','Spain':'🇪🇸','Germany':'🇩🇪','France':'🇫🇷','Italy':'🇮🇹','Portugal':'🇵🇹','Netherlands':'🇳🇱','Belgium':'🇧🇪','Austria':'🇦🇹','Switzerland':'🇨🇭','Turkey':'🇹🇷','Türkiye':'🇹🇷','Greece':'🇬🇷','Denmark':'🇩🇰','Sweden':'🇸🇪','Norway':'🇳🇴','Finland':'🇫🇮','Poland':'🇵🇱','Croatia':'🇭🇷','Serbia':'🇷🇸','Ukraine':'🇺🇦','Romania':'🇷🇴','Hungary':'🇭🇺','Slovakia':'🇸🇰','Slovenia':'🇸🇮','United States':'🇺🇸','USA':'🇺🇸','Mexico':'🇲🇽','Brazil':'🇧🇷','Argentina':'🇦🇷','Japan':'🇯🇵','South Korea':'🇰🇷','Korea Republic':'🇰🇷','Australia':'🇦🇺','Thailand':'🇹🇭','Saudi Arabia':'🇸🇦','Morocco':'🇲🇦','Egypt':'🇪🇬','South Africa':'🇿🇦'};
        const teamMark = (name, country) => {
          const clean = String(name || '').replace(/\\s+(FC|CF|SC|AC|FK|SK|B)$/i, '').trim();
          const initials = clean.split(/\\s+/).filter(Boolean).slice(0,2).map(part => Array.from(part)[0]).join('').toUpperCase() || 'FC';
          const flag = countryFlags[country] || countryFlags[name] || '';
          return '<span class="mc-team-mark" aria-hidden="true"><b>' + esc(initials) + '</b>' + (flag ? '<i>' + flag + '</i>' : '') + '</span>';
        };
        const teamHtml = (name, country) => '<div class="mc-team">' + teamMark(name, country) + '<span class="mc-team-name">' + esc(name) + '</span></div>';
        const matchCountry = (m, a) => a?.sourceReport?.match?.country || m.country || ''; `;
if (main.includes(oldCard)) main = main.replace(oldCard, newCard);
else if (!main.includes('const teamHtml = (name, country)')) throw new Error('V1.3 team badge helper anchor missing');

const oldUpcoming = `return '<article class="panel mc-card"><div class="mc-card-head"><span>' + esc(m.league) + '</span><span>' + (hasKickoff ? esc(fmtDate(m.kickoffAt)) : 'ไม่ระบุเวลาแข่งขัน') + '</span></div><div class="mc-teams"><div class="mc-team">' + esc(m.homeTeam) + '</div><div class="mc-vs">VS</div><div class="mc-team">' + esc(m.awayTeam) + '</div></div><div class="mc-prob-title">โอกาสผลการแข่งขัน · 1X2</div><div class="mc-prob-grid">`;
const newUpcoming = `return '<article class="panel mc-card"><div class="mc-card-head"><span>' + esc(m.league) + '</span><span>' + (hasKickoff ? esc(fmtDate(m.kickoffAt)) : 'ไม่ระบุเวลาแข่งขัน') + '</span></div><div class="mc-teams">' + teamHtml(m.homeTeam, matchCountry(m,a)) + '<div class="mc-vs">VS</div>' + teamHtml(m.awayTeam, matchCountry(m,a)) + '</div><div class="mc-prob-title">โอกาสผลการแข่งขัน · 1X2</div><div class="mc-prob-grid">`;
if (main.includes(oldUpcoming)) main = main.replace(oldUpcoming, newUpcoming);
else if (!main.includes("teamHtml(m.homeTeam, matchCountry(m,a))")) throw new Error('V1.3 upcoming team display anchor missing');

const oldFinished = `return '<article class="panel mc-card"><div class="mc-card-head"><span>' + esc(m.league) + '</span><span class="tag">ยืนยันผลแล้ว</span></div><div class="mc-teams"><div class="mc-team">' + esc(m.homeTeam) + '</div><div class="mc-score">' + Number(r.homeGoals) + ' – ' + Number(r.awayGoals) + '</div><div class="mc-team">' + esc(m.awayTeam) + '</div></div>`;
const newFinished = `return '<article class="panel mc-card"><div class="mc-card-head"><span>' + esc(m.league) + '</span><span class="tag">ยืนยันผลแล้ว</span></div><div class="mc-teams">' + teamHtml(m.homeTeam, matchCountry(m,a)) + '<div class="mc-score">' + Number(r.homeGoals) + ' – ' + Number(r.awayGoals) + '</div>' + teamHtml(m.awayTeam, matchCountry(m,a)) + '</div>`;
if (main.includes(oldFinished)) main = main.replace(oldFinished, newFinished);
else if (!main.includes(`teamHtml(m.homeTeam, matchCountry(m,a)) + '<div class="mc-score">'`)) throw new Error('V1.3 finished team display anchor missing');

const cssPatch = `
/* Football rich V1.3 team marks and country flags */
.mc-team{display:flex;align-items:center;justify-content:center;gap:7px;min-width:0}
.mc-team-mark{position:relative;display:inline-flex;flex:0 0 34px;width:34px;height:34px;align-items:center;justify-content:center;border-radius:50%;border:1px solid #8d6b2b;background:linear-gradient(145deg,#302718,#121212);color:#f4d27b;font-size:10px;letter-spacing:.3px;box-shadow:inset 0 0 0 2px #b78b3222}
.mc-team-mark i{position:absolute;right:-5px;bottom:-4px;font-size:12px;font-style:normal;line-height:1;background:#121212;border:1px solid #514226;border-radius:50%;padding:1px}
.mc-team-name{min-width:0;overflow-wrap:anywhere}
@media(max-width:650px){.mc-team-mark{flex-basis:29px;width:29px;height:29px;font-size:9px}.mc-team-mark i{font-size:10px}}
`;
if (!css.includes('/* Football rich V1.3 team marks and country flags */')) css += '\n' + cssPatch;


const resetCardAnchor = "${card('ข้อมูลและความเป็นส่วนตัว'";
const resetCard = `\${card('เริ่มโปรแกรมแข่งขันใหม่', '<p class="muted">ลบโปรแกรมแข่งขันเก่า บทวิเคราะห์ ข้อมูลค้นคว้า คำทำนาย ผลแข่งขัน และประวัติผลงานทั้งหมด เพื่อเริ่มชุดข้อมูลใหม่ โดยเก็บการตั้งค่าแอปไว้</p><p class="notice">คำเตือน: การลบนี้ย้อนกลับไม่ได้ แนะนำให้ดาวน์โหลดข้อมูลสำรอง JSON ก่อน</p><button class="danger" id="reset-match-data">ลบข้อมูลการแข่งขันเก่าและเริ่มใหม่</button>')}`;
if (main.includes(resetCardAnchor) && !main.includes('id="reset-match-data"')) main = main.replace(resetCardAnchor, resetCard + "\\n      " + resetCardAnchor);

const resetListenerAnchor = "document.querySelector('#export-csv').addEventListener('click', async () =>";
const resetListener = `document.querySelector('#reset-match-data').addEventListener('click', async () => {
            const backupFirst = confirm('ก่อนลบ แนะนำให้สำรองข้อมูลทั้งหมดเป็นไฟล์ JSON\\n\\nกด OK เพื่อดาวน์โหลดไฟล์สำรองก่อนดำเนินการ หรือ Cancel เพื่อยกเลิก');
            if (!backupFirst) return;
            try {
                downloadBackupFile(await exportBackup());
                if (!confirm('ยืนยันลบข้อมูลการแข่งขันเก่าทั้งหมดหรือไม่?\\n\\nจะลบ: แมตช์, บทวิเคราะห์, ข้อมูลค้นคว้า, หลักฐาน, ข่าวทีม, ราคา, คำทำนาย, ผลแข่งขัน และประวัติผลงาน\\n\\nจะเก็บไว้: การตั้งค่าแอป')) return;
                const storeNames = ['matches','research_records','source_evidence','team_news','market_odds','analyses','predictions','match_results','performance_records'];
                const db = await openDatabase();
                const tx = db.transaction(storeNames, 'readwrite');
                for (const name of storeNames) tx.objectStore(name).clear();
                await new Promise((resolve, reject) => {
                    tx.oncomplete = resolve;
                    tx.onerror = () => reject(tx.error ?? new Error('ลบข้อมูลไม่สำเร็จ'));
                    tx.onabort = () => reject(tx.error ?? new Error('ยกเลิกการลบข้อมูล'));
                });
                selectedMatchId = '';
                await render();
                alert('ลบข้อมูลการแข่งขันเก่าเรียบร้อยแล้ว\\nการตั้งค่าแอปยังคงอยู่ พร้อมเริ่มนำเข้าโปรแกรมใหม่');
            } catch (error) {
                alert(error instanceof Error ? error.message : 'ไม่สามารถลบข้อมูลได้');
            }
        });
        `;
if (main.includes(resetListenerAnchor) && !main.includes("querySelector('#reset-match-data')")) main = main.replace(resetListenerAnchor, resetListener + resetListenerAnchor);

if (!main.includes('frProbabilityModel') || !main.includes('teamHtml(m.homeTeam, matchCountry(m,a))')) throw new Error('V1.3 feature audit failed');
fs.writeFileSync(mainPath, main);
fs.writeFileSync(cssPath, css);

const modelTest = frProbabilityModel({home:1.55,away:1.05}, 'away', -0.5);
const oneXtwoTotal = Object.values(modelTest.match_outcome_probabilities).reduce((a,b)=>a+b,0);
const ahTotal = Object.values(modelTest.handicap_settlement_probabilities).reduce((a,b)=>a+b,0);
if (Math.abs(oneXtwoTotal-1)>1e-9 || Math.abs(ahTotal-1)>1e-9) throw new Error('V1.3 probability model distributions do not sum to 100%');
if (Math.abs(modelTest.cover_probability-(modelTest.handicap_settlement_probabilities.full_win+modelTest.handicap_settlement_probabilities.half_win))>1e-9) throw new Error('V1.3 cover probability definition failed');
console.log('Football rich V1.3 probability model and team badges applied; distribution tests passed.');
