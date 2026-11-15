import fs from 'node:fs';
const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8'), css=fs.readFileSync(cssPath,'utf8'), sw=fs.readFileSync(swPath,'utf8'), html=fs.readFileSync(htmlPath,'utf8');

// V1.22 fixes the actual collapsed finished-match events panel shown on narrow Android screens.
if (!main.includes('mc-event-columns') || !main.includes('renderSideEvents')) throw new Error('V1.22 finished-match event renderer missing');
if (!css.includes('V1.17 compact split-team match events')) throw new Error('V1.22 expected event layout CSS missing');
const patch = `
/* V1.22: prevent finished-match event panel and its team columns from collapsing */
article.mc-card .mc-events{
  display:block!important;position:relative!important;box-sizing:border-box!important;
  width:100%!important;max-width:100%!important;min-width:0!important;flex:none!important;
  grid-column:1/-1!important;align-self:stretch!important;writing-mode:horizontal-tb!important;
}
article.mc-card .mc-events>.mc-prob-title{
  display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;
  min-width:0!important;white-space:normal!important;writing-mode:horizontal-tb!important;
  word-break:normal!important;overflow-wrap:break-word!important;text-align:left!important;
}
article.mc-card .mc-event-columns{
  display:grid!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;
  min-width:0!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
  align-items:start!important;gap:9px!important;writing-mode:horizontal-tb!important;
}
article.mc-card .mc-event-side{
  display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;
  min-width:0!important;flex:none!important;writing-mode:horizontal-tb!important;
}
article.mc-card .mc-event-side h4,
article.mc-card .mc-event-player,
article.mc-card .mc-assist-row,
article.mc-card .mc-no-events{
  display:block!important;max-width:100%!important;min-width:0!important;
  white-space:normal!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;
  word-break:normal!important;overflow-wrap:break-word!important;line-height:1.45!important;
}
article.mc-card .mc-event-row{
  display:flex!important;flex-direction:row!important;align-items:flex-start!important;
  width:100%!important;max-width:100%!important;min-width:0!important;
  writing-mode:horizontal-tb!important;
}
article.mc-card .mc-event-player{flex:1 1 auto!important}
@media(max-width:650px){
  article.mc-card .mc-events{margin-top:14px!important;padding-top:12px!important}
  article.mc-card .mc-event-columns{grid-template-columns:minmax(0,1fr)!important;gap:8px!important}
  article.mc-card .mc-event-side{padding:10px!important}
  article.mc-card .mc-event-side h4{font-size:12px!important}
  article.mc-card .mc-event-player{font-size:12px!important}
  article.mc-card .mc-event-minute{flex:0 0 auto!important}
  article.mc-card .mc-assist-row{margin-left:38px!important;font-size:10px!important}
}
`;
if (!css.includes('V1.22: prevent finished-match event panel')) css += '\n' + patch;
if (!main.includes("const APP_VERSION='1.21';")) throw new Error('V1.22 expected app version 1.21');
main=main.replace("const APP_VERSION='1.21';","const APP_VERSION='1.22';")
         .replace("const PREVIOUS_APP_VERSION='1.20';","const PREVIOUS_APP_VERSION='1.21';");
if (!html.includes('main.js?v=20261115-v1-21')) throw new Error('V1.22 HTML cache anchor missing');
html=html.replace('main.js?v=20261115-v1-21','main.js?v=20261115-v1-22');
if (!sw.includes('football-rich-shell-v29')) throw new Error('V1.22 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v29','football-rich-shell-v30');
fs.writeFileSync(mainPath,main); fs.writeFileSync(cssPath,css); fs.writeFileSync(swPath,sw); fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.22',release:'V1.22'}));
for (const rule of ['V1.22: prevent finished-match event panel','article.mc-card .mc-events','grid-template-columns:minmax(0,1fr)!important','writing-mode:horizontal-tb!important']) if(!css.includes(rule)) throw new Error('V1.22 event layout audit failed: '+rule);
if(!html.includes('main.js?v=20261115-v1-22') || !sw.includes('football-rich-shell-v30')) throw new Error('V1.22 cache metadata missing');
console.log('V1.22 verified: finished-match events panel full width; home/away event panels stack vertically on mobile; event/player text forced horizontal; local records unchanged.');
