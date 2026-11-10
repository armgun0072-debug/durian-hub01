# คู่มือ Taste Skill, Impeccable และ Hallmark

ติดตั้งในโปรเจกต์ Durian Hub เมื่อ 2026-11-11 เรียกผ่านข้อความในแชต Codex
ด้วยชื่อด้านล่าง ไม่ใช่คำสั่ง PowerShell หาก IDE ยังไม่เห็น Skill ใหม่ ให้เริ่ม session ใหม่

## เลือกตัวไหนดี

| Skill | ชื่อที่เรียกจริง | งานที่เหมาะ | ข้อควรคำนึง |
| --- | --- | --- | --- |
| Taste Skill 2.5.1 | `$design-taste-frontend` | ออกแบบหน้าใหม่หรือปรับ landing page ด้วยแนวทาง typography, layout, ภาพ และ motion ที่ชัดเจน | มี design kit และกฎค่อนข้างเข้ม ไม่ควรนำไปครอบหน้าตลาดกลางเดิมทั้งหมดโดยอัตโนมัติ |
| Impeccable 4.8.2 | `$impeccable` | ตรวจและปรับ UI เดิมเป็นจุด เช่น accessibility, responsive, hierarchy และ polish | เริ่มจาก audit/critique แล้วเลือกแก้เฉพาะจุด เหมาะเป็นตัวแรกสำหรับ Durian Hub เดิม |
| Hallmark 2.0.0 | `$hallmark` | สร้างหน้าใหม่ที่มีทิศทางเฉพาะ หรือ audit/redesign เมื่อระบุชื่อ Hallmark | มี themes, references และเครื่องมือตรวจผล ต้องรักษาเนื้อหาและ wiring ของแอปเมื่อ redesign |

เลือก Skill หลักหนึ่งตัวต่องาน ไม่สั่งให้ทั้งสามออกแบบหน้าเดียวพร้อมกัน
หากต้องการอีกตัวช่วยตรวจ ให้รอผลจากตัวแรกแล้วขอ audit แยก เพื่อให้ทราบว่า
ข้อเสนอไหนมาจากกฎชุดใด คำแนะนำของ Skill ไม่ใช่เหตุให้เปลี่ยน requirement ของผู้ใช้

## 1. Taste Skill

ชื่อแสดงในเอกสารคือ Taste Skill แต่ `name` ใน SKILL.md คือ `design-taste-frontend`
โฟลเดอร์ติดตั้งจึงใช้ `.agents/skills/design-taste-frontend/`

ตัวอย่างเริ่มจากการวางแผน:

```text
$design-taste-frontend วางแผน landing page ภาษาไทยสำหรับแนะนำ Durian Hub
กลุ่มเป้าหมายคือชาวสวนและผู้รับซื้อ ใช้สีแบรนด์จากโปรเจกต์
เสนอไฟล์ที่จะเพิ่มและวิธีตรวจ mobile ก่อน ยังไม่แก้หน้า marketplace เดิม
```

ตัวอย่างงานที่มีเป้าหมายแคบ:

```text
$design-taste-frontend เสนอแนวทาง typography และระยะห่างของ hero ใน src/demo/page.tsx
คงข้อความจริงและพฤติกรรมค้นหาเดิม พร้อมอธิบายผลต่อจอมือถือ
```

ส่งข้อมูลจริงเท่าที่มี เช่น โลโก้ ภาพสินค้า ข้อความ ผู้ใช้งาน และปุ่มหลัก
อย่าถือว่าค่าเริ่มต้นของ Skill เป็นข้อเท็จจริงของ Durian Hub ตัวตรวจข้อความของ upstream
อิงกฎภาษาอังกฤษหลายส่วน ผลกับข้อความไทยต้องอ่านประกอบและรายงานข้อจำกัด

ชุดนี้มี assets, library, references และ scripts ครบจากพาธต้นทาง
มีการปรับเฉพาะนำ Claude Stop hook ออกจาก frontmatter และเพิ่มข้อความ compatibility
เพื่อให้คง workflow ของโปรเจกต์ ไม่เปิด hook อัตโนมัติ
คำแนะนำ upstream ที่ให้ Next.js ใช้ static export ไม่ได้อนุญาตให้เปลี่ยนแอปนี้เป็น static

## 2. Impeccable

ติดตั้งชุดเดิมไว้แล้ว ไม่ลงซ้ำหรืออัปเดต revision ในงานนี้

```text
$impeccable audit src/app/page.tsx
ตรวจ accessibility, responsive, contrast และสถานะ error/loading
ส่งรายงานพร้อมตำแหน่งโค้ดก่อน ยังไม่แก้ไฟล์
```

```text
$impeccable critique การ์ดประกาศใน src/app/page.tsx
เน้นการอ่านราคา จังหวัด และความชัดเจนของปุ่มติดต่อบนมือถือ
```

หลังอนุมัติแผนปรับ UI สามารถขอ `polish`, `adapt` หรือ `harden` ตามขอบเขตที่ตกลง
เช่น `$impeccable polish การ์ดประกาศตามแผนที่อนุมัติ`
`init` ใช้สร้าง PRODUCT.md และ `document` ใช้บันทึกระบบภาพใน DESIGN.md
สองคำสั่งนี้สร้างเอกสารจริง จึงควรระบุว่าต้องการให้ทำก่อนเรียก

## 3. Hallmark

