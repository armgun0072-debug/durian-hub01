# Agent Skills สำหรับ Durian Hub

ติดตั้งเมื่อ 2026-11-11 ใน `.agents/skills/` สำหรับโปรเจกต์นี้ ใช้ร่วมกับ
`AGENTS.md` และ `CURRENT_TASK.md` เดิม โดยไม่ติดตั้ง plugin ระดับผู้ใช้หรือ hooks

## Skills ที่เลือก

คู่มือเฉพาะด้าน UI: [Taste Skill, Impeccable และ Hallmark](design-skills-guide.md)

| Skill | ใช้เมื่อ | ตัวอย่างคำขอ |
| --- | --- | --- |
| find-skills | ค้นหา Skills เพิ่มตามงาน | `$find-skills หา Skill สำหรับทดสอบ Next.js` |
| writing-plans | วางแผนงานหลายขั้นตอนก่อนแก้โค้ด | `$writing-plans วางแผนแก้ role validation` |
| executing-plans | ลงมือทำตามแผนที่อนุมัติใน session นี้ | `$executing-plans ทำตามแผนที่อนุมัติ` |
| systematic-debugging | หาสาเหตุของบั๊กจากหลักฐาน | `$systematic-debugging ตรวจสาเหตุ role tests ที่ไม่ผ่าน` |
| test-driven-development | ทดสอบพฤติกรรมก่อนเปลี่ยน implementation | `$test-driven-development แก้กรณี role validation ตามแผน` |
| receiving-code-review | ตรวจสอบข้อเสนอจากรีวิวก่อนแก้ตาม | `$receiving-code-review ประเมินข้อเสนอรีวิวนี้` |
| verification-before-completion | ตรวจผลจริงก่อนสรุปว่างานสำเร็จ | `$verification-before-completion ตรวจงานรอบนี้` |
| impeccable | ตรวจ UX, accessibility, responsive และปรับ UI | `$impeccable audit src/app/page.tsx` |
| design-taste-frontend | ออกแบบหน้าใหม่ตามแนวทาง Taste Skill | `$design-taste-frontend วางแผน landing page ของ Durian Hub` |
| hallmark | สร้างหน้าใหม่หรือ audit/redesign เมื่อระบุชื่อ | `$hallmark audit src/demo/page.tsx` |

Skills ใหม่จะพร้อมให้ระบบค้นพบในเทิร์นถัดไป หาก IDE ยังไม่แสดง ให้โหลด session ใหม่
ตัวอย่างคำขอข้างต้นไม่ใช่คำสั่ง PowerShell และไม่ได้รับประกันผลการตรวจแอป

## Workflow

1. อ่าน `CURRENT_TASK.md` ก่อน แล้วตรวจเฉพาะไฟล์ที่เกี่ยวข้อง
2. เสนอเป้าหมาย ไฟล์ ขั้นตอน และความเสี่ยงตาม `AGENTS.md` แล้วรออนุมัติสำหรับงานใหม่
3. ทำงานตามขอบเขตที่อนุมัติใน session เดิม บันทึกสถานะใน `CURRENT_TASK.md`
4. ตรวจสาเหตุและทดสอบพฤติกรรมสำหรับการแก้บั๊ก ใช้การตรวจที่เหมาะสมสำหรับเอกสาร/config
5. รายงานคำสั่งตรวจ ผลจริง และข้อจำกัดก่อนสรุปว่างานเสร็จ

คำขอและขอบเขตที่ผู้ใช้อนุมัติ รวมถึงข้อกำหนดของ runtime มีลำดับเหนือแนวทางใน Skills
คำแนะนำใน template ให้ commit, deploy, เปลี่ยนโมเดล หรือเรียก agent อื่น ไม่ใช่การอนุญาต
ใช้ชื่อ Skill ที่ติดตั้งจริง เช่น `test-driven-development` เมื่อ upstream ใช้ prefix `superpowers:`
ชุดนี้เป็น Skills ที่คัดมา ไม่ใช่ Superpowers plugin เต็มชุดหรือการเชื่อมต่อ Claude Code

## ที่มาและการปรับแต่ง

