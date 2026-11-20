# Football rich — Analysis Improvement V1.1

**สถานะ:** Draft implementation specification — ยังไม่ใช่การเปลี่ยนสูตรที่ผ่านการยืนยัน  
**ฐานระบบ:** Football rich V3.9.13 / Analysis Engine V3.0  
**ขอบเขต:** ปรับ workflow การวิเคราะห์ก่อนแข่งและการประเมินหลังแข่ง โดยรักษาข้อมูลเดิมและ schema import v1.0.0 ให้เข้ากันได้

## 1. เป้าหมาย

1. แยกความน่าจะเป็น 1X2 ออกจากความน่าจะเป็นการชำระ Asian Handicap อย่างเด็ดขาด
2. ลดการประเมินโอกาสชนะขาดและความเสี่ยงของ AH ต่ำกว่าความเป็นจริง
3. ตรวจสอบทีมรองอย่างเป็นระบบก่อนเลือกทีมต่อ
4. แสดงความไม่แน่นอนและงดเลือกได้เมื่อหลักฐานไม่พอ
5. ตรวจสอบความแม่นยำจากข้อมูลสะสม โดยไม่ปรับโมเดลจากผลไม่กี่คู่
6. รักษาหน้าวิเคราะห์ในแอปให้สั้นเพียง 3 ข้อ

## 2. สิ่งที่มีอยู่แล้วและต้องนำกลับมาใช้

- Analysis Engine V3.0 มีการแยก 1X2, AH settlement 5 สถานะ, Risk Score, Data Confidence, candidate handicaps และ model calibration
- Analysis Performance Center V1.0 มีการเชื่อม Match ID, analysis snapshots, verified results, confirmed predictions, Brier scores, error review labels และ learning suggestions
- ระบบเดิมกำหนดให้ suggestions เป็น rule-based, ต้องมีอย่างน้อย 8 ตัวอย่างต่อกลุ่มและต้องได้รับการอนุมัติจากผู้ใช้ก่อนใช้เป็น guideline
- ระบบเก็บข้อมูลใน IndexedDB แบบ local-first และมี JSON backup/restore

V1.1 ต้องต่อยอดของเดิม ห้ามสร้างประวัติการแข่งขันชุดที่สองหรือระบบผลการแข่งขันซ้ำซ้อน

## 3. กติกาการวิเคราะห์ก่อนแข่ง

### 3.1 แยกผลลัพธ์คนละมิติ

ทุกคู่ต้องรายงาน:
- 1X2: home win / draw / away win รวม 100%
- AH settlement: full win / half win / push / half loss / full loss รวม 100%
- AH positive settlement probability = full win + half win
- Full-win probability แสดงแยกจาก positive settlement
- ความเสี่ยงชนะไม่ขาด, เสมอ, แพ้ และความเสี่ยงของเส้น AH
- Data Confidence และ Risk Score เป็นคนละค่าและห้ามคำนวณแทนกัน

ห้ามใช้โอกาสชนะ 1X2 เป็นตัวแทน AH cover probability

### 3.2 ผลต่างประตูและ AH สูง

ใช้ score matrix เดียวกับ 1X2 เพื่อคำนวณการกระจายผลต่างประตูอย่างน้อย:
- ชนะ 1 ประตู
- ชนะ 2 ประตู
- ชนะ 3 ประตู
- ชนะ 4 ประตูขึ้นไป
- เสมอ
- แพ้

ประเมินความเสี่ยงเป็นพิเศษสำหรับ AH ตั้งแต่ -1.0 และเส้นสูง เช่น -2.0, -2.5, -3.0

ห้ามอนุมานว่าทีมใหญ่หรืออันดับสูงจะชนะขาดโดยอัตโนมัติ และห้ามเลือกเส้นที่สูงกว่าเพียงเพราะโอกาสชนะ 1X2 สูง

### 3.3 วิเคราะห์ทีมรองก่อนเลือกทีมต่อ

ตรวจสอบฟอร์มและคุณภาพคู่แข่ง, เหย้า/เยือน, การตั้งรับ, transition/counterattack, การป้องกันพื้นที่อันตราย, ความสามารถทำประตูจากโอกาสน้อย และ tactical matchup

ต้องเขียนข้อได้เปรียบของทีมรองอย่างน้อยหนึ่งประเด็น หรือระบุว่าไม่พบหลักฐานที่น่าเชื่อถือ ห้ามละเว้นการวิเคราะห์ทีมรอง

### 3.4 ตรวจสอบหลักฐานและความพร้อม

ใช้ season baseline ร่วมกับฟอร์มล่าสุดที่ปรับตามคุณภาพคู่แข่ง หลีกเลี่ยงการให้น้ำหนักเกมเดียวมากเกินไปและการนับผลกระทบผู้เล่นซ้ำ

