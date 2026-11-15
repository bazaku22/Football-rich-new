import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

// Extend Result JSON events without changing existing goal-event compatibility.
const oldValidation="if (!ev || typeof ev !== 'object' || ev.type !== 'goal' || !['home','away'].includes(ev.team)) fail('เหตุการณ์ต้องเป็น goal และระบุทีม home/away');";
const newValidation="if (!ev || typeof ev !== 'object' || !['goal','yellow_card','red_card'].includes(ev.type) || !['home','away'].includes(ev.team)) fail('เหตุการณ์ต้องเป็น goal, yellow_card หรือ red_card และระบุทีม home/away');";
if(main.includes(oldValidation)) main=main.replace(oldValidation,newValidation);
else if(!main.includes("['goal','yellow_card','red_card'].includes(ev.type)")) throw new Error('V1.14 result event validation anchor missing');

const oldEventHtml="const eventHtml = events.length\n            ? events.map(ev => '<div class=\"mc-event\"><time>' + esc(ev.minute || '—') + '</time><span>' + esc(ev.team === 'home' ? m.homeTeam : m.awayTeam) + ' · ' + esc(ev.scorer || 'ไม่ระบุผู้ทำประตู') + (ev.assist ? ' (แอสซิสต์: ' + esc(ev.assist) + ')' : '') + '</span></div>').join('')\n            : '<p class=\"mc-muted\">ไม่มีข้อมูลผู้ทำประตูหรือแอสซิสต์ในไฟล์ผลนี้</p>';";
const newEventHtml=`const eventOrder = ev => { const raw=String(ev.minute ?? ''); const match=raw.match(/^(\\d+)(?:\\+(\\d+))?$/); return match ? Number(match[1]) + Number(match[2] || 0)/100 : 999; };
          const eventLabel = ev => ev.type === 'yellow_card' ? 'ใบเหลือง' : ev.type === 'red_card' ? 'ใบแดง' : 'ประตู';
          const eventHtml = events.length
            ? events.slice().sort((a,b)=>eventOrder(a)-eventOrder(b)).map(ev => '<div class="mc-event mc-event-' + esc(ev.type || 'goal') + '"><time>' + esc(ev.minute || '—') + '</time><span><b>' + eventLabel(ev) + '</b> · ' + esc(ev.team === 'home' ? m.homeTeam : m.awayTeam) + (ev.type === 'goal' || !ev.type ? ' · ' + esc(ev.scorer || 'ไม่ระบุผู้ทำประตู') + (ev.assist ? ' (แอสซิสต์: ' + esc(ev.assist) + ')' : '') : (ev.scorer ? ' · ' + esc(ev.scorer) : '')) + '</span></div>').join('')
            : '<p class="mc-muted">ยังไม่มีรายละเอียดเหตุการณ์สำหรับแมตช์นี้</p>';`;
if(main.includes(oldEventHtml)) main=main.replace(oldEventHtml,newEventHtml);
else if(!main.includes('const eventLabel = ev =>')) throw new Error('V1.14 event display anchor missing');

if(!main.includes("const APP_VERSION='1.13';")) throw new Error('V1.14 expected app version 1.13');
main=main.replace("const APP_VERSION='1.13';","const APP_VERSION='1.14';")
         .replace("const PREVIOUS_APP_VERSION='1.12';","const PREVIOUS_APP_VERSION='1.13';");
html=html.replace('main.js?v=20261115-v1-13','main.js?v=20261115-v1-14');
sw=sw.replaceAll('football-rich-shell-v21','football-rich-shell-v22');

css += css.includes('V1.14 match event types') ? '' : `
/* V1.14 match event types */
.mc-event{display:flex;align-items:flex-start;gap:10px;padding:7px 9px;border-bottom:1px solid #332d20}
.mc-event time{flex:0 0 52px;color:#f4d27b;font-weight:800;font-variant-numeric:tabular-nums}
.mc-event>span{min-width:0;color:#e9e3d5}
.mc-event>span b{font-size:11px;letter-spacing:.02em}
.mc-event-yellow_card>span b{color:#f4d27b}
.mc-event-red_card>span b{color:#f07c72}
.mc-event-goal>span b{color:#d8bd7a}
`;

fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.14',release:'V1.14'}));

for(const feature of ["['goal','yellow_card','red_card'].includes(ev.type)",'const eventLabel = ev =>','mc-event-yellow_card','mc-event-red_card']) if(!main.includes(feature) && !css.includes(feature)) throw new Error('V1.14 feature audit failed: '+feature);
if(!html.includes('main.js?v=20261115-v1-14')) throw new Error('V1.14 cache-busted app entry missing');
if(!sw.includes('football-rich-shell-v22')) throw new Error('V1.14 service worker cache missing');
console.log('V1.14 match events: goals, yellow cards and red cards validated and rendered; existing goal-only events remain compatible.');
