import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('dist/main.js','utf8');
const start=source.indexOf("if(!document.querySelector('#mc-detail-modal'))");
const endMarker="document.addEventListener('keydown',e=>{if(e.key==='Escape'&&detailModal.open)closeMatchDetail();});";
const end=source.indexOf(endMarker,start);
if(start<0||end<0) throw new Error('V1.31 detail controller block missing from generated main.js');
const controller=source.slice(start,end+endMarker.length);
class FakeElement {
 constructor(){this.handlers={};this.attributes={};}
 addEventListener(name,fn){this.handlers[name]=fn;}
 getAttribute(name){return this.attributes[name]||'';}
 closest(selector){return selector==='button[data-open-match-detail]'?this.button:null;}
 focus(){this.focused=true;}
}
class FakeDialog extends FakeElement {
 constructor(){super();this.open=false;this.insertCount=0;this.content={innerHTML:'',textContent:''};this.closeButton=new FakeElement();}
 showModal(){this.open=true;}
 close(){this.open=false;this.handlers.close?.();}
 querySelector(selector){return selector==='[data-detail-close]'?this.closeButton:null;}
}
const dialog=new FakeDialog(), listeners={}, bodyClasses=new Set();
const document={body:{insertAdjacentHTML(){dialog.insertCount++;},classList:{add:x=>bodyClasses.add(x),remove:x=>bodyClasses.delete(x)}},querySelector(selector){return selector==='#mc-detail-modal'?dialog:selector==='#mc-detail-content'?dialog.content:null;},addEventListener(name,fn){listeners[name]=fn;}};
const matches=[{id:'upcoming-1',league:'Test League',homeTeam:'Home Alpha',awayTeam:'Away Alpha',kickoffAt:'2026-11-20T18:00:00Z',status:'UPCOMING'},{id:'finished-2',league:'Test League',homeTeam:'Home Beta',awayTeam:'Away Beta',kickoffAt:'2026-11-19T18:00:00Z',status:'FINISHED'}];
const recordsBefore=JSON.stringify(matches);
const context={document,window:{},Element:FakeElement,console:{error(){},log(){}},records:async()=>({matches,results:[{matchId:'finished-2',homeGoals:2,awayGoals:1,importResultId:'result-2',revisionNumber:1,revisionHistory:[],events:[]}],analyses:[],predictions:[],evidence:[]}),esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmtDate:v=>String(v||'')};
vm.runInNewContext(controller,context);
assert.equal(dialog.insertCount,1,'modal must be created once');
const click=async id=>{const target=new FakeElement(),button=new FakeElement();button.attributes['data-open-match-detail']=id;target.button=button;listeners.click({target,preventDefault(){},stopImmediatePropagation(){}});assert.equal(dialog.open,true,'tap must synchronously open native dialog');await new Promise(resolve=>setImmediate(resolve));};
await click('upcoming-1');
assert.match(dialog.content.innerHTML,/Home Alpha/);assert.match(dialog.content.innerHTML,/Away Alpha/);
dialog.close();
await click('finished-2');
assert.match(dialog.content.innerHTML,/Home Beta/);assert.match(dialog.content.innerHTML,/2 – 1/);
assert.equal(JSON.stringify(matches),recordsBefore,'opening details must not mutate match records');
dialog.close();await click('upcoming-1');assert.match(dialog.content.innerHTML,/Home Alpha/);
assert.equal(dialog.insertCount,1,'reopening must not create duplicate dialogs');
console.log('V1.31 runtime interaction tests passed: upcoming, finished, correct match isolation, repeated open-close, single dialog, records unchanged.');
