import fs from 'node:fs';
import assert from 'node:assert/strict';

const manifest=JSON.parse(fs.readFileSync('assets/club-logos/manifest.json','utf8'));
assert.equal(manifest.teams.length,114,'Expected the full 114-club soccer manifest');

const unique=new Map();
for(const team of manifest.teams){
  assert.ok(/^https:\/\/a\.espncdn\.com\/i\/teamlogos\/soccer\/500\/\d+\.png$/.test(team.logo_url),'Unexpected static logo URL for '+team.team);
  if(!unique.has(team.logo_url))unique.set(team.logo_url,[]);
  unique.get(team.logo_url).push(team.team);
}
assert.equal(unique.size,114,'Each club should have its own static image URL');

const entries=[...unique.entries()];
const failures=[];
let cursor=0;
async function worker(){
  while(cursor<entries.length){
    const index=cursor++;
    const [url,clubs]=entries[index];
    let lastError='';
    for(let attempt=1;attempt<=2;attempt++){
      try{
        const response=await fetch(url,{
          headers:{
            'Accept':'image/png,image/*;q=0.9,*/*;q=0.8',
            'User-Agent':'Mozilla/5.0 (compatible; FootballRichLogoAudit/1.0)'
          },
          signal:AbortSignal.timeout(15000)
        });
        if(!response.ok){
          lastError='HTTP '+response.status;
          await response.arrayBuffer().catch(()=>{});
          continue;
        }
        const type=(response.headers.get('content-type')||'').toLowerCase();
        const bytes=new Uint8Array(await response.arrayBuffer());
        const png=bytes.length>=8&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a;
        if(!png){
          lastError='Response is not a PNG image (content-type: '+(type||'missing')+', bytes: '+bytes.length+')';
          continue;
        }
        lastError='';
        break;
      }catch(error){
        lastError=String(error?.message||error);
      }
    }
    if(lastError)failures.push({clubs,url,error:lastError});
  }
}
await Promise.all(Array.from({length:8},()=>worker()));
if(failures.length){
  console.error('Club crest image URL audit failed for '+failures.length+' of '+entries.length+' assets:');
  for(const item of failures)console.error(JSON.stringify(item));
  process.exitCode=1;
}else{
  console.log('Club crest image URL audit passed: all '+entries.length+' unique static PNG files returned valid PNG image data.');
}
