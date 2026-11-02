---
name: solution-advisor
description: Analyzes the codebase, identifies defects, anti-patterns, and flaws, and provides clear step-by-step implementation recommendations and action plans.
---

# Solution Advisor & Quality Audit Skill

## Objective
ให้คำปรึกษา วางแผนขั้นตอนการพัฒนาที่ถูกต้อง (Best Practices) พร้อมวิเคราะห์และตรวจจับจุดบกพร่อง (Defects, Bugs, Architecture Smells) ในโค้ด และเสนอแนวทางแก้ไขเป็นลำดับขั้นตอนที่ปฏิบัติได้จริง

---

## 1. กรอบการวิเคราะห์จุดบกพร่อง (Defect & Flaw Detection Framework)

เมื่อเปิดใช้งานสกิลนี้ ให้ประเมินโค้ดและระบบใน 4 มิติหลักเสมอ:

### 1.1 Architecture & Code Structure (โครงสร้างโค้ดและความง่ายในการดูแล)
- **God Component / Monolith:** ไฟล์เดียวยาวเกินไปหรือไม่ (เช่น หน้า `page.tsx` ยาวกว่า 1,000 - 2,000+ บรรทัด รวมทุกอย่างไว้ที่เดียว)
- **Separation of Concerns:** แยก Logic, State, UI, และ Data Access ออกจากกันหรือยัง
- **Reusability:** มีการแยก UI Components ย่อย (Modals, Cards, Forms, Headers) หรือไม่

### 1.2 Data & State Management (การจัดการสถานะและข้อมูล)
- **Mock Data vs Live DB:** ข้อมูลยังเป็น Hardcoded/MockData หรือเชื่อมต่อ Database/ORM (Prisma, PostgreSQL) แล้ว
- **State Synchronization:** State ใน Component ซับซ้อนเกินไปจนทำให้ Re-render ฟุ่มเฟือยหรือไม่
- **Error Handling & Edge Cases:** มีการดักจับข้อผิดพลาด (Try/Catch, Loading State, Empty State) หรือไม่

### 1.3 Security & Validation (ความปลอดภัยและการตรวจสอบข้อมูล)
- **Form Validation:** มีการตรวจสอบความถูกต้องของข้อมูล (Zod, React Hook Form) ก่อนส่งหรือไม่
- **Authentication & Authorization:** สิทธิ์การเข้าถึงแยกบทบาทจริงหรือเป็นเพียง Client-side toggle
- **Sensitive Data:** มีการเปิดเผย Secret หรือข้อมูลอ่อนไหวทางฝั่ง Frontend หรือไม่

### 1.4 UX & Performance (ประสิทธิภาพและประสบการณ์ผู้ใช้)
- **Bundle Size & Loading:** มีการโหลดข้อมูลทั้งหมดมาค้างไว้ใน Memory โดยไม่ทำ Pagination/Infinite Scroll หรือไม่
- **Responsiveness:** การจัดวางหน้าจอรองรับ Mobile / Desktop สมบูรณ์หรือไม่

---

## 2. รูปแบบการนำเสนอคำแนะนำ (Advisory & Roadmap Output Format)

เมื่อให้คำแนะนำแก่ผู้ใช้ ให้จัดหมวดหมู่ดังนี้:

```markdown
### 🔍 1. รายการจุดบกพร่องที่พบ (Identified Flaws & Issues)
- **[CRITICAL / WARNING / MINOR] ชื่อปัญหา**: คำอธิบายว่าทำไมถึงเป็นปัญหา และส่งผลเสียอย่างไร

### 💡 2. ข้อเสนอแนะแนวทางแก้ไข (Recommended Solutions)
- สรุปแนวทางที่ถูกต้องตาม Best Practice (เปรียบเทียบ Before vs After)

### 🗺️ 3. แผนขั้นตอนการทำทีละขั้น (Step-by-Step Action Roadmap)
- **Phase 1 (ด่วนที่สุด):** ขั้นตอน 1.. 2..
- **Phase 2 (เสริมความสมบูรณ์):** ขั้นตอน 1.. 2..
- **Phase 3 (Production Ready):** ขั้นตอน 1.. 2..
```

---

## 3. Workflow การทำงานร่วมกับ `task-tracker`
1. นำจุดบกพร่องและแผนงานที่ตกลงกับผู้ใช้ ไปอัปเดตลงใน `CURRENT_TASK.md` ในส่วน `📋 Task Checklist` และ `⏭️ Next Steps`
2. ดำเนินการแก้ไขทีละ Phase อย่างเป็นระบบ
