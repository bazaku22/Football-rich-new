import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'football-rich-v1/dist';
const mainFile = path.join(root, 'main.js');
const cssFile = path.join(root, 'styles/main.css');
const htmlFile = path.join(root, 'index.html');
const swFile = path.join(root, 'sw.js');
const main = fs.readFileSync(mainFile, 'utf8');
let css = fs.readFileSync(cssFile, 'utf8');
let html = fs.readFileSync(htmlFile, 'utf8');
let sw = fs.readFileSync(swFile, 'utf8');

// Route labels are rendered from the app's runtime navigation model; do not
// assume a particular source-array literal in the bundled/minified entry.
if (!main.includes("document.querySelector('#side-nav')")) {
  throw new Error('Existing delegated side navigation handler was not found');
}
if (!main.includes('frMobileBottomNavInstalled')) {
  const anchor = 'render().catch(showFatal);';
  const at = main.lastIndexOf(anchor);
  if (at < 0) throw new Error('Could not find app startup anchor for mobile navigation');
  const install = String.raw`
;(() => {
  if (window.frMobileBottomNavInstalled) return;
  window.frMobileBottomNavInstalled = true;
  const nav = document.querySelector('#side-nav');
  if (!nav) throw new Error('Primary navigation element is missing');
  const icons = {
    dashboard: '<svg class="fr-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    tools: '<svg class="fr-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 17h6m-3-3v6"/></svg>',
    performance: '<svg class="fr-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5m0 14h16"/><path d="m7 15 4-4 3 2 5-7"/></svg>',
    settings: '<svg class="fr-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z"/></svg>'
  };
  const labels = {dashboard:'หน้าหลัก',tools:'เครื่องมือ',performance:'ศูนย์วิเคราะห์',settings:'ตั้งค่า'};
  nav.querySelectorAll('[data-view]').forEach(button => {
    const key = button.dataset.view;
    if (!icons[key] || !labels[key]) return;
    button.classList.add('fr-primary-nav-item');
    button.setAttribute('aria-label', labels[key]);
    button.innerHTML = icons[key] + '<span class="fr-nav-label">' + labels[key] + '</span>';
  });
  document.documentElement.classList.add('fr-mobile-bottom-nav');
})();`;
  fs.writeFileSync(mainFile, main.slice(0, at) + install + '\n' + main.slice(at));
}

css += `
/* V3.9.10 — restrained Black & Gold mobile bottom navigation */
@media (max-width: 650px) {
  .fr-mobile-bottom-nav .sidebar {
    position: fixed !important;
    inset: auto 0 0 !important;
    z-index: 100 !important;
    display: block !important;
    width: 100% !important;
    height: auto !important;
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom)) !important;
    background: #15130f !important;
    border: 0 !important;
    border-top: 1px solid #493b24 !important;
  }
  .fr-mobile-bottom-nav .sidebar .brand,
  .fr-mobile-bottom-nav .sidebar .side-foot { display: none !important; }
  .fr-mobile-bottom-nav .sidebar nav {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 5px !important;
    width: 100% !important;
    overflow: visible !important;
  }
  .fr-mobile-bottom-nav .sidebar nav .nav-link {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 5px !important;
    min-width: 0 !important;
    min-height: 62px !important;
    padding: 6px 2px !important;
    border: 1px solid transparent !important;
    border-radius: 11px !important;
    background: transparent !important;
    color: #a79d89 !important;
    font-size: 10px !important;
    font-weight: 600 !important;
    line-height: 1.25 !important;
    white-space: nowrap !important;
    box-shadow: none !important;
    text-shadow: none !important;
    transform: none !important;
  }
  .fr-mobile-bottom-nav .sidebar nav .nav-link .fr-nav-icon {
    display: block !important;
    width: 22px !important;
    height: 22px !important;
    fill: none !important;
    stroke: currentColor !important;
    stroke-width: 1.7 !important;
    stroke-linecap: round !important;
    stroke-linejoin: round !important;
    flex: 0 0 auto !important;
  }
  .fr-mobile-bottom-nav .sidebar nav .nav-link.active {
    color: #e3c16c !important;
    background: #211c12 !important;
    border-color: #6a542d !important;
    box-shadow: none !important;
    text-shadow: none !important;
    filter: none !important;
  }
  .fr-mobile-bottom-nav .main-area {
    padding-bottom: calc(104px + env(safe-area-inset-bottom)) !important;
  }
}
`;
if (!html.includes('main.js?v=20261118-mobile-nav')) {
  if (!/main\.js(?:\?[^"']*)?/.test(html)) throw new Error('App entry script reference was not found');
  html = html.replace(/main\.js(?:\?[^"']*)?/, 'main.js?v=20261118-mobile-nav');
}
// J.League V3.9.11 may already have advanced the cache to v66.
 // Accept the verified pre-J.League v65 or post-J.League v66 state.
const hasV65 = sw.includes("const CACHE_NAME = 'football-rich-shell-v65'");
const hasV66 = sw.includes("const CACHE_NAME = 'football-rich-shell-v66'");
if (!hasV65 && !hasV66) {
  throw new Error('Expected V3.9.10/V3.9.11 service worker cache v65 or v66 was not found');
}
if (hasV65) sw = sw.replace("const CACHE_NAME = 'football-rich-shell-v65'", "const CACHE_NAME = 'football-rich-shell-v66'");
fs.writeFileSync(cssFile, css);
fs.writeFileSync(htmlFile, html);
fs.writeFileSync(swFile, sw);
console.log('V3.9.10 mobile navigation applied: four icon tabs, static gold selection, no glow, and refreshed PWA cache.');
