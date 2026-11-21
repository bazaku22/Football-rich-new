import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const mainPath = resolve(process.cwd(), 'dist/main.js');
const cssPath = resolve(process.cwd(), 'dist/styles/main.css');
const branchPath = resolve(here, 'match-center-branch.js.txt');
const cssPatchPath = resolve(here, 'match-center.css.txt');
let main = fs.readFileSync(mainPath, 'utf8');
const branch = fs.readFileSync(branchPath, 'utf8').trim();
const cssPatch = fs.readFileSync(cssPatchPath, 'utf8');

function replaceBetween(source, startAnchor, endAnchor, replacement, label) {
  const start = source.indexOf(startAnchor);
  if (start < 0) throw new Error('Match Center patch anchor missing: ' + label + ' start');
  const end = source.indexOf(endAnchor, start + startAnchor.length);
  if (end < 0) throw new Error('Match Center patch anchor missing: ' + label + ' end');
  return source.slice(0, start) + replacement + '\n    ' + source.slice(end);
}

const oldNav = "const navItems = [\n    ['dashboard', 'หน้าหลัก'], ['scouting', 'ดาวรุ่ง'], ['matches', 'คู่แข่งขัน'], ['import', 'นำเข้าวิเคราะห์'],\n    ['predictions', 'เดิมพัน'], ['results', 'ผลแข่งขัน'], ['performance', 'ผลงาน']\n];";
const newNav = "const navItems = [\n    ['dashboard', 'หน้าหลัก'], ['scouting', 'ดาวรุ่ง'], ['matches', 'แมตช์เซ็นเตอร์'], ['import', 'นำเข้าวิเคราะห์'],\n    ['predictions', 'เดิมพัน'], ['performance', 'ผลงาน']\n];";
if (!main.includes(oldNav)) throw new Error('Match Center navigation anchor missing');
main = main.replace(oldNav, newNav);
main = main.replaceAll('data-go="results"', 'data-go="matches"')
  .replaceAll('บันทึกผลจริง</b><small>กรอกสกอร์หลังจบเกม', 'แมตช์เซ็นเตอร์</b><small>ดูคู่ก่อนแข่งและผลหลังแข่ง');

main = replaceBetween(main, "else if (currentView === 'matches') {", "else if (currentView === 'research') {", branch, 'Match Center view');

const resultsStart = main.indexOf("else if (currentView === 'results') {");
if (resultsStart < 0) throw new Error('Legacy separate Results view was not found');
const performanceStart = main.indexOf("else if (currentView === 'performance') {", resultsStart);
if (performanceStart < 0) throw new Error('Performance view anchor after Results view was not found');
main = main.slice(0, resultsStart) + main.slice(performanceStart);

if (!fs.readFileSync(cssPath, 'utf8').includes('/* Football rich Match Center V1.2 */')) {
  fs.appendFileSync(cssPath, '\n' + cssPatch + '\n');
}
if (!main.includes('แมตช์เซ็นเตอร์') || main.includes("currentView === 'results'") || main.includes("['results', 'ผลแข่งขัน']") || !main.includes('football-rich-result')) {
  throw new Error('Match Center output audit failed');
}
fs.writeFileSync(mainPath, main);
console.log('Football rich Match Center V1.2 and Result JSON import applied.');
