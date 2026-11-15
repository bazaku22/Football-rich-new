import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

// V1.17: compact two-column event layout directly beneath each team name.
// Compare stoppage time as (base minute, added minute), and keep source order for ties.
const eventStart=main.indexOf('const eventOrder = ev =>');
const revisionStart=main.indexOf('const revisionHtml =',eventStart);
if(eventStart<0 || revisionStart<0) throw new Error('V1.17 event renderer anchors missing');

const renderer = `const eventMinuteKey = ev => {
            const raw=String(ev.minute ?? '').trim();
            const match=raw.match(/^(\\d+)(?:\\s*\\+\\s*(\\d+))?$/);
            return match ? [Number(match[1]),Number(match[2] || 0),0] : [Number.MAX_SAFE_INTEGER,0,1];
          };
          const compareEventMinute = (a,b) => {
            const x=eventMinuteKey(a), y=eventMinuteKey(b);
            return x[0]-y[0] || x[1]-y[1] || x[2]-y[2];
          };
          const renderSideEvents = side => {
            const sideEvents = events.filter(ev => ev.team === side).map((ev,index)=>({ev,index}))
              .sort((a,b)=>compareEventMinute(a.ev,b.ev) || a.index-b.index).map(item=>item.ev);
            if (!sideEvents.length) return '<p class="mc-muted mc-no-events">ไม่มีเหตุการณ์</p>';
            return sideEvents.map(ev => {
              const type=ev.type || 'goal';
              const minute=esc(ev.minute || '—');
              const player=esc(ev.scorer || (type==='goal' ? 'ไม่ระบุผู้ทำประตู' : 'ไม่ระบุชื่อผู้เล่น'));
              const time='<span class="mc-event-minute">'+minute+'</span>';
              if (type==='yellow_card' || type==='red_card') {
                const card=type==='yellow_card'?'yellow':'red';
                return '<div class="mc-event-row mc-event-card-row">'+time+'<span class="mc-card-icon mc-card-icon-'+card+'" aria-label="'+(card==='yellow'?'ใบเหลือง':'ใบแดง')+'"></span><span class="mc-event-player">'+player+'</span></div>';
              }
              return '<div class="mc-event-block"><div class="mc-event-row">'+time+'<span class="mc-event-ball" aria-label="ประตู">⚽</span><span class="mc-event-player">'+player+'</span></div>'+(ev.assist?'<div class="mc-assist-row"><span class="mc-assist-boot" aria-label="แอสซิสต์">👟</span><span>แอสซิสต์: '+esc(ev.assist)+'</span></div>':'')+'</div>';
            }).join('');
          };
          const eventHtml = '<div class="mc-event-columns"><section class="mc-event-side"><h4>'+esc(m.homeTeam)+'</h4>'+renderSideEvents('home')+'</section><section class="mc-event-side"><h4>'+esc(m.awayTeam)+'</h4>'+renderSideEvents('away')+'</section></div>';
          `;
main=main.slice(0,eventStart)+renderer+'\n          '+main.slice(revisionStart);

if (!main.includes("const APP_VERSION='1.16';")) throw new Error('V1.17 expected app version 1.16');
main=main.replace("const APP_VERSION='1.16';","const APP_VERSION='1.17';")
         .replace("const PREVIOUS_APP_VERSION='1.15';","const PREVIOUS_APP_VERSION='1.16';");
if (!html.includes('main.js?v=20261115-v1-16')) throw new Error('V1.17 HTML cache anchor missing');
html=html.replace('main.js?v=20261115-v1-16','main.js?v=20261115-v1-17');
if (!sw.includes('football-rich-shell-v24')) throw new Error('V1.17 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v24','football-rich-shell-v25');

// Compact layout tuned for narrow Android screens while keeping both teams visible.
css += css.includes('V1.17 compact split-team match events') ? '' : `
/* V1.17 compact split-team match events */
.mc-event-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:5px}
.mc-event-side{min-width:0;padding:7px 6px;border:1px solid #40351f;border-radius:9px;background:#17140f}
.mc-event-side h4{margin:0 0 5px;padding:0 0 6px;border-bottom:1px solid #40351f;color:#f4d27b;font-size:11px;line-height:1.3;overflow-wrap:anywhere}
.mc-event-row{display:flex;align-items:flex-start;gap:5px;min-width:0;padding:3px 0}
.mc-event-minute{flex:0 0 auto;min-width:31px;padding:2px 3px;border-radius:5px;background:#302719;color:#f4d27b;font-size:9px;font-weight:800;line-height:1.35;text-align:center;font-variant-numeric:tabular-nums}
.mc-event-player{flex:1;min-width:0;color:#e9e3d5;font-size:10px;line-height:1.35;overflow-wrap:anywhere}
.mc-event-ball{display:inline-flex;align-items:center;justify-content:center;flex:0 0 15px;width:15px;height:15px;border-radius:50%;background:#238b50;color:#fff;font-size:9px;line-height:1}
.mc-card-icon{display:inline-block;flex:0 0 9px;width:9px;height:13px;margin:1px 3px 0 2px;border:1px solid #ffffff33;border-radius:2px;box-shadow:0 1px 2px #0008}
.mc-card-icon-yellow{background:#f5d52d}.mc-card-icon-red{background:#d93636}
.mc-assist-row{display:flex;align-items:flex-start;gap:4px;margin:0 0 3px 38px;color:#b9b1a2;font-size:9px;line-height:1.3;overflow-wrap:anywhere}
.mc-assist-boot{display:inline-flex;align-items:center;justify-content:center;flex:0 0 13px;width:13px;font-size:11px}
.mc-no-events{margin:5px 0;font-size:9px}
.mc-confirmed-at{margin-top:9px;padding-top:7px;font-size:9px}
@media(max-width:380px){.mc-event-columns{gap:5px}.mc-event-side{padding:6px 4px}.mc-event-row{gap:3px}.mc-event-minute{min-width:28px;font-size:8px}.mc-event-player{font-size:9px}.mc-assist-row{margin-left:32px;font-size:8px}}
`;

fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.17',release:'V1.17'}));

const finishedStart=main.indexOf('const renderFinished =');
const reviewStart=main.indexOf('<div class="mc-review">',finishedStart);
const finishedBlock=main.slice(finishedStart,reviewStart<0?undefined:reviewStart);
for(const feature of ['eventMinuteKey','compareEventMinute','renderSideEvents','mc-event-columns','mc-event-minute']) {
  if(!main.includes(feature) && !css.includes(feature)) throw new Error('V1.17 feature audit failed: '+feature);
}
if(!html.includes('main.js?v=20261115-v1-17') || !sw.includes('football-rich-shell-v25')) throw new Error('V1.17 cache metadata missing');
if(finishedBlock.includes('เหตุการณ์การแข่งขัน')) throw new Error('V1.17 separate events heading unexpectedly remains');
console.log('V1.17 verified: compact home/away event columns, chronological stoppage-time sorting, and existing finished-match footer retained.');