```text
$hallmark audit src/demo/page.tsx
ตรวจลำดับข้อมูล ความสม่ำเสมอ และรูปแบบที่ดูซ้ำสำเร็จรูป
ออกรายงานก่อน โดยคงระบบค้นหาและแชตจำลองเดิม
```

```text
$hallmark วางแผนหน้าแนะนำ Durian Hub ภาษาไทยสำหรับชาวสวนและผู้รับซื้อ
ใช้ข้อมูลที่ตรวจพบจริงในโปรเจกต์ เสนอทิศทางภาพและรายชื่อไฟล์ก่อนลงมือ
```

```text
$hallmark redesign src/demo/page.tsx
เสนอแผนก่อนแก้ คงเนื้อหา ตัวกรอง รายละเอียดประกาศ และแชตจำลอง
ใช้ภาพและตัวเลขจริงเท่านั้น
```

`audit` เป็นรายงาน ส่วน `redesign` คือการเปลี่ยนโครงสร้างภาพอย่างจริงจัง
อย่าใช้แทนคำขอปรับปุ่มหรือระยะห่างเพียงเล็กน้อย หากไม่มีข้อมูลจริงให้ระบุว่าขาด
ไม่แต่งจำนวนผู้ใช้ ราคา คำรับรอง หรือโลโก้คู่ค้า

ชุดนี้เพิ่มข้อความ compatibility สำหรับ approval, runtime, การรีวิวและขอบเขตงาน
คง themes, scripts และ references ของ upstream พร้อม LICENSE
ขั้นตอน independent review ที่ยังไม่ได้ทำต้องรายงานตามจริง ไม่อ้างเป็นผลตรวจผ่าน

## ข้อกำหนดสำหรับ scripts

| ชุด | ต้องใช้อะไร | สถานะในงานติดตั้งนี้ |
| --- | --- | --- |
| Taste scripts | Node 22+; browser checks ใช้ Chrome/Edge/Chromium; บางงานใช้เครือข่ายเพื่อหาภาพหรือไอคอน; ffmpeg เป็นตัวเลือก | ตรวจ Node และ syntax ของ entry scripts; ยังไม่รัน browser gate กับแอป |
| Hallmark static lint | Node; render tier ระบุ Node 18+, puppeteer-core และ Chrome/Chromium | ตรวจ entry script และคำสั่ง help; ไม่ติดตั้ง dependency เพิ่มให้แอป |
| Hallmark image generation | scripts/imagegen.mjs ใช้ TOGETHER_API_KEY และ Together API | ไม่เรียก API หรืออ่านค่า secret ในงานนี้ |
| Impeccable | Windows launcher อาจดาวน์โหลด engine ตาม VERSION/checksums เมื่อเรียกครั้งแรก | ตรวจชุดไฟล์เดิม; ยังไม่ดาวน์โหลดหรือทดสอบ engine |

Node ที่ตรวจพบในรอบนี้คือ v26.7.0 ซึ่งผ่านขั้นต่ำที่ระบุด้านบน
การติดตั้งไฟล์ไม่ได้แปลว่า browser/engine/API พร้อมใช้งานทั้งหมด
หากขั้นตอนใดขาด dependency ให้รายงานขั้นตอนที่รันไม่ได้ ห้ามสรุปว่า render ผ่าน

ตัวอย่างคำสั่ง PowerShell สำหรับตรวจ static โดยตั้ง cwd ที่ root โปรเจกต์:

```powershell
node .agents/skills/hallmark/scripts/sloplint.mjs --help
node .agents/skills/hallmark/scripts/sloplint.mjs src/demo/page.tsx --scope app
```

คำสั่งที่สองตรวจ source จริงและอาจรายงานปัญหาตามกฎ Hallmark ไม่ใช่ผลทดสอบ business logic
ตัวตรวจ static ไม่ได้พิสูจน์ layout ที่ render จริง ส่วน Taste ใช้ copy-lint กับ HTML
หรือร่างข้อความ และ gate กับ URL/dev server หรือหน้าที่ build แล้ว ตาม references ของ Skill

ไม่เปิด hooks หรือ live server ในงานนี้ สำหรับ Impeccable live mode ให้ดูข้อจำกัด
ใน [คู่มือรวม](agent-skills.md#ขอบเขตของ-impeccable) โดยเฉพาะ fallback ที่เรียก CLI
อย่าเปลี่ยน sandbox หรือ approvals เพื่อให้ scripts ทำงานได้

## เวอร์ชัน แหล่งที่มา และการตรวจซ้ำ

| ชุด | Repository | Commit |
| --- | --- | --- |
| Taste Skill | https://github.com/Leonxlnx/taste-skill | `f6b76575f949707b4e3c37cd86cb44b0b98643e8` |
| Impeccable | https://github.com/pbakaus/impeccable | `ebe9c265f416f7f9b83ed424ed5b9bd0d2684536` |
| Hallmark | https://github.com/Nutlope/hallmark | `407fa689f4a276f2fd389208d271d0fef08f5058` |

`skills-lock.json` เก็บ revision, source path, local adaptations และ SHA-256 ของทุกไฟล์
เป็น manifest เฉพาะโปรเจกต์ ไม่ใช่ format สำหรับให้ `npx skills update` เขียนทับ
ตรวจไฟล์ติดตั้งซ้ำด้วย `python scripts/verify-agent-skills.py`
การตรวจนี้ยืนยันไฟล์ตรงกับ manifest และโครงสร้างอ้างอิง ไม่ใช่การรับประกันว่า
ทุก script ปลอดข้อผิดพลาดหรือทำงานได้บนทุก runtime
