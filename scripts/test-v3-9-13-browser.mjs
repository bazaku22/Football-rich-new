import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const dist=path.resolve('football-rich-v1/dist');
const require=createRequire(path.resolve('football-rich-v1/package.json'));
const {chromium}=require('playwright');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const routePath=pathname.startsWith('/Football-rich-new/')?pathname.slice('/Football-rich-new'.length):pathname;
  const target=routePath==='/'?path.join(dist,'index.html'):path.resolve(dist,'.'+routePath);
  if(!target.startsWith(dist+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream','cache-control':'no-store'});res.end(data);});
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=server.address();
const origin=`http://127.0.0.1:${address.port}`;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({serviceWorkers:'block'});
 try{await context.grantPermissions(['clipboard-read','clipboard-write'],{origin});}catch{}
 const page=await context.newPage();
 const pageErrors=[],requestFailures=[],consoleErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.stack||e.message));
 page.on('requestfailed',r=>requestFailures.push(r.url()+': '+r.failure()?.errorText));
 page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
 await page.goto(origin,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.app-shell',{timeout:15000}).catch(async()=>{
  throw new Error('App shell did not start. pageErrors='+JSON.stringify(pageErrors)+' requestFailures='+JSON.stringify(requestFailures)+' consoleErrors='+JSON.stringify(consoleErrors)+' body='+(await page.locator('body').innerText()));
 });
 await page.waitForSelector('.v21-calendar',{timeout:15000}).catch(async()=>{
  throw new Error('Dashboard did not finish rendering. pageErrors='+JSON.stringify(pageErrors)+' requestFailures='+JSON.stringify(requestFailures)+' consoleErrors='+JSON.stringify(consoleErrors)+' body='+(await page.locator('body').innerText()));
 }); // app finished opening its own IndexedDB schema
 await page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('football-rich-local',1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  const tx=db.transaction('matches','readwrite');
  tx.objectStore('matches').put({id:'ci-v3913-manual-match',league:'CI Test League',homeTeam:'Home Test FC',awayTeam:'Away Test FC',kickoffAt:new Date().toISOString(),status:'SCHEDULED',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
  db.close();
 });
 await page.reload({waitUntil:'domcontentloaded'});
 const copy=page.locator('[data-v39-copy-id="ci-v3913-manual-match"]');
 await copy.waitFor({state:'visible',timeout:15000});
 await copy.click();
 await page.waitForFunction(()=>document.querySelector('[data-v39-copy-id="ci-v3913-manual-match"]')?.textContent.includes('คัดลอกแล้ว'),null,{timeout:5000});
 const copied=await page.evaluate(()=>navigator.clipboard.readText());
 assert.equal(copied,'ci-v3913-manual-match','Match ID must really reach the clipboard');
 console.log('PASS Chromium: Match ID copied to system clipboard');

 const openForm=async()=>{
  const form=page.locator('form.v39-manual-form[data-v39-match-id="ci-v3913-manual-match"]');
  await form.waitFor({state:'attached',timeout:10000});
  // The manual-entry form is intentionally inside a collapsed <details>.
  // Expand it before interacting, just as a user would on Android.
  const disclosure=page.locator('details.v39-manual-entry').filter({has:form});
  await disclosure.locator('summary').click();
  await form.locator('input[name="home_goals"]').waitFor({state:'visible',timeout:5000});
  await form.locator('input[name="home_goals"]').fill('2');
  await form.locator('input[name="away_goals"]').fill('1');
  return form;
 };
 let form=await openForm();
 await form.locator('input[name="minute"]').fill('32');
 await form.locator('input[name="scorer"]').fill('Test Scorer');
 await form.locator('input[name="assist"]').fill('Test Assist');
 await form.locator('button[type="submit"]').click();
 await page.locator('#confirm-result-import').waitFor({state:'visible',timeout:10000});
 assert.match(await page.locator('#result-import-message').textContent(),/ตรวจสอบไฟล์ผ่าน/);
 await page.locator('#confirm-result-import').click();
 await page.waitForFunction(async()=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('football-rich-local',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const tx=db.transaction(['matches','match_results'],'readonly');
  const match=await new Promise((resolve,reject)=>{const r=tx.objectStore('matches').get('ci-v3913-manual-match');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const result=await new Promise((resolve,reject)=>{const r=tx.objectStore('match_results').getAll();r.onsuccess=()=>resolve(r.result.find(x=>x.matchId==='ci-v3913-manual-match'));r.onerror=()=>reject(r.error);});
  db.close();return !!match&&match.status==='FINISHED'&&!!result&&result.homeGoals===2&&result.awayGoals===1&&result.events?.[0]?.scorer==='Test Scorer';
 },null,{timeout:10000});
 console.log('PASS Chromium: manual score, goal event and FINISHED status persisted in IndexedDB');

 await page.locator('[data-view="dashboard"]').click();
 form=page.locator('form.v39-manual-form[data-v39-match-id="ci-v3913-manual-match"]');
 await form.waitFor({state:'attached',timeout:10000});
 const correctionDisclosure=page.locator('details.v39-manual-entry').filter({has:form});
 await correctionDisclosure.locator('summary').click();
 await form.locator('input[name="home_goals"]').waitFor({state:'visible',timeout:5000});
 await form.locator('input[name="home_goals"]').fill('3');
 await form.locator('input[name="away_goals"]').fill('2');
 await form.locator('button[type="submit"]').click();
 await page.locator('#allow-result-correction').waitFor({state:'visible',timeout:10000});
 await page.locator('#allow-result-correction').check();
 await page.locator('#confirm-result-import').click();
 await page.waitForFunction(async()=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('football-rich-local',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const tx=db.transaction('match_results','readonly');
  const result=await new Promise((resolve,reject)=>{const r=tx.objectStore('match_results').getAll();r.onsuccess=()=>resolve(r.result.find(x=>x.matchId==='ci-v3913-manual-match'));r.onerror=()=>reject(r.error);});
  db.close();return !!result&&result.homeGoals===3&&result.awayGoals===2&&Array.isArray(result.revisionHistory)&&result.revisionHistory.length===1&&result.revisionHistory[0].homeGoals===2&&result.revisionHistory[0].awayGoals===1;
 },null,{timeout:10000});
 console.log('PASS Chromium: result correction retained previous score in revisionHistory');

 assert.deepEqual(pageErrors,[],'No uncaught browser exceptions during V3.9.13 interactions');
 console.log('PASS V3.9.13 Chromium interaction suite');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
