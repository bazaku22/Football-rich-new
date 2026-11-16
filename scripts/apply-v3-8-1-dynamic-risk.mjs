import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'football-rich-v1/dist';
const file=path.join(root,'main.js');
let s=fs.readFileSync(file,'utf8');
const old=" const risk=v=>{v=String(v||'').toLowerCase();return ['low','ต่ำ'].includes(v)?['ต่ำ','low']:['medium','moderate','กลาง'].includes(v)?['กลาง','medium']:['high','สูง'].includes(v)?['สูง','high']:['ยังประเมินไม่ได้','unknown'];};";
const helper=old+String.raw`
 const calculateCompositeRisk=a=>{
  if(!a)return null;
  const raw=a.sourceReport?.analysis||{};
  const p=a.probabilities||{};
  const home=Number.isFinite(p.homeWin)?p.homeWin:Number(raw.match_outcome_probabilities?.home_win);
  const draw=Number.isFinite(p.draw)?p.draw:Number(raw.match_outcome_probabilities?.draw);
  const away=Number.isFinite(p.awayWin)?p.awayWin:Number(raw.match_outcome_probabilities?.away_win);
  const cover=Number.isFinite(a.coverProbability)?a.coverProbability:Number(raw.cover_probability);
  if(![home,draw,away,cover].every(Number.isFinite)||Math.abs(home+draw+away-1)>.02||cover<0||cover>1)return null;
  const matchRisk=(1-Math.max(home,draw,away))*100;
  const ahRisk=(1-cover)*100;
  const confidence=Number(raw.data_confidence);
  let dataRisk;
  if(Number.isFinite(confidence)&&confidence>=0&&confidence<=100)dataRisk=100-confidence;
  else{
   const evidence=Array.isArray(a.evidence)?a.evidence:Array.isArray(raw.evidence)?raw.evidence:[];
   const hasMarket=Number.isFinite(Number(a.marketSnapshot?.decimal_odds))&&Number(a.marketSnapshot.decimal_odds)>1;
   const hasLine=Number.isFinite(Number(a.marketSnapshot?.handicap_line));
   const completeness=(30+25+(hasMarket?15:0)+(hasLine?15:0)+Math.min(evidence.length,5)*3);
   dataRisk=100-completeness;
  }
  const score=Math.max(0,Math.min(100,matchRisk*.4+ahRisk*.4+dataRisk*.2));
  return {score,matchRisk,ahRisk,dataRisk};
 };
 const compositeRiskLevel=score=>score<=34?['ต่ำ','low']:score<=64?['กลาง','medium']:['สูง','high'];`;
if(!s.includes(old))throw new Error('Risk helper anchor not found');
if(!s.includes('const calculateCompositeRisk=a=>'))s=s.replace(old,helper);
const oldExpr="cover=a?.coverProbability,riskScore=Number.isFinite(a?.sourceReport?.analysis?.risk_score)?Number(a.sourceReport.analysis.risk_score):null,level=riskScore!==null?(riskScore<=34?['ต่ำ','low']:riskScore<=64?['กลาง','medium']:['สูง','high']):risk(a?.riskLevel||a?.sourceReport?.analysis?.risk_level);";
const newExpr="cover=a?.coverProbability,compositeRisk=calculateCompositeRisk(a),riskScore=compositeRisk?.score??null,level=riskScore!==null?compositeRiskLevel(riskScore):['ยังประเมินไม่ได้','unknown'];";
if(!s.includes(oldExpr))throw new Error('Match card risk expression not found');
s=s.replace(oldExpr,newExpr);
s=s.replaceAll('V3.8','V3.8.1').replaceAll("const APP_VERSION='3.8'","const APP_VERSION='3.8.1'");
fs.writeFileSync(file,s);
const html=path.join(root,'index.html');let h=fs.readFileSync(html,'utf8');h=h.replace(/main\.js(?:\?[^"']*)?/g,'main.js?v=20261116-v3-8-1');fs.writeFileSync(html,h);
const sw=path.join(root,'sw.js');let w=fs.readFileSync(sw,'utf8');if(!w.includes("football-rich-shell-v54"))throw new Error('Expected SW v54');w=w.replaceAll('football-rich-shell-v54','football-rich-shell-v55');fs.writeFileSync(sw,w);
const vf=path.join(root,'app-version.json');const v=JSON.parse(fs.readFileSync(vf,'utf8'));if(v.version!=='3.8')throw new Error('Expected version 3.8');v.previous_version='3.8';v.version='3.8.1';v.release='V3.8.1-beta.1';fs.writeFileSync(vf,JSON.stringify(v,null,2)+'\n');
console.log('V3.8.1 dynamic composite risk calculation patched.');
