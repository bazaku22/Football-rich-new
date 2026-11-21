import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const dist = path.resolve('football-rich-v1/dist');
const require = createRequire(path.resolve('football-rich-v1/package.json'));
const { chromium } = require('playwright');
const mime = {
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.webmanifest':'application/manifest+json',
  '.json':'application/json'
};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const routePath = pathname.startsWith('/Football-rich-new/') ? pathname.slice('/Football-rich-new'.length) : pathname;
  const target = routePath === '/' ? path.join(dist, 'index.html') : path.resolve(dist, '.' + routePath);
  if (!target.startsWith(dist + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(target, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream', 'cache-control':'no-store' });
    res.end(data);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await chromium.launch({ headless:true, args:['--no-sandbox','--disable-dev-shm-usage'] });
  const context = await browser.newContext({ serviceWorkers:'block', viewport:{width:390,height:844} });
  const page = await context.newPage();
  await page.setViewportSize({ width:390, height:844 });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  await page.goto(origin, { waitUntil:'domcontentloaded' });
  await page.waitForSelector('.app-shell', { timeout:15000 });
  await page.waitForSelector('.v21-calendar', { timeout:15000 });

  const nav = page.locator('#side-nav');
  const scoutingButton = nav.locator('[data-view="scouting"]');
  await scoutingButton.waitFor({ state:'visible', timeout:5000 });
  assert.equal((await scoutingButton.innerText()).trim(), 'ดาวรุ่ง');
  const navInfo = await nav.evaluate(el => ({
    rootClass:document.documentElement.className,
    mobileViewport:matchMedia('(max-width: 650px)').matches,
    display:getComputedStyle(el).display,
    gridTemplateColumns:getComputedStyle(el).gridTemplateColumns
  }));
  console.log('Mobile navigation diagnostics:', JSON.stringify(navInfo));
  assert.ok(navInfo.rootClass.includes('fr-mobile-bottom-nav'), 'Mobile navigation enhancement must be installed');
  assert.equal(navInfo.mobileViewport, true, 'Browser test must run at mobile width');
  assert.equal(navInfo.display, 'grid', 'Mobile navigation must use the grid layout');
  assert.equal(await nav.locator('[data-view]').count(), 5, 'Mobile navigation must show five tabs');

  await scoutingButton.click();
  await page.waitForSelector('.scout-grid', { timeout:10000 });
  const cards = page.locator('.scout-card');
  assert.equal(await cards.count(), 4, 'Scouting must show exactly four watchlist players');
  const names = (await page.locator('.scout-card h3').allTextContents()).join(' ');
  for (const name of ['Nico Paz', 'Mikey Moore', 'Jonas Urbig', 'Shea Lacey']) {
    assert.ok(names.includes(name), 'Scouting card missing ' + name);
  }
  await cards.first().locator('[data-scout-open]').click();
  await page.waitForSelector('.scout-profile-hero', { timeout:5000 });
  await page.locator('[data-scout-back]').click();
  await page.waitForSelector('.scout-grid', { timeout:5000 });
  assert.deepEqual(pageErrors, [], 'No uncaught browser exceptions in Scouting navigation/profile flow');
  console.log('PASS Chromium V3.9.14: mobile five-tab navigation, all four Scouting cards, player profile and back navigation.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
