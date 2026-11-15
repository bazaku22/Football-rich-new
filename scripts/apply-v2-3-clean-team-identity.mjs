import fs from 'node:fs';

const mainPath='dist/main.js',cssPath='dist/styles/main.css',htmlPath='dist/index.html',swPath='dist/sw.js';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');

if(!main.includes("const APP_VERSION='2.2';") ||
   !html.includes('main.js?v=20261116-v2-2') ||
   !sw.includes("const CACHE_NAME = 'football-rich-shell-v43'")) {
  throw Error('V2.3 expected V2.2 build anchors missing; refusing to patch an unknown build');
}

const markStart=main.indexOf('const mark=name=>{');
const flagsStart=main.lastIndexOf('const nationalFlags = {',markStart);
const markEnd=main.indexOf('};',markStart)+2;
if(markStart<0 || flagsStart<0 || markEnd<=markStart) throw Error('V2.2 team identity renderer anchors missing');

const replacement=String.raw`const nationalFlags = {
 argentina:'🇦🇷',australia:'🇦🇺',austria:'🇦🇹',albania:'🇦🇱',algeria:'🇩🇿',angola:'🇦🇴',armenia:'🇦🇲',azerbaijan:'🇦🇿',
 belgium:'🇧🇪',bolivia:'🇧🇴',bosniaandherzegovina:'🇧🇦',bosnia:'🇧🇦',brazil:'🇧🇷',bulgaria:'🇧🇬',canada:'🇨🇦',chile:'🇨🇱',china:'🇨🇳',chinapr:'🇨🇳',colombia:'🇨🇴',costarica:'🇨🇷',
 croatia:'🇭🇷',cyprus:'🇨🇾',czechia:'🇨🇿',czechrepublic:'🇨🇿',denmark:'🇩🇰',ecuador:'🇪🇨',egypt:'🇪🇬',england:'🇬🇧',estonia:'🇪🇪',finland:'🇫🇮',france:'🇫🇷',
 georgia:'🇬🇪',germany:'🇩🇪',ghana:'🇬🇭',greece:'🇬🇷',hungary:'🇭🇺',iceland:'🇮🇸',india:'🇮🇳',indonesia:'🇮🇩',iran:'🇮🇷',iraq:'🇮🇶',ireland:'🇮🇪',republicofireland:'🇮🇪',
 israel:'🇮🇱',italy:'🇮🇹',ivorycoast:'🇨🇮',cotedivoire:'🇨🇮',jamaica:'🇯🇲',japan:'🇯🇵',jordan:'🇯🇴',kazakhstan:'🇰🇿',kenya:'🇰🇪',kosovo:'🇽🇰',kuwait:'🇰🇼',
 latvia:'🇱🇻',lebanon:'🇱🇧',lithuania:'🇱🇹',luxembourg:'🇱🇺',malaysia:'🇲🇾',mali:'🇲🇱',mexico:'🇲🇽',montenegro:'🇲🇪',morocco:'🇲🇦',netherlands:'🇳🇱',newzealand:'🇳🇿',nigeria:'🇳🇬',
 northkorea:'🇰🇵',koreadpr:'🇰🇵',northmacedonia:'🇲🇰',norway:'🇳🇴',oman:'🇴🇲',pakistan:'🇵🇰',palestine:'🇵🇸',panama:'🇵🇦',paraguay:'🇵🇾',peru:'🇵🇪',poland:'🇵🇱',
 portugal:'🇵🇹',qatar:'🇶🇦',romania:'🇷🇴',russia:'🇷🇺',saudiarabia:'🇸🇦',scotland:'🇬🇧',senegal:'🇸🇳',serbia:'🇷🇸',singapore:'🇸🇬',slovakia:'🇸🇰',slovenia:'🇸🇮',
 southafrica:'🇿🇦',southkorea:'🇰🇷',korearepublic:'🇰🇷',republicofkorea:'🇰🇷',spain:'🇪🇸',srilanka:'🇱🇰',sweden:'🇸🇪',switzerland:'🇨🇭',syria:'🇸🇾',thailand:'🇹🇭',tunisia:'🇹🇳',
 turkey:'🇹🇷',turkiye:'🇹🇷',ukraine:'🇺🇦',unitedarabemirates:'🇦🇪',uae:'🇦🇪',unitedstates:'🇺🇸',usa:'🇺🇸',uruguay:'🇺🇾',uzbekistan:'🇺🇿',venezuela:'🇻🇪',vietnam:'🇻🇳',wales:'🇬🇧',
 guernsey:'🇬🇬',greenland:'🇬🇱',hongkong:'🇭🇰',jersey:'🇯🇪',faroeislands:'🇫🇴',gibraltar:'🇬🇮',macau:'🇲🇴',macao:'🇲🇴',taiwan:'🇹🇼',curacao:'🇨🇼',
 unitedkingdom:'🇬🇧',greatbritain:'🇬🇧',britain:'🇬🇧',uk:'🇬🇧',northernireland:'🇬🇧',englandnationalteam:'🇬🇧',
 democraticrepublicofthecongo:'🇨🇩',drcongo:'🇨🇩',congo:'🇨🇬',tanzania:'🇹🇿',zambia:'🇿🇲',zimbabwe:'🇿🇼',cameroon:'🇨🇲',burkinafaso:'🇧🇫',guinea:'🇬🇳',guineabissau:'🇬🇼',
 unitedstatesofamerica:'🇺🇸',unitedrepublicoftanzania:'🇹🇿',saintkittsandnevis:'🇰🇳',trinidadandtobago:'🇹🇹',dominicanrepublic:'🇩🇴',elsalvador:'🇸🇻'
};
const flagFor = name => {
 const key=String(name||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
 const base=key.replace(/u(?:17|18|19|20|21|23)$/,'').replace(/(?:nationalteam|national|team)$/,'');
 return nationalFlags[key]||nationalFlags[base]||'';
};
const mark=name=>{
 const n=String(name||'?'),k=n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,''),logo=logos[k],flag=flagFor(n),initial=n.trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
 if(flag)return '<span class="v23-team-mark v23-flag" role="img" aria-label="ธงชาติ '+esc(n)+'">'+flag+'</span>';
 return '<span class="v23-team-mark v23-crest">'+(logo?'<img src="'+logo+'" alt="'+esc(n)+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML=\'<b>'+esc(initial||'?')+'</b>\'">':'<b>'+esc(initial||'?')+'</b>')+'</span>';
};`;
main=main.slice(0,flagsStart)+replacement+main.slice(markEnd);
main=main.replace("const APP_VERSION='2.2';","const APP_VERSION='2.3';")
  .replace("const PREVIOUS_APP_VERSION='2.1';","const PREVIOUS_APP_VERSION='2.2';")
  .replaceAll('FOOTBALL RICH · BLACK & GOLD · V2.2','FOOTBALL RICH · BLACK & GOLD · V2.3')
  .replace('<span class="tag">V2.2</span>','<span class="tag">V2.3</span>');

