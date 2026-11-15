import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

// V1.10 registered the four official J.League crest URLs, but V1.3's renderer
// still emitted initials only. Connect the map to the actual team-mark renderer.
// V1.3 renderer already accepts crestUrl, but V1.10 only registered club URLs.
// Resolve a mapped URL from the team name when the fixture has no explicit crestUrl.
const crestResolverAnchor = "const safeCrest = typeof crestUrl === 'string' && /^https?:\\/\\//i.test(crestUrl) ? crestUrl : '';"; 
if (!main.includes(crestResolverAnchor)) throw new Error('Existing crestUrl resolver anchor not found');
const crestResolverReplacement = `const normalizedClubName = String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const mappedClubCrest = knownClubCrests[name] || knownClubCrests[clean] ||
            Object.entries(knownClubCrests).find(([clubName]) => clubName.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedClubName)?.[1] || '';
          const safeCrest = (typeof crestUrl === 'string' && /^https?:\\/\\//i.test(crestUrl) ? crestUrl : '') || mappedClubCrest;`;
main = main.replace(crestResolverAnchor, crestResolverReplacement);
const oldMarkup = `return '<span class="mc-team-mark" aria-hidden="true"><b>' + esc(initials) + '</b>' + (safeCrest ? '<img src="' + esc(safeCrest) + '" alt="" loading="lazy" onerror="this.remove()">' : '') + '</span>';`;
const newMarkup = `if (safeCrest) return '<span class="mc-team-mark mc-team-crest" aria-hidden="true"><img src="' + esc(safeCrest) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'block\\'"><b style="display:none">' + esc(initials) + '</b></span>';
          return '<span class="mc-team-mark" aria-hidden="true"><b>' + esc(initials) + '</b></span>';`;
if (!main.includes(oldMarkup)) throw new Error('Existing team-mark HTML template anchor not found');
main = main.replace(oldMarkup, newMarkup);
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

for (const needle of ['mc-team-crest','mappedClubCrest','Machida Zelvia','Vissel Kobe','Kashiwa Reysol','Kawasaki Frontale']) {
  if (!main.includes(needle)) throw new Error('V1.11 crest renderer audit failed: '+needle);
}
if (!html.includes('main.js?v=20261115-v1-11')) throw new Error('V1.11 cache-busted entry missing');
if (!sw.includes("football-rich-shell-v19")) throw new Error('V1.11 service worker cache missing');
console.log('V1.11: connected J.League crest map to Match Center renderer; initials retained only as image-load fallback.');
