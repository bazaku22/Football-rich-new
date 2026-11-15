import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

// V1.20: repair narrow-screen Match Center cards. Keep team names, crests and scores;
// only change layout rules. No IndexedDB records or match data are modified.
if (!main.includes('allMatches.map(m => resultByMatch.has(m.id) ? renderFinished(m) : renderUpcoming(m))')) {
  throw new Error('V1.20 expected unified Match Center renderer missing');
}
if (!css.includes('.mc-teams{') || !css.includes('.mc-team-name{')) {
  throw new Error('V1.20 expected Match Center team layout CSS missing');
}
const cssPatch = `
/* V1.20 mobile Match Center card layout repair */
.mc-card{box-sizing:border-box;width:100%;max-width:100%;min-width:0;height:auto;min-height:0}
.mc-card-head{min-width:0;flex-wrap:wrap;align-items:center}
.mc-card-head>span{min-width:0;max-width:100%}
.mc-card-head>span:last-child{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-wrap:wrap}
.mc-teams{box-sizing:border-box;display:grid;width:100%;max-width:100%;min-width:0;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:8px}
.mc-team{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;width:100%;max-width:100%;min-width:0;overflow:visible}
.mc-team-name{display:block;box-sizing:border-box;width:100%;max-width:100%;min-width:0;text-align:center;white-space:normal;overflow-wrap:break-word;word-break:normal;line-height:1.35}
.mc-team-mark,.mc-team-mark.mc-team-crest{flex:0 0 38px;width:38px;height:42px;max-width:100%}
.mc-score{min-width:0;text-align:center;white-space:nowrap}
.mc-vs{min-width:22px;text-align:center}
.mc-id{display:block;width:100%;max-width:100%;min-width:0;white-space:normal;overflow-wrap:anywhere;word-break:normal;line-height:1.45}
@media(max-width:650px){
  .mc-card{padding:14px;overflow:visible}
  .mc-teams{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px;margin:16px 0}
  .mc-team{flex-direction:column;gap:6px;font-size:12px}
  .mc-team-name{font-size:12px;line-height:1.35;overflow-wrap:break-word;word-break:normal}
  .mc-team-mark,.mc-team-mark.mc-team-crest{flex-basis:34px;width:34px;height:38px}
  .mc-score{font-size:25px;letter-spacing:1px}
  .mc-card-head{gap:6px}
  .mc-card-head>span:last-child{gap:5px}
}
@media(max-width:360px){
  .mc-card{padding:11px}
  .mc-teams{gap:4px}
  .mc-team-name{font-size:11px}
  .mc-team-mark,.mc-team-mark.mc-team-crest{flex-basis:30px;width:30px;height:34px}
  .mc-score{font-size:22px}
}
`;
if (!css.includes('V1.20 mobile Match Center card layout repair')) css += '\n' + cssPatch;

if (!main.includes("const APP_VERSION='1.19';")) throw new Error('V1.20 expected app version 1.19');
main=main.replace("const APP_VERSION='1.19';","const APP_VERSION='1.20';")
         .replace("const PREVIOUS_APP_VERSION='1.18';","const PREVIOUS_APP_VERSION='1.19';");
if (!html.includes('main.js?v=20261115-v1-19')) throw new Error('V1.20 HTML cache anchor missing');
html=html.replace('main.js?v=20261115-v1-19','main.js?v=20261115-v1-20');
if (!sw.includes('football-rich-shell-v27')) throw new Error('V1.20 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v27','football-rich-shell-v28');

fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.20',release:'V1.20'}));

for (const selector of ['.mc-card{box-sizing:border-box;width:100%','.mc-teams{box-sizing:border-box;display:grid;width:100%','.mc-team-name{display:block;box-sizing:border-box;width:100%']) {
  if (!css.includes(selector)) throw new Error('V1.20 mobile layout audit failed: '+selector);
}
if (!html.includes('main.js?v=20261115-v1-20') || !sw.includes('football-rich-shell-v28')) throw new Error('V1.20 cache metadata missing');
console.log('V1.20 verified: mobile Match Center card width, team name wrapping, crest alignment and score layout repaired; local records unchanged.');
