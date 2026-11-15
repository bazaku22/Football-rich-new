import fs from 'node:fs';
const mainPath='dist/main.js', cssPath='dist/styles/main.css', htmlPath='dist/index.html', swPath='dist/sw.js';
let main=fs.readFileSync(mainPath,'utf8'), css=fs.readFileSync(cssPath,'utf8'), html=fs.readFileSync(htmlPath,'utf8'), sw=fs.readFileSync(swPath,'utf8');
const finishedStart=main.indexOf('const renderFinished =');
const idPos=finishedStart<0?-1:main.indexOf('MATCH ID:',finishedStart);
const revisionPos=idPos<0?-1:main.indexOf('revisionHtml',idPos);
const articleToken='</article>';
const articleEnd=revisionPos<0?-1:main.indexOf(articleToken,revisionPos);
const divPos=idPos<0?-1:main.lastIndexOf('<div',idPos);
const quoteStart=divPos<0?-1:main.lastIndexOf("'",divPos);
if(finishedStart<0||idPos<0||revisionPos<0||articleEnd<0||quoteStart<0) throw new Error('V1.24 could not locate finished result footer: renderer='+finishedStart+', id='+idPos+', revision='+revisionPos+', article='+articleEnd+', div='+divPos);
const newFooter=`'<section class="mc-result-meta"><div class="mc-id-block"><span class="mc-meta-label">รหัสรายการ</span><div class="mc-id">MATCH ID: ' + esc(m.id) + '</div><div class="mc-id">RESULT ID: ' + esc(r.importResultId || 'legacy') + '</div></div>' + (Number(r.revisionNumber) > 1 ? '<div class="mc-snapshot-note"><span class="mc-meta-label">ประวัติการแก้ไข</span><p>แก้ไขผลแล้ว ' + (Number(r.revisionNumber) - 1) + ' ครั้ง · เก็บ Snapshot ก่อนหน้าไว้</p></div>' : '') + (revisionHtml ? '<div class="mc-history-wrap">' + revisionHtml + '</div>' : '') + '</section></article>'`;
main=main.slice(0,quoteStart)+newFooter+main.slice(articleEnd+articleToken.length);
const cssPatch=`
/* V1.24: full-width readable result metadata and snapshot history footer */
.mc-result-meta{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:10px!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin-top:14px!important;padding-top:12px!important;border-top:1px solid #40351f!important}
.mc-id-block,.mc-snapshot-note,.mc-history-wrap{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
.mc-meta-label{display:block!important;margin:0 0 5px!important;color:#f4d27b!important;font-size:11px!important;font-weight:750!important;line-height:1.5!important;white-space:normal!important;writing-mode:horizontal-tb!important}
.mc-result-meta .mc-id{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:3px 0!important;font-size:10px!important;line-height:1.55!important;text-align:left!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;writing-mode:horizontal-tb!important}
.mc-snapshot-note{padding:10px 12px!important;border:1px solid #40351f!important;border-radius:10px!important;background:#17140f!important}
.mc-snapshot-note p{margin:0!important;color:#b9b1a2!important;font-size:12px!important;line-height:1.6!important;white-space:normal!important;overflow-wrap:anywhere!important;writing-mode:horizontal-tb!important}
.mc-history{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:0!important;padding:10px 12px!important;border:1px solid #514226!important;border-radius:10px!important;background:#17140f!important}
.mc-history summary{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;white-space:normal!important;line-height:1.5!important;overflow-wrap:anywhere!important;writing-mode:horizontal-tb!important}
.mc-history-row{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.6!important}
`;
if(!css.includes('V1.24: full-width readable result metadata and snapshot history footer')) css+=String.fromCharCode(10)+cssPatch;
if(!main.includes("const APP_VERSION='1.23';")) throw new Error('V1.24 expected app version 1.23');
main=main.replace("const APP_VERSION='1.23';","const APP_VERSION='1.24';").replace("const PREVIOUS_APP_VERSION='1.22';","const PREVIOUS_APP_VERSION='1.23';");
if(!html.includes('main.js?v=20261116-v1-23')) throw new Error('V1.24 HTML cache anchor missing');
html=html.replace('main.js?v=20261116-v1-23','main.js?v=20261116-v1-24');
if(!sw.includes('football-rich-shell-v31')) throw new Error('V1.24 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v31','football-rich-shell-v32');
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.24',release:'V1.24'}));
for(const s of ['mc-result-meta','mc-id-block','mc-snapshot-note','mc-history-wrap']) if(!main.includes(s)) throw new Error('V1.24 footer markup missing '+s);
for(const s of ['V1.24: full-width readable result metadata and snapshot history footer','.mc-result-meta','.mc-result-meta .mc-id','overflow-wrap:anywhere!important']) if(!css.includes(s)) throw new Error('V1.24 footer CSS missing '+s);
if(!html.includes('main.js?v=20261116-v1-24')||!sw.includes('football-rich-shell-v32')) throw new Error('V1.24 cache bust audit failed');
console.log('V1.24 footer audit passed: full-width ID metadata, revision snapshot note, history disclosure; data untouched.');