css += String.raw`
/* V2.3 clean team identity: standalone flags and transparent club crests */
.v21-teams .v23-team-mark{
 display:flex;align-items:center;justify-content:center;
 width:48px;height:48px;flex:0 0 48px;
 margin:0;padding:0;border:0!important;border-radius:0!important;
 background:transparent!important;box-shadow:none!important;overflow:visible;
 isolation:isolate;
}
.v21-teams .v23-flag{font-family:"Apple Color Emoji","Segoe UI Emoji",sans-serif;font-size:38px;line-height:1}
.v21-teams .v23-crest img{
 display:block;width:100%;height:100%;max-width:48px;max-height:48px;
 object-fit:contain;padding:0!important;border:0!important;border-radius:0!important;
 background:transparent!important;box-shadow:none!important;
 mix-blend-mode:multiply;
}
.v21-teams .v23-crest b{color:#f4d27b;font-size:13px}
.v21-teams .v23-team-mark img{outline:0}
`;
html=html.replace('main.js?v=20261116-v2-2','main.js?v=20261116-v2-3');
sw=sw.replaceAll('football-rich-shell-v43','football-rich-shell-v44');
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'2.3',release:'V2.3'}));
for(const marker of ["const APP_VERSION='2.3';",'const nationalFlags =','guernsey:','greenland:','hongkong:','v23-team-mark','v23-flag','v23-crest'])if(!main.includes(marker))throw Error('V2.3 audit missing '+marker);
if(!html.includes('main.js?v=20261116-v2-3')||!sw.includes("football-rich-shell-v44"))throw Error('V2.3 cache-busting audit failed');
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear('))throw Error('Destructive database operation detected');
console.log('V2.3 applied: standalone flag emoji, frameless club crests, expanded territory/country mapping, data preserved.');