เมื่อมี 11 ตัวจริงอย่างเป็นทางการ ให้ตรวจ:
- ผู้เล่นหลักที่ขาด/กลับมา
- ตำแหน่งและบทบาทที่เปลี่ยน
- ความสมดุลเกมรุก/รับ
- ความพร้อมกองหน้าและผู้สร้างโอกาส
- โปรแกรมถี่และเวลาพัก

ระบุข้อมูลเป็น confirmed / probable / unknown พร้อมแหล่งและเวลาตรวจสอบ ห้ามคาดเดาตัวจริงหรือข่าวบาดเจ็บ

### 3.5 Scenario stress test

ก่อนสรุปทุกคู่ ให้ทดสอบความเปราะบางของคำทำนายภายใต้สถานการณ์:
1. ทีมรองขึ้นนำก่อน
2. ทีมต่อขึ้นนำก่อน
3. ยังเสมอในช่วงครึ่งหลัง
4. มีใบแดง
5. ผู้เล่นหลักบาดเจ็บ

นี่คือการตรวจความไวของคำทำนาย ไม่ใช่การทำนายว่าเหตุการณ์จะเกิด และห้ามนำเหตุการณ์สมมติมาบวก/ลบเปอร์เซ็นต์ฐานโดยไม่มีแบบจำลองที่รองรับ ให้บันทึกว่าคำแนะนำยังคงทนหรือเปราะบางต่อสถานการณ์ใด

## 4. No Bet / Pass policy

ต้องเลือก PASS หรือ NO RECOMMENDATION เมื่อ:
- ข้อมูลหลักไม่พอสร้าง Expected Goals/score matrix อย่างมีเหตุผล
- ไม่มีเส้นตลาดที่ตรวจสอบได้สำหรับ AH ที่เสนอ
- ตัวจริงหรือข่าวทีมที่มีผลสูงยังไม่ชัดเจน
- หลักฐานสำคัญขัดแย้งกันจนไม่สามารถประเมินได้อย่างน่าเชื่อถือ
- ความน่าจะเป็น AH ไม่มีข้อมูลรองรับหรือ risk เป็น undetermined

ห้ามกำหนด threshold ความน่าจะเป็นใหม่โดยพลการใน V1.1 และห้ามอ้างว่าเกณฑ์ LOW/MEDIUM/HIGH ผ่านการ calibration แล้วจนกว่าจะมีผลทดสอบเพียงพอ

## 5. การเลือก AH

- วิเคราะห์ฝั่งทีมต่อที่ผู้ใช้ให้ความสำคัญเป็นหลัก แต่ตรวจสอบฝั่งตรงข้ามเป็น sanity check
- ใช้เฉพาะ handicap line ที่ตรวจสอบจากตลาดจริง พร้อม source และ checked_at
- แสดง 5 settlement outcomes ทุกครั้งที่ข้อมูลเพียงพอ
- แยก full win, half win และ push อย่างชัดเจน
- ไม่บังคับเลือกทุกคู่; PASS เป็นผลลัพธ์ที่ถูกต้อง
- ไม่ใช้ Fair Odds, EV, Value Bet, odds payout หรือผลตอบแทนเป็นเกณฑ์ตัดสินใจ

## 6. รูปแบบข้อความในแอป

ช่องวิเคราะห์ที่ผู้ใช้เห็นต้องมี 3 ข้อเท่านั้น:

1. ภาพรวมการแข่งขัน — ความได้เปรียบของทั้งสองทีม รวมจุดแข็งทีมรองที่สำคัญ
2. AH — เส้นที่ประเมิน, positive settlement probability, full-win/half-win/push ที่เกี่ยวข้อง และระดับความเสี่ยง
3. สรุป — เลือกฝั่งที่มีหลักฐานรองรับ หรือ PASS พร้อมเหตุผลสั้น ๆ

รายละเอียดเชิงลึก, scenario stress test, evidence และ error diagnosis เก็บในข้อมูลวิเคราะห์/Performance Center ไม่ยัดลงข้อความ 3 ข้อ

## 7. Post-match evaluation

ห้ามเขียนทับ pre-match analysis หรือ confirmed prediction snapshot

หลังผลแข่งขันยืนยันแล้ว ให้ประเมิน:
- 1X2 forecast เทียบผลจริง
- AH line และ settlement outcome จริง (full win / half win / push / half loss / full loss)
- 1X2 และ AH Brier Score เมื่อมี probability snapshot
- ผลต่างประตูจริงเทียบการกระจายที่คาด
- สถานการณ์ระหว่างเกมที่เกิดขึ้นจริง
- ข้อมูลก่อนแข่งที่มี/ไม่มีในเวลาวิเคราะห์
- สาเหตุที่เป็นไปได้และระดับความมั่นใจในการระบุสาเหตุ

จัดหมวดหมู่ A–G:
A. ประเมินความแข็งแกร่งทีมผิด  
B. ประเมินทีมรองต่ำเกินไป  
C. ประเมินความเสี่ยง AH ต่ำเกินไป  
D. ประเมินความน่าจะเป็นสูงเกินจริง  
E. อ่านแท็กติก/รูปเกมผิด  
F. เหตุการณ์ระหว่างเกมที่คาดการณ์ไม่ได้  
G. ข้อมูลก่อนแข่งไม่ครบถ้วน

