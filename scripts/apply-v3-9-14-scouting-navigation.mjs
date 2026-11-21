import fs from 'node:fs';

const root = 'football-rich-v1/dist';
const mainPath = root + '/main.js';
const cssPath = root + '/styles/main.css';
const htmlPath = root + '/index.html';
const swPath = root + '/sw.js';
const versionPath = root + '/app-version.json';

let main = fs.readFileSync(mainPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');
let html = fs.readFileSync(htmlPath, 'utf8');
let sw = fs.readFileSync(swPath, 'utf8');
const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

if (version.version !== '3.9.13' || !main.includes("const APP_VERSION='3.9.13';")) {
  throw new Error('Expected final V3.9.13 bundle before applying Scouting navigation');
}
if (!main.includes("const SCOUTING_SETTING_KEY = 'young_talent_watchlist_v1'") ||
    !main.includes('async function getScoutingPlayers()') ||
    !main.includes('function scoutingJersey(') ||
    !main.includes('function scoutingPhoto(') ||
    !main.includes('function scoutingCrest(') ||
    !main.includes("import { sortScoutingPlayers } from './domain/scouting-ranking.js';")) {
  throw new Error('Young Talent Scouting data/helpers are missing from the final bundle');
}
if (!sw.includes("const CACHE_NAME = 'football-rich-shell-v68'")) {
  throw new Error('Expected final V3.9.13 service-worker cache v68');
}

// The legacy V1.1 build transformation replaces the compiled render function
// after the source-level Scouting patch. Restore the complete Scouting branch
// into the final bundle, after all legacy UI transformations have finished.
const branchSource = fs.readFileSync('scripts/young-talent-branch.txt', 'utf8');
const startMarker = "} else if(currentView==='scouting') {";
const endMarker = "} else if(currentView==='matches') {";
const start = branchSource.indexOf(startMarker);
const end = branchSource.lastIndexOf(endMarker);
if (start < 0 || end <= start) throw new Error('Young Talent Scouting render branch source is incomplete');
let branchBody = branchSource.slice(start + startMarker.length, end);
branchBody = branchBody
  .replace(/document\.querySelector<[A-Za-z]+>\\(/g, 'document.querySelector(')
  .replace(/\)!\.addEventListener/g, ').addEventListener')
  .replace(/e\.currentTarget as HTMLFormElement/g, 'e.currentTarget')
  .replace(/item\.dataset\.search!/g, 'item.dataset.search');
if (/querySelector<[A-Za-z]+>|currentTarget as |dataset\.search!/.test(branchBody)) {
  throw new Error('TypeScript-only syntax remains in the Scouting render branch');
}
const renderAnchor = "else if (currentView === 'research') {";
if (!main.includes(renderAnchor)) throw new Error('Final render insertion point (research view) was not found');
if (main.includes("else if (currentView === 'scouting') {")) {
  throw new Error('Scouting render branch unexpectedly already exists; refusing duplicate insertion');
}
main = main.replace(renderAnchor, "else if (currentView === 'scouting') {" + branchBody + "\n    } " + renderAnchor);

// Restore the missing menu item in the final compiled navigation.
const navOld = "['dashboard', 'หน้าหลัก'], ['tools', 'เครื่องมือ'], ['performance', 'ศูนย์วิเคราะห์'], ['settings', 'ตั้งค่า']";
const navNew = "['dashboard', 'หน้าหลัก'], ['scouting', 'ดาวรุ่ง'], ['tools', 'เครื่องมือ'], ['performance', 'ศูนย์วิเคราะห์'], ['settings', 'ตั้งค่า']";
if (main.includes(navOld)) main = main.replace(navOld, navNew);
else if (!main.includes("['scouting', 'ดาวรุ่ง']")) throw new Error('Could not add Scouting to the final navigation array');

const iconAnchor = '  const icons = {\n';
const scoutingIcon = '    scouting: \'<svg class="fr-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/></svg>\',\n';
if (!main.includes("scouting: '<svg class=\\"fr-nav-icon\\"")) {
  if (!main.includes(iconAnchor)) throw new Error('Mobile navigation icon map was not found');
  main = main.replace(iconAnchor, iconAnchor + scoutingIcon);
}
const labelsOld = "const labels = {dashboard:'หน้าหลัก',tools:'เครื่องมือ',performance:'ศูนย์วิเคราะห์',settings:'ตั้งค่า'};";
const labelsNew = "const labels = {dashboard:'หน้าหลัก',scouting:'ดาวรุ่ง',tools:'เครื่องมือ',performance:'ศูนย์วิเคราะห์',settings:'ตั้งค่า'};";
if (main.includes(labelsOld)) main = main.replace(labelsOld, labelsNew);
else if (!main.includes("scouting:'ดาวรุ่ง'")) throw new Error('Mobile navigation Scouting label was not found');

const fourColumns = 'grid-template-columns: repeat(4, minmax(0, 1fr)) !important;';
if (css.includes(fourColumns)) css = css.replace(fourColumns, 'grid-template-columns: repeat(5, minmax(0, 1fr)) !important;');
else if (!css.includes('grid-template-columns: repeat(5, minmax(0, 1fr)) !important;')) {
  throw new Error('Mobile navigation grid rule was not found');
}

// Version the final entry and PWA shell so installed clients must fetch the
// Scouting-enabled bundle. Existing IndexedDB stores and records are untouched.
main = main.replace("const APP_VERSION='3.9.13';", "const APP_VERSION='3.9.14';");
main = main.replace("const PREVIOUS_APP_VERSION='3.9.6';", "const PREVIOUS_APP_VERSION='3.9.13';");
main = main.replaceAll('V3.9.2', 'V3.9.14');
main = main.replaceAll('FOOTBALL RICH · BLACK & GOLD · V3.9.2', 'FOOTBALL RICH · BLACK & GOLD · V3.9.14');
html = html.replace(/main\.js\\?v=[^"']+/, 'main.js?v=20261121-v3-9-14-scouting');
if (!html.includes('main.js?v=20261121-v3-9-14-scouting')) throw new Error('Could not cache-bust the final app entry');

const oldRegistration = `if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(new URL('sw.js', document.baseURI), {
          scope: new URL('./', document.baseURI).pathname
        }).catch(error => console.error('Football rich service worker registration failed:', error));
      });
    }`;
const newRegistration = `if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        const hadController = !!navigator.serviceWorker.controller;
        let refreshing = false;
        if (hadController) {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
          });
        }
        try {
          const registration = await navigator.serviceWorker.register(new URL('sw.js', document.baseURI), {
            scope: new URL('./', document.baseURI).pathname
          });
          await registration.update();
        } catch (error) {
          console.error('Football rich service worker registration failed:', error);
        }
      });
    }`;
if (html.includes(oldRegistration)) html = html.replace(oldRegistration, newRegistration);
else if (!html.includes('await registration.update()') || !html.includes("addEventListener('controllerchange'")) {
  throw new Error('Could not install the automatic PWA update check/reload handler');
}

sw = sw.replace("const CACHE_NAME = 'football-rich-shell-v68'", "const CACHE_NAME = 'football-rich-shell-v69'");
if (!sw.includes("const CACHE_NAME = 'football-rich-shell-v69'")) throw new Error('Service worker cache was not advanced to v69');
if (!sw.includes("self.skipWaiting()") || !sw.includes('self.clients.claim()')) {
  throw new Error('Service worker must activate the new shell immediately');
}
if (!sw.includes("'/Football-rich-new/domain/scouting-ranking.js'")) {
  throw new Error('Scouting ranking module is missing from the service-worker app shell');
}
if (!main.includes("else if (currentView === 'scouting') {") ||
    !main.includes("['scouting', 'ดาวรุ่ง']") ||
    !main.includes("scouting:'ดาวรุ่ง'")) {
  throw new Error('Final Scouting view or navigation was not restored');
}
for (const name of ['Nico Paz', 'Mikey Moore', 'Jonas Urbig', 'Shea Lacey']) {
  if (!main.includes(name)) throw new Error('Scouting watchlist player missing: ' + name);
}
if (!css.includes('.scout-grid') || !css.includes('.scout-card')) {
  throw new Error('Scouting UI styles are missing');
}
if (main.includes('indexedDB.deleteDatabase(') || main.includes('objectStore.clear(')) {
  throw new Error('Destructive local-data operation detected');
}

version.version = '3.9.14';
version.previous_version = '3.9.13';
version.release = 'V3.9.14 — Young Talent Scouting UI restored; automatic PWA update';
fs.writeFileSync(mainPath, main);
fs.writeFileSync(cssPath, css);
fs.writeFileSync(htmlPath, html);
fs.writeFileSync(swPath, sw);
fs.writeFileSync(versionPath, JSON.stringify(version, null, 2) + '\n');
console.log('V3.9.14 applied: Scouting navigation + render branch restored after legacy UI build, mobile 5-tab navigation, cache v69, explicit SW update check/reload, no IndexedDB reset.');
