#!/usr/bin/env bash
set -euo pipefail

unzip -q -o football-rich-v1-test-candidate-0.5.0.zip -d .
cd football-rich-v1

# Keep the app entry, browser icon and Android install icon on the approved crown-and-trophy identity.
node --input-type=module <<'NODE'
import fs from 'node:fs';

const emblem = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F4D27B"/>
      <stop offset="0.52" stop-color="#B78B32"/>
      <stop offset="1" stop-color="#8A641F"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#121212"/>
  <path d="M76 160l92 66 88-116 88 116 92-66-38 184H114L76 160z" fill="url(#gold)" stroke="#F4D27B" stroke-width="12" stroke-linejoin="round"/>
  <circle cx="76" cy="146" r="24" fill="#F4D27B"/><circle cx="256" cy="88" r="24" fill="#F4D27B"/><circle cx="436" cy="146" r="24" fill="#F4D27B"/>
  <path d="M154 354h204v34H154z" fill="url(#gold)"/>
  <path d="M194 388h124v30H194z" fill="url(#gold)"/>
  <path d="M218 418h76v28h-76z" fill="url(#gold)"/>
  <path d="M154 258h-44v34c0 42 32 72 80 74M358 258h44v34c0 42-32 72-80 74" fill="none" stroke="#F4D27B" stroke-width="22" stroke-linecap="round"/>
  <path d="M196 246h120v80c0 42-27 72-60 72s-60-30-60-72v-80z" fill="#211D14" stroke="url(#gold)" stroke-width="16"/>
  <path d="M226 278l30 22 30-22-11 36 20 25h-78l20-25z" fill="url(#gold)"/>
</svg>`;
fs.writeFileSync('public/brand-emblem.svg', emblem);

const mainPath='src/main.ts';
let main=fs.readFileSync(mainPath,'utf8');
main=main.replaceAll('<div class="brand-mark">♛</div>','<div class="brand-mark"><img src="/brand-emblem.svg" alt="Football rich crown and trophy emblem"></div>');
main=main.replace('<div class="hero-emblem">♛<span>🏆</span></div>','<div class="hero-emblem"><img src="/brand-emblem.svg" alt="ตรามงกุฎและถ้วยรางวัล Football rich"></div>');
if (main.includes('♛') || main.includes('🏆')) throw new Error('Legacy text emblem remains in app UI');
fs.writeFileSync(mainPath,main);

const pwaPath='src/pwa.ts';
let pwa=fs.readFileSync(pwaPath,'utf8').replace("navigator.serviceWorker.register('/sw.js')","navigator.serviceWorker.register(new URL('./sw.js', import.meta.url), { scope: new URL('./', import.meta.url).pathname })");
fs.writeFileSync(pwaPath,pwa);

const swPath='public/sw.js';
let sw=fs.readFileSync(swPath,'utf8').replace('football-rich-shell-v5','football-rich-shell-v5');
if (!sw.includes('/brand-emblem.svg')) sw=sw.replace('const APP_SHELL = [', "const APP_SHELL = ['/brand-emblem.svg', ");
fs.writeFileSync(swPath,sw);

const manifestPath='public/manifest.webmanifest';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
manifest.icons=[
  {src:'/brand-emblem.svg',sizes:'any',type:'image/svg+xml',purpose:'any'},
  ...(manifest.icons||[])
];
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');

fs.appendFileSync('src/styles/main.css', `
/* Approved Football rich crown-and-trophy brand mark */
.brand-mark { display:flex; align-items:center; justify-content:center; }
.brand-mark img { display:block; width:42px; height:42px; object-fit:contain; border-radius:12px; }
.mobile-head .brand-mark img { width:38px; height:38px; }
.hero-emblem { display:flex; align-items:center; justify-content:center; }
.hero-emblem img { width:min(100%,220px); aspect-ratio:1; object-fit:contain; border-radius:28px; box-shadow:0 18px 52px #0008; }
`);
NODE

npm install --no-audit --no-fund
npm install --no-save --no-package-lock sharp
node --input-type=module <<'NODE'
import sharp from 'sharp';
await sharp('public/brand-emblem.svg').resize(192,192).png().toFile('public/icon-192.png');
await sharp('public/brand-emblem.svg').resize(512,512).png().toFile('public/icon-512.png');
console.log('Generated matching 192px and 512px Android PWA icons.');
NODE
sed -i 's/const first = -lowerMagnitude;/const first = lowerMagnitude === 0 ? 0 : -lowerMagnitude;/' src/domain/handicap.ts
npm run build

node --input-type=module <<'NODE'
import fs from 'node:fs';
const file='dist/index.html';
let html=fs.readFileSync(file,'utf8');
html=html.replace('<div id="app"></div>','<div id="app"><div class="boot-screen">กำลังเปิด Football rich…</div></div>');
html=html.replace('<script type="module" src="/main.js"></script>','<script type="module" src="main.js?v=20261115-bootfix-2" onerror="window.__footballRichModuleError=true"></script>');
if (!html.includes('rel="icon"')) html=html.replace('</head>','  <link rel="icon" type="image/svg+xml" href="/brand-emblem.svg" />\n  <link rel="apple-touch-icon" href="/icon-192.png" />\n</head>');
// Prevent an endless startup screen if the JavaScript module graph fails.
const bootGuard = `<script>
  window.__footballRichModuleError = false;
  window.addEventListener('error', () => { window.__footballRichModuleError = true; });
  window.addEventListener('unhandledrejection', () => { window.__footballRichModuleError = true; });
  window.setTimeout(() => {
    const app = document.getElementById('app');
    if (app && !app.querySelector('.app-shell')) {
      const detail = window.__footballRichModuleError
        ? 'ไฟล์ JavaScript หรือโมดูลที่จำเป็นโหลดไม่สำเร็จ'
        : 'แอปไม่สามารถเริ่มทำงานได้ภายในเวลาที่กำหนด';
      app.innerHTML = '<div class="boot-screen boot-error"><div><b>เปิด Football rich ไม่สำเร็จ</b><p>' + detail + '</p><button onclick="location.reload()">ลองโหลดใหม่</button><p>ข้อมูลที่บันทึกไว้ยังไม่ถูกลบ</p></div></div>';
    }
  }, 10000);
</script>`;
if (!html.includes('__footballRichBootGuardInstalled')) html = html.replace('</body>', bootGuard.replace('<script>', '<script>\n  window.__footballRichBootGuardInstalled = true;') + '</body>');
if (!html.includes('navigator.serviceWorker.register')) {
  const registration = `<script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(new URL('sw.js', document.baseURI), {
          scope: new URL('./', document.baseURI).pathname
        }).catch(error => console.error('Football rich service worker registration failed:', error));
      });
    }
  </script>`;
  html = html.replace('</body>', registration + '</body>');
}
fs.writeFileSync(file,html);
fs.appendFileSync('src/styles/main.css', '\n.boot-screen{min-height:100vh;display:grid;place-items:center;background:#121212;color:#F4D27B;font:600 16px system-ui,sans-serif}.boot-error{color:#ffb4a9;padding:24px;text-align:center}\n');
console.log('Brand icon, install icon, startup fallback and service worker registration prepared.');
NODE

# GitHub Pages project sites are served beneath /Football-rich-new/.
find dist -type f \( -name '*.html' -o -name '*.js' -o -name '*.webmanifest' -o -name '*.svg' \) -print0 |
  xargs -0 sed -i \
    -e 's|"/|"/Football-rich-new/|g' \
    -e "s|'/|'/Football-rich-new/|g"
