import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'football-rich-v1/dist';
const mainFile = path.join(root, 'main.js');
const htmlFile = path.join(root, 'index.html');
const swFile = path.join(root, 'sw.js');
const versionFile = path.join(root, 'app-version.json');
for (const file of [mainFile, htmlFile, swFile, versionFile]) {
  if (!fs.existsSync(file)) throw new Error('Required V3.9 file missing: ' + file);
}

let app = fs.readFileSync(mainFile, 'utf8');
const riskAnchor = " const risk=v=>{v=String(v||'').toLowerCase();return ['low','ต่ำ'].includes(v)?['ต่ำ','low']:['medium','moderate','กลาง'].includes(v)?['กลาง','medium']:['high','สูง'].includes(v)?['สูง','high']:['ยังประเมินไม่ได้','unknown'];};";
const helper = riskAnchor + String.raw