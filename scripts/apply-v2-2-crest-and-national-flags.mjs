import fs from 'node:fs';
const mainPath='dist/main.js',cssPath='dist/styles/main.css',htmlPath='dist/index.html',swPath='dist/sw.js';
let main=fs.readFileSync(mainPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),html=fs.readFileSync(htmlPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
if(!main.includes("const APP_VERSION='2.1';")||!html.includes('main.js?v=20261116-v2-1')||!sw.includes("const CACHE_NAME = 'football-rich-shell-v42'"))throw Error('V2.2 expected V2.1 build anchors missing; refusing to patch an unknown build');
const markStart=main.indexOf('const mark=name=>{'),markEnd=main.indexOf('};',markStart)+2;
if(markStart<0||markEnd<=markStart)throw Error('V2.1 team mark renderer anchor missing');
const replacement=String.raw`const nationalFlags = {
 argentina:'🇦🇷',australia:'🇦🇺',austria:'🇦🇹',albania:'🇦🇱',algeria:'🇩🇿',angola:'🇦🇴',armenia:'🇦🇲',azerbaijan:'🇦🇿',
 belgium:'🇧🇪',bolivia:'🇧🇴',bosniaandherzegovina:'🇧🇦',bosnia:'🇧🇦',brazil:'🇧🇷',bulgaria:'🇧🇬',canada:'🇨🇦',chile:'🇨🇱',china:'🇨🇳',chinapr:'🇨🇳',colombia:'🇨🇴',costarica:'🇨🇷',
 croatia:'🇭🇷',cyprus:'🇨🇾',czechia:'🇨🇿',czechrepublic:'🇨🇿',denmark:'🇩🇰',ecuador:'🇪🇨',egypt:'🇪🇬',england:'🇬🇧',estonia:'🇪🇪',finland:'🇫🇮',france:'🇫🇷',
 georgia:'🇬🇪',germany:'🇩🇪',ghana:'🇬🇭',greece:'🇬🇷',hungary:'🇭🇺',iceland:'🇮🇸',india:'🇮🇳',indonesia:'🇮🇩',iran:'🇮🇷',iriran:'🇮🇷',iraq:'🇮🇶',ireland:'🇮🇪',republicofireland:'🇮🇪',
 israel:'🇮🇱',italy:'🇮🇹',ivorycoast:'🇨🇮',cotedivoire:'🇨🇮',jamaica:'🇯🇲',japan:'🇯🇵',jordan:'🇯🇴',kazakhstan:'🇰🇿',kenya:'🇰🇪',kosovo:'🇽🇰',kuwait:'🇰🇼',
 latvia:'🇱🇻',lebanon:'🇱🇧',lithuania:'🇱🇹',luxembourg:'🇱🇺',malaysia:'🇲🇾',mali:'🇲🇱',mexico:'🇲🇽',montenegro:'🇲🇪',morocco:'🇲🇦',netherlands:'🇳🇱',newzealand:'🇳🇿',nigeria:'🇳🇬',
 northkorea:'🇰🇵',koreadpr:'🇰🇵',northmacedonia:'🇲🇰',norway:'🇳🇴',oman:'🇴🇲',pakistan:'🇵🇰',palestine:'🇵🇸',panama:'🇵🇦',paraguay:'🇵🇾',peru:'🇵🇪',poland:'🇵🇱',
 portugal:'🇵🇹',qatar:'🇶🇦',romania:'🇷🇴',russia:'🇷🇺',saudiarabia:'🇸🇦',scotland:'🇬🇧',senegal:'🇸🇳',serbia:'🇷🇸',singapore:'🇸🇬',slovakia:'🇸🇰',slovenia:'🇸🇮',
 southafrica:'🇿🇦',southkorea:'🇰🇷',korearepublic:'🇰🇷',republicofkorea:'🇰🇷',spain:'🇪🇸',srilanka:'🇱🇰',sweden:'🇸🇪',switzerland:'🇨🇭',syria:'🇸🇾',thailand:'🇹🇭',tunisia:'🇹🇳',
 turkey:'🇹🇷',turkiye:'🇹🇷',ukraine:'🇺🇦',unitedarabemirates:'🇦🇪',uae:'🇦🇪',unitedstates:'🇺🇸',usa:'🇺🇸',uruguay:'🇺🇾',uzbekistan:'🇺🇿',venezuela:'🇻🇪',vietnam:'🇻🇳',wales:'🇬🇧'
};
const flagFor = name => {
 const key=String(name||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]/g,'');
 const base=key.replace(/u(?:17|18|19|20|21|23)$/,'').replace(/(?:nationalteam|national|team)$/,'');
 return nationalFlags[key]||nationalFlags[base]||'';
};
const mark=name=>{
 const n=String(name||'?'),k=n.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]/g,''),logo=logos[k],flag=flagFor(n),initial=n.trim().split(/\\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
 if(flag)return '<span class="v21-mark v22-flag" role="img" aria-label="ธงชาติ '+esc(n)+'"><span>'+flag+'</span></span>';
 return '<span class="v21-mark v22-crest">'+(logo?'<img src="'+logo+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'<b>'+esc(initial||'?')+'</b>')+'</span>';
};`;
main=main.slice(0,markStart)+replacement+main.slice(markEnd);
main=main.replace("const APP_VERSION='2.1';","const APP_VERSION='2.2';").replace("const PREVIOUS_APP_VERSION='1.33';","const PREVIOUS_APP_VERSION='2.1';").replaceAll('FOOTBALL RICH · BLACK & GOLD · V2.1','FOOTBALL RICH · BLACK & GOLD · V2.2').replace('<span class="tag">V2.1</span>','<span class="tag">V2.2</span>');
css=css.replace('.v21-mark img{width:100%;height:100%;object-fit:contain;background:#fff;padding:2px}', '.v21-mark{isolation:isolate}.v21-mark img{width:100%;height:100%;object-fit:contain;background:transparent;padding:0;mix-blend-mode:multiply}.v21-mark.v22-crest{background:#211d14}.v21-mark.v22-flag{background:#211d14;border-color:#66512b;font-size:31px;line-height:1}.v21-mark.v22-flag span{display:block;transform:translateY(-1px)}');
if(!css.includes('v22-flag')||!css.includes('mix-blend-mode:multiply'))throw Error('V2.2 crest/flag CSS patch failed');
html=html.replace('main.js?v=20261116-v2-1','main.js?v=20261116-v2-2');sw=sw.replaceAll('football-rich-shell-v42','football-rich-shell-v43');
fs.writeFileSync(mainPath,main);fs.writeFileSync(cssPath,css);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'2.2',release:'V2.2'}));
for(const marker of ["const APP_VERSION='2.2';",'const nationalFlags =','const flagFor =','v22-flag','v22-crest','england:',"japan:'🇯🇵'","brazil:'🇧🇷'"])if(!main.includes(marker))throw Error('V2.2 audit missing '+marker);
if(!html.includes('main.js?v=20261116-v2-2')||!sw.includes("football-rich-shell-v43"))throw Error('V2.2 cache-busting audit failed');
if(main.includes('indexedDB.deleteDatabase(')||main.includes('objectStore.clear('))throw Error('Destructive database operation detected');
console.log('V2.2 applied: white crest backgrounds blended into the dark tile; national-team flags mapped by country name and age-group suffix; database unchanged.');
