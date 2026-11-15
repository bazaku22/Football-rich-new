import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

// V1.10 registered the four official J.League crest URLs, but V1.3's renderer
// still emitted initials only. Connect the map to the actual team-mark renderer.
const oldRenderer=`const teamMark = (name, country) => {
          const clean = String(name || '').replace(/\\s+(FC|CF|SC|AC|FK|SK|B)$/i, '').trim();
          const initials = clean.split(/\\s+/).filter(Boolean).slice(0,2).map(part => Array.from(part)[0]).join('').toUpperCase() || 'FC';
          const flag = countryFlags[country] || countryFlags[name] || '';
          return '<span class="mc-team-mark" aria-hidden="true"><b>' + esc(initials) + '</b>' + (flag ? '<i>' + flag + '</i>' : '') + '</span>';
        };`;
const newRenderer=`const teamMark = (name, country) => {
          const rawName = String(name || '').trim();
          const clean = rawName.replace(/\\s+(FC|CF|SC|AC|FK|SK|B)$/i, '').trim();
          const initials = clean.split(/\\s+/).filter(Boolean).slice(0,2).map(part => Array.from(part)[0]).join('').toUpperCase() || 'FC';
          const flag = countryFlags[country] || countryFlags[name] || '';
          const crest = knownClubCrests[rawName] || knownClubCrests[clean] ||
            (/machida\\s+zelvia/i.test(rawName) ? knownClubCrests['Machida Zelvia'] : '') ||
            (/vissel\\s+kobe/i.test(rawName) ? knownClubCrests['Vissel Kobe'] : '') ||
            (/kashiwa\\s+reysol/i.test(rawName) ? knownClubCrests['Kashiwa Reysol'] : '') ||
            (/kawasaki\\s+frontale/i.test(rawName) ? knownClubCrests['Kawasaki Frontale'] : '');
          if (crest) return '<span class="mc-team-mark mc-team-crest" aria-hidden="true"><img src="' + esc(crest) + '" alt="' + esc(rawName) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'inline\\'"><b style="display:none">' + esc(initials) + '</b></span>';
          return '<span class="mc-team-mark" aria-hidden="true"><b>' + esc(initials) + '</b>' + (flag ? '<i>' + flag + '</i>' : '') + '</span>';
        };`;
if (main.includes(oldRenderer)) main=main.replace(oldRenderer,newRenderer);
else if (!main.includes('mc-team-crest') || !main.includes('knownClubCrests[rawName]')) { const hits=[...main.matchAll(/mc-team-mark/g)].map(m=>main.slice(Math.max(0,m.index-260),Math.min(main.length,m.index+360))); console.log('V1.11 DIAGNOSTIC team-mark contexts:',JSON.stringify(hits.slice(0,12))); throw new Error('V1.11 renderer anchor mismatch; inspect diagnostic contexts above'); }

const cssPatch=`
/* V1.11: render real club crests without the initials badge circle */
.mc-team-mark.mc-team-crest{flex:0 0 38px;width:38px;height:42px;border:0;border-radius:0;background:transparent;box-shadow:none;color:inherit}
.mc-team-mark.mc-team-crest img{display:block;width:100%;height:100%;object-fit:contain;padding:0;border:0;border-radius:0;background:transparent}
@media(max-width:650px){.mc-team-mark.mc-team-crest{flex-basis:32px;width:32px;height:36px}}
`;
if (!css.includes('V1.11: render real club crests')) css+='\n'+cssPatch;

main=main.replace("const APP_VERSION='1.10';","const APP_VERSION='1.11';")
           .replace("const PREVIOUS_APP_VERSION='1.9';","const PREVIOUS_APP_VERSION='1.10';");
html=html.replace('main.js?v=20261115-v1-10','main.js?v=20261115-v1-11');
sw=sw.replaceAll('football-rich-shell-v18','football-rich-shell-v19');

fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.11',release:'V1.11'}));

for (const needle of ['mc-team-crest','knownClubCrests[rawName]','Machida Zelvia','Vissel Kobe','Kashiwa Reysol','Kawasaki Frontale']) {
  if (!main.includes(needle)) throw new Error('V1.11 crest renderer audit failed: '+needle);
}
if (!html.includes('main.js?v=20261115-v1-11')) throw new Error('V1.11 cache-busted entry missing');
if (!sw.includes("football-rich-shell-v19")) throw new Error('V1.11 service worker cache missing');
console.log('V1.11: connected J.League crest map to Match Center renderer; initials retained only as image-load fallback.');