หมวดสาเหตุเป็น hypothesis สำหรับทบทวน ไม่ใช่ข้อเท็จจริงอัตโนมัติจากสกอร์สุดท้าย ผู้ใช้สามารถแก้ไข/ยืนยันป้ายสาเหตุได้

## 8. กรณีศึกษาตั้งต้น 6 คู่

ใช้เพื่อสร้าง test cases และทบทวน ไม่ใช้เป็นหลักฐานเพียงพอในการเปลี่ยน weight หรือสูตร:

| คู่ | ผลจริง | สิ่งที่ต้องทบทวน |
|---|---|---|
| Kashima Antlers–Shimizu S-Pulse | 1–1 | AH -1.0 ไม่ผ่าน; ตรวจความเสี่ยงเสมอ/ชนะไม่ขาด |
| Kashiwa Reysol–JEF United Chiba | 0–1 | AH -1.0 ไม่ผ่าน; ตรวจโอกาสชนะเดิม 62% และทีมรอง |
| Vissel Kobe–Mito HollyHock | 1–2 | AH -1.0 ไม่ผ่าน; แยกคุณภาพ pre-match จากใบแดงระหว่างเกม |
| Bayern Munich–Köln | 1–1 | คาดบาเยิร์นชนะสูง แต่ AH เริ่ม -3; ตรวจผลต่างประตูและความเสี่ยงชนะไม่ขาด |
| Troyes–Le Havre | 3–1 | คาดผู้ชนะถูก; ตรวจว่าการประเมินก่อนแข่งถูกต้องหรือสกอร์ถูกขยายจากเหตุการณ์ท้ายเกม |
| Athletic Club–Espanyol | 0–1 | เลือกฝั่งชนะผิด; ตรวจความได้เปรียบเจ้าบ้านและโอกาสของทีมเยือน |

สำหรับทั้ง 6 คู่ ต้องแยก "ข้อมูลที่มีจริงก่อนเริ่มแข่ง" ออกจาก "เหตุการณ์ที่ทราบหลังแข่ง" หากไม่มี JSON/prediction snapshot ต้นฉบับ ให้ทำเครื่องหมาย missing evidence และห้ามสร้างเปอร์เซ็นต์ย้อนหลัง

## 9. การใช้ข้อมูลสะสมและการเรียนรู้

- ใช้ Match ID เดิมและ analysis version เดิม
- แสดงจำนวนตัวอย่างทุกสถิติ; push แยกจาก denominator ของ hit rate ตามกติกา settlement
- ใช้ Brier Score แยก 1X2 และ AH เมื่อ probability snapshots มีครบ
- แยกผลตามลีก, เส้น AH, risk band, data confidence band และช่วง probability เมื่อ sample size รองรับ
- คงกฎ Performance Center เดิม: suggestions ต่อกลุ่มต้องมีอย่างน้อย 8 ตัวอย่างและต่ำกว่า baseline อย่างน้อย 10 percentage points จึงเสนอให้ทบทวน
- ห้าม auto-tune weights, thresholds หรือ Poisson parameters จาก 6 คู่หรือ sample ขนาดเล็ก
- ข้อเสนอทุกข้อรอผู้ใช้อนุมัติ และบันทึก guideline version

## 10. Data safety / compatibility

- ไม่ลบหรือ reset IndexedDB
- ไม่เพิ่มการล้าง object store
- ไม่เขียนทับ Match ID, pre-match analysis, prediction snapshot หรือ verified result
- ไม่เปลี่ยน schema_version 1.0.0 ในรอบนี้
- ใช้ optional fields ที่ schema V3.0 รองรับอยู่แล้วเท่าที่เหมาะสม
- หากจำเป็นต้องเพิ่มฟิลด์ใหม่ ให้เสนอ schema change แยกและทดสอบ backward compatibility ก่อน
- ไม่เพิ่ม paid API, football data API, backend หรือ AI API
- ทำงานผ่าน feature branch + PR; ห้าม merge/deploy โดยไม่มีการอนุมัติจากผู้ใช้

## 11. Acceptance criteria

1. Legacy V1 JSON imports remain valid.
2. 1X2 and AH distributions remain independent and each sums to 1 within 0.005.
3. AH five-settlement probabilities sum to 1; cover = full_win + half_win.
4. AH -1.0 push case and quarter-line half outcomes are tested.
5. Positive/negative AH lines retain correct sign and settlement.
6. Missing evidence yields null/insufficient_data or PASS, never fabricated percentages.
7. Risk Score, Data Confidence, 1X2 probability and AH probability remain separate.
8. Match analysis visible in app remains exactly three concise numbered points.
9. Existing Match IDs, analysis snapshots, prediction history, results and JSON backup/restore remain intact.
10. Build, unit tests, smoke tests, and mobile/browser acceptance tests pass before any deployment.
