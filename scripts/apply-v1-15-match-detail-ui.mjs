import fs from 'node:fs';
const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8'), css=fs.readFileSync(cssPath,'utf8'), sw=fs.readFileSync(swPath,'utf8'), html=fs.readFileSync(htmlPath,'utf8');
const eventStart=main.indexOf('const eventOrder = ev =>');
const revisionStart=main.indexOf('const revisionHtml =',eventStart);
if(eventStart<0 || revisionStart<0) throw new Error('V1.15 event renderer anchors missing');
const eventRenderer = "const eventOrder = ev => { const raw=String(ev.minute ?? ''); const parts=raw.split('+'); return Number(parts[0]) + Number(parts[1] || 0)/100; };\n" +
"          const renderSideEvents = side => {\n" +
"            const sideEvents = events.filter(ev => ev.team === side).slice().sort((a,b)=>eventOrder(a)-eventOrder(b));\n" +
"            if (!sideEvents.length) return '<p class=\"mc-muted mc-no-events\">ไม่มีเหตุการณ์ที่บันทึกไว้</p>';\n" +
"            return sideEvents.map(ev => {\n" +
"              const type = ev.type || 'goal'; const minute = esc(ev.minute || '—');\n" +
"              const player = esc(ev.scorer || (type === 'goal' ? 'ไม่ระบุผู้ทำประตู' : 'ไม่ระบุชื่อผู้เล่น'));\n" +
"              if (type === 'yellow_card' || type === 'red_card') { const card = type === 'yellow_card' ? 'yellow' : 'red'; const label = type === 'yellow_card' ? 'ใบเหลือง' : 'ใบแดง'; return '<div class=\"mc-event-row mc-event-card-row\"><time>' + minute + '</time><span class=\"mc-card-icon mc-card-icon-' + card + '\" aria-label=\"' + label + '\"></span><span class=\"mc-event-player\">' + player + '</span></div>'; }\n" +
"              return '<div class=\"mc-event-block\"><div class=\"mc-event-row\"><time>' + minute + '</time><span class=\"mc-event-ball\" aria-label=\"ประตู\">⚽</span><span class=\"mc-event-player\">' + player + '</span></div>' + (ev.assist ? '<div class=\"mc-assist-row\"><span class=\"mc-assist-boot\" aria-label=\"แอสซิสต์\">👟</span><span>แอสซิสต์: ' + esc(ev.assist) + '</span></div>' : '') + '</div>';\n" +
"            }).join('');\n" +
"          };\n" +
"          const eventHtml = '<div class=\"mc-event-columns\"><section class=\"mc-event-side\"><h4>' + esc(m.homeTeam) + '</h4>' + renderSideEvents('home') + '</section><section class=\"mc-event-side\"><h4>' + esc(m.awayTeam) + '</h4>' + renderSideEvents('away') + '</section></div>';";
main=main.slice(0,eventStart)+eventRenderer+'\n          '+main.slice(revisionStart);
const oldMeta="'<div class=\"mc-muted\">ยืนยันผล: ' + esc(fmtDate(r.verifiedAt || r.importedAt || r.createdAt)) + ' · แหล่งข้อมูล: ' + esc(r.source || 'รายการเดิม') + '</div>' +";
if(main.includes(oldMeta)) main=main.replace(oldMeta,'');
else if(main.includes(oldMeta.replace(' · แหล่งข้อมูล: ',''))) throw new Error('V1.15 metadata anchor changed');
const oldEnd="+ revisionHtml + '</article>';";
const newEnd="+ revisionHtml + '<div class=\"mc-confirmed-at\">ยืนยันผลแล้ว · ' + esc(fmtDate(r.verifiedAt || r.importedAt || r.createdAt)) + '</div></article>';";
if(main.includes(oldEnd)) main=main.replace(oldEnd,newEnd);
// If the base renderer already has a different footer shape, V1.16 normalizes it using the stable plain-end anchor.
if(!main.includes("const APP_VERSION='1.14';")) throw new Error('V1.15 expected app version 1.14');
main=main.replace("const APP_VERSION='1.14';","const APP_VERSION='1.15';").replace("const PREVIOUS_APP_VERSION='1.13';","const PREVIOUS_APP_VERSION='1.14';");
if(!html.includes('main.js?v=20261115-v1-14')) throw new Error('V1.15 HTML cache anchor missing');
html=html.replace('main.js?v=20261115-v1-14','main.js?v=20261115-v1-15');
if(!sw.includes('football-rich-shell-v22')) throw new Error('V1.15 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v22','football-rich-shell-v23');
const cssPatch = "/* V1.15 team-separated match events and football event icons */\n"+
".mc-event-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:8px}\n"+
".mc-event-side{min-width:0;padding:10px;border:1px solid #40351f;border-radius:11px;background:#17140f}\n"+
".mc-event-side h4{margin:0 0 9px;padding-bottom:8px;border-bottom:1px solid #40351f;color:#f4d27b;font-size:12px;line-height:1.4;overflow-wrap:anywhere}\n"+
".mc-event-row{display:flex;align-items:center;gap:7px;min-width:0;padding:6px 0}\n"+
".mc-event-row time{flex:0 0 38px;color:#f4d27b;font-size:11px;font-weight:800;font-variant-numeric:tabular-nums}\n"+
".mc-event-player{min-width:0;color:#e9e3d5;font-size:11px;line-height:1.4;overflow-wrap:anywhere}\n"+
".mc-event-ball{display:inline-flex;align-items:center;justify-content:center;flex:0 0 19px;width:19px;height:19px;border-radius:50%;background:#238b50;color:#fff;font-size:12px;line-height:1}\n"+
".mc-card-icon{display:inline-block;flex:0 0 11px;width:11px;height:17px;border:1px solid rgba(255,255,255,.2);border-radius:2px;box-shadow:0 1px 2px #0008}\n"+
".mc-card-icon-yellow{background:#f5d52d}.mc-card-icon-red{background:#d93636}\n"+
".mc-assist-row{display:flex;align-items:center;gap:7px;margin:0 0 5px 45px;color:#b9b1a2;font-size:10px;line-height:1.4;overflow-wrap:anywhere}\n"+
".mc-assist-boot{display:inline-flex;align-items:center;justify-content:center;flex:0 0 19px;width:19px;font-size:14px}\n"+
".mc-no-events{margin:8px 0}.mc-confirmed-at{margin-top:14px;padding-top:9px;border-top:1px solid #40351f;color:#a99d83;font-size:10px;text-align:right}\n"+
"@media(max-width:520px){.mc-event-columns{gap:7px}.mc-event-side{padding:8px 6px}.mc-event-side h4{font-size:11px}.mc-event-row{gap:5px}.mc-event-row time{flex-basis:32px;font-size:10px}.mc-event-player{font-size:10px}.mc-assist-row{margin-left:37px;font-size:9px}}\n";
if(!css.includes('V1.15 team-separated match events')) css+='\n'+cssPatch;
fs.writeFileSync(mainPath,main); fs.writeFileSync(cssPath,css); fs.writeFileSync(swPath,sw); fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.15',release:'V1.15'}));
for(const f of ['mc-event-columns','mc-assist-boot','mc-card-icon-yellow','mc-card-icon-red','mc-confirmed-at','renderSideEvents']) if(!main.includes(f) && !css.includes(f)) throw new Error('V1.15 feature audit failed: '+f);
if(!html.includes('main.js?v=20261115-v1-15') || !sw.includes('football-rich-shell-v23')) throw new Error('V1.15 cache metadata missing');
console.log('V1.15: team-separated events, goal ball, boot assist, football cards and confirmation footer verified.');
