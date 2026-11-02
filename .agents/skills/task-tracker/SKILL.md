---
name: task-tracker
description: Manages ongoing task memory and status tracking via CURRENT_TASK.md. Use this to instantly recall the user's active goal, current progress, next steps, and project architecture without re-reading the entire codebase from scratch.
---

# Task Tracker & Context Memory Skill

## Objective
Prevent the AI from forgetting user instructions and eliminate the need to re-scan/re-read the codebase on every prompt by maintaining a single, fast-to-read state file: `CURRENT_TASK.md`.

---

## 1. Core Principles

1. **Fast Context Warmup (อ่านไฟล์เดียวรู้เรื่องทันที)**:
   - When a session or prompt starts, view `CURRENT_TASK.md` first.
   - It contains:
     - 🎯 Current Goal & User Instructions (สิ่งที่ผู้ใช้สั่ง)
     - 📌 Current Focus & Active Step (ตอนนี้ทำอะไรอยู่)
     - 📋 Task Checklist (เสร็จอะไรแล้ว / กำลังทำ / ยังไม่ได้ทำ)
     - 🗺️ Key Architecture Map (ไฟล์หลักอยู่ที่ไหน ไม่ต้องเสียเวลา search)
     - ⏭️ Next Immediate Steps (สิ่งที่จะทำต่อทันที)

2. **Continuous Checkpoint (อัปเดตสถานะสม่ำเสมอ)**:
   - Whenever an important step is completed or the user provides new instructions, update `CURRENT_TASK.md`.
   - Never let `CURRENT_TASK.md` become outdated.

---

## 2. Standard Structure of `CURRENT_TASK.md`

```markdown
# 📌 Project State & Active Task Tracker

**Last Updated:** YYYY-MM-DD HH:MM
**Current Status:** [IN PROGRESS / COMPLETED / WAITING_FOR_USER]

---

## 🎯 Current Goal (คำสั่งและเป้าหมายล่าสุด)
- [ระบุสิ่งที่ผู้ใช้สั่งไว้อย่างชัดเจน]

## 📍 Where We Are (ตอนนี้ทำอะไรอยู่)
- **Active Focus:** [สิ่งที่กำลังทำอยู่ ณ วินาทีนี้]
- **Last Action Taken:** [สิ่งที่เพิ่งทำเสร็จไปล่าสุด]

## 📋 Task Checklist
- [x] งานที่ 1 (Done)
- [/] งานที่ 2 (In Progress)
- [ ] งานที่ 3 (Todo)

## 🗺️ Key Files & Architecture (แผนผังไฟล์สำคัญ)
- `src/app/page.tsx` - หน้าหลัก / UI logic รวม
- `durian_marketplace_plan.md` - แผนสเปกและ Requirement ทั้งหมด
- `prisma/schema.prisma` - โครงสร้างฐานข้อมูล

## ⏭️ Next Steps (สิ่งที่จะทำต่อทันที)
1. ...
2. ...
```

---

## 3. Workflow for Every Turn

1. **Step 1: Check Current State**
   - Check `CURRENT_TASK.md` using `view_file`.
   - If the user's message is a follow-up (e.g. "ทำต่อเลย", "เป็นไงบ้าง", "ต่อไปทำอะไร"), immediately act on the Active Focus / Next Steps without searching through code.

2. **Step 2: Execute Task**
   - Perform only the targeted code edits on the relevant files.

3. **Step 3: Update State**
   - If the task is completed or shifted, update `CURRENT_TASK.md` immediately with the new status and checklist.