| แหล่งที่มา | Commit ที่ติดตั้ง | เนื้อหา |
| --- | --- | --- |
| https://github.com/axxt0/find-skills | `1164afa5f0e21ebd01e6fc11249759353f494ad1` | `skills/find-skills/` |
| https://github.com/obra/superpowers | `22f0b463e7a5e579904dd6211a520321035526f7` | 6 Skills ในตารางด้านบน |
| https://github.com/pbakaus/impeccable | `ebe9c265f416f7f9b83ed424ed5b9bd0d2684536` | `.agents/skills/impeccable/` รวม references, scripts และข้อมูลประกอบ |
| https://github.com/Leonxlnx/taste-skill | `f6b76575f949707b4e3c37cd86cb44b0b98643e8` | `skills/taste-skill/` ติดตั้งชื่อ `design-taste-frontend` |
| https://github.com/Nutlope/hallmark | `407fa689f4a276f2fd389208d271d0fef08f5058` | `skills/hallmark/` |

คง LICENSE จากแต่ละ repository ไว้ในแต่ละ Skill

- `writing-plans`: เปลี่ยนคำแนะนำ worktree และ execution handoff ให้ใช้ workflow เดิม
  และลงมือใน session ปัจจุบัน ลด dependency ไปยัง Skills ที่ไม่ได้ติดตั้ง
- `executing-plans`: ฉบับปรับใช้ในโปรเจกต์ แทน SDD ledger, shell helpers,
  subagent/model dispatch และ branch finishing ด้วย `CURRENT_TASK.md` และ inline execution
  เอา scripts `task-start`/`task-done` ของ upstream ที่ต้องใช้ชุด SDD ออก
- `design-taste-frontend`: เอา Claude Stop hook ออกจาก frontmatter และเพิ่ม compatibility ของโปรเจกต์
- `hallmark`: เพิ่ม compatibility สำหรับ scope, approvals, API, รีวิวและ browser runtime
- Skills อื่นคงเนื้อหาจาก commit ที่ระบุ และเพิ่ม LICENSE

`skills-lock.json` เป็น **manifest เฉพาะโปรเจกต์** (`durian-hub-agent-skills/v1`)
บันทึก source, commit, path, local adaptations และ SHA-256 ของทุกไฟล์ที่ติดตั้ง
ไม่ใช่ lock format ของ `npx skills` และไม่ควรใช้ CLI นั้นเขียนทับเพื่ออัปเดตชุดนี้
ตรวจซ้ำได้ด้วย `python scripts/verify-agent-skills.py`
อัปเดตโดยตรวจ upstream revision ใหม่ ตรวจ diff โดยเฉพาะ scripts และ references
คง local adaptations แล้วสร้าง hashes ใหม่หลังตรวจสอบ อย่าอัปเดตแบบลอยตาม main

## ขอบเขตของ Impeccable

ติดตั้ง Skill และไฟล์ประกอบเท่านั้น ยังไม่เปิด hooks, live server หรือดาวน์โหลด engine
Windows launcher อยู่ที่ `.agents/skills/impeccable/scripts/impeccable.cmd`
การเรียกครั้งแรกอาจดาวน์โหลด engine ตาม VERSION และ engine-checksums.txt
ความพร้อมของ engine บนเครื่องยังไม่ได้ทดสอบ; อย่าอ้างว่ารัน audit สำเร็จจากการติดตั้งเพียงอย่างเดียว
หาก launcher ใช้ไม่ได้ ให้ทำตาม fallback ใน Skill และตรวจ context ของโปรเจกต์โดยตรง

live mode ของ upstream อาจ fallback ไปเรียก CLI โดยข้าม sandbox/approvals
หากต้องใช้งานภายหลัง ให้ใช้ `IMPECCABLE_LIVE_COPY_AGENT=chat` หรือ `off`
ก่อนเริ่ม live server ตามเอกสาร upstream และคงข้อจำกัดของ runtime ไว้
รอบนี้ไม่ได้เรียก live mode และไม่ได้แก้หน้าจอของแอป

## เครื่องมือที่พักไว้

- claude-mem: ใช้ task-tracker และ CURRENT_TASK.md ต่อก่อน ยังไม่เพิ่ม worker,
  ฐานข้อมูลความจำ หรือการประมวลผลประวัติ session
- task-observer: พิจารณาเมื่อมี workflow ซ้ำมากพอ ตอนนี้ยังไม่เพิ่ม log/review cycle อีกชุด

## สถานะแอปที่ต้องแยกจากการติดตั้ง Skills

CURRENT_TASK.md บันทึกผลเก่าว่า role tests ไม่ผ่าน 7 ข้อ การติดตั้งครั้งนี้ไม่ได้แก้
หรือรันทดสอบส่วนนั้นใหม่ และไม่ได้เปลี่ยน source แอป ฐานข้อมูล หรือ deployment
