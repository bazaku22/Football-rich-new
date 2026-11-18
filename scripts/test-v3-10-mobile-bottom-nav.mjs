import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2] || 'football-rich-v1/dist';
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
for (const marker of ['frMobileBottomNavInstalled','fr-nav-icon','หน้าหลัก','เครื่องมือ','ศูนย์วิเคราะห์','ตั้งค่า']) {
  if (!main.includes(marker)) throw new Error('Mobile navigation marker missing: ' + marker);
}
for (const marker of ['grid-template-columns: repeat(4, minmax(0, 1fr))','position: fixed !important','box-shadow: none !important','safe-area-inset-bottom']) {
  if (!css.includes(marker)) throw new Error('Mobile navigation CSS marker missing: ' + marker);
}
if (!html.includes('main.js?v=20261118-mobile-nav')) throw new Error('Cache-busted app entry missing');
if (!sw.includes("const CACHE_NAME = 'football-rich-shell-v65'")) throw new Error('Service worker cache version was not refreshed');
if (/\.nav-link\.active\s*\{[^}]*box-shadow:\s*(?!none)/s.test(css)) throw new Error('Active navigation must not glow');
console.log('V3.9.10 mobile navigation regression checks passed.');
