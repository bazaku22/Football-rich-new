import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('dist/main.js','utf8');
const html=fs.readFileSync('dist/index.html','utf8');
const sw=fs.readFileSync('dist/sw.js','utf8');
const version=JSON.parse(fs.readFileSync('dist/app-version.json','utf8'));
assert.equal(version.version,'1.32');
assert.ok(html.includes('main.js?v=20261116-v1-32'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v40'"));

// These are the exact two templates in the built Match Center renderer.
const actualTemplate='data-open-match-detail="\' + esc(m.id) + \'">';
assert.equal(source.split(actualTemplate).length-1,2,'actual upcoming and finished renderer buttons must both carry the detail selector');
assert.ok(source.includes('V1.32: robust delegated tap handler'));
assert.ok(source.includes('if(!detailModal || !detailContent) throw new Error'));
assert.ok(!source.includes('onclick="window.__footballRichOpenMatchDetail('));

const start=source.indexOf("if(!document.querySelector('#mc-detail-modal'))");
const endMarker="document.addEventListener('keydown',e=>{if(e.key==='Escape'&&detailModal.open)closeMatchDetail();});";
const end=source.indexOf(endMarker,start);
if(start<0||end<0) throw new Error('V1.32 detail controller block missing');
const controller=source.slice(start,end+endMarker.length);

class FakeElement {
  constructor(attrs={}){this.handlers={};this.attributes=attrs;this.nodeType=1;this.parentElement=null;}
  addEventListener(name,fn){this.handlers[name]=fn;}
  getAttribute(name){return this.attributes[name]||'';}
  closest(selector){return selector==='button[data-open-match-detail]' && this.attributes['data-open-match-detail'] ? this : null;}
  focus(){this.focused=true;}
}
class FakeDialog extends FakeElement {
  constructor(){super();this.open=false;this.insertCount=0;this.content={innerHTML:'',textContent:''};this.closeButton=new FakeElement();}
  showModal(){this.open=true;}
  close(){this.open=false;this.handlers.close?.();}
  querySelector(selector){return selector==='[data-detail-close]'?this.closeButton:null;}
}
const dialog=new FakeDialog(), listeners={}, bodyClasses=new Set(); let modalInserted=false;
const document={body:{insertAdjacentHTML(){dialog.insertCount++;modalInserted=true;},classList:{add:x=>bodyClasses.add(x),remove:x=>bodyClasses.delete(x)}},querySelector(selector){return selector==='#mc-detail-modal'?(modalInserted?dialog:null):selector==='#mc-detail-content'?dialog.content:null;},addEventListener(name,fn){listeners[name]=fn;}};
const matches=[{id:'upcoming-1',league:'Test League',homeTeam:'Home Alpha',awayTeam:'Away Alpha',kickoffAt:'2026-11-20T18:00:00Z',status:'UPCOMING'},{id:'finished-2',league:'Test League',homeTeam:'Home Beta',awayTeam:'Away Beta',kickoffAt:'2026-11-19T18:00:00Z',status:'FINISHED'}];
const recordsBefore=JSON.stringify(matches);
const context={document,window:{},Element:FakeElement,console:{error(){},log(){}},records:async()=>({matches,results:[{matchId:'finished-2',homeGoals:2,awayGoals:1,importResultId:'result-2',revisionNumber:1,revisionHistory:[],events:[]}],analyses:[],predictions:[],evidence:[]}),esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmtDate:v=>String(v||'')};
vm.runInNewContext(controller,context);
assert.equal(dialog.insertCount,1);

// Construct the tapped buttons from the actual selector shape extracted above,
// rather than inventing a different attribute or selector for the test.
const upcomingHtml=actualTemplate.replace("' + esc(m.id) + '", 'upcoming-1');
const finishedHtml=actualTemplate.replace("' + esc(m.id) + '", 'finished-2');
assert.match(upcomingHtml,/data-open-match-detail="upcoming-1"/);
assert.match(finishedHtml,/data-open-match-detail="finished-2"/);
const click=async htmlButton=>{
  const id=htmlButton.match(/data-open-match-detail="([^"]+)"/)?.[1];
  const button=new FakeElement({'data-open-match-detail':id});
  listeners.click({target:button,preventDefault(){this.prevented=true;}});
  assert.equal(dialog.open,true,'real-renderer button tap must synchronously open native dialog');
  await new Promise(resolve=>setImmediate(resolve));
};
await click(upcomingHtml);
assert.match(dialog.content.innerHTML,/Home Alpha/);assert.match(dialog.content.innerHTML,/Away Alpha/);
dialog.close();
await click(finishedHtml);
assert.match(dialog.content.innerHTML,/Home Beta/);assert.match(dialog.content.innerHTML,/2 – 1/);
assert.equal(JSON.stringify(matches),recordsBefore,'opening details must not mutate records');
dialog.close();await click(upcomingHtml);assert.match(dialog.content.innerHTML,/Home Alpha/);
assert.equal(dialog.insertCount,1,'reopening must not create duplicate dialogs');
console.log('V1.32 renderer-backed tests passed: both actual templates, upcoming + finished, correct match isolation, repeated open/close, one dialog, records unchanged.');
