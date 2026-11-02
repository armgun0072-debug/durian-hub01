# 📌 Project State & Active Task Tracker

**Project:** Durian Hub (ตลาดกลางทุเรียน)
**Last Updated:** 2026-11-02
**Current Status:** UI REDESIGN COMPLETED / GITHUB & DOCKER DEPLOYMENT READY
**Latest Backup:** `D:\csc481_backup_20261030_013531`
**Presentation Deck & ERD:** `D:\durian_hub_presentation\index.html`

## Latest GitHub & Docker Preparation Task — 2026-11-02
- **Authorization:** ผู้ใช้อนุมัติเตรียมโปรเจกต์ลง GitHub ร่วมกับ Docker
- **Scope:** สร้าง `.gitignore` ที่รัดกุม ป้องกัน `node_modules`, `.next`, `.env`, และไฟล์ backup ขนาดใหญ่หลุดขึ้น GitHub; สร้าง `.env.example` เป็นแม่แบบการตั้งค่า; ตรวจสอบความพร้อมของ `docker-compose.yml`, `Dockerfile` และ `README.md`
- **Status:** พร้อมนำขึ้น GitHub ทันที

## Latest UX/UI Task — 2026-11-02
- **Authorization:** ผู้ใช้อนุมัติแผนปรับ UI ให้คลีน สอดคล้องทุกหน้า และรองรับ dark mode ด้วยคำว่า “ลุย”
- **Scope:** shared semantic color tokens; light/dark/system theme with persistence and pre-paint bootstrap; user/admin UI; mobile navigation/chat; shared buttons/headings; preserve API/business flows
- **Implementation:** `src/components/theme-provider.tsx`, `theme-switcher.tsx`, `auth-brand-panel.tsx`, `ui.tsx`, `listing-card.tsx`, `dialog-frame.tsx`; `src/lib/theme.ts`; CSS/Tailwind shared palette; page/admin shared colors; concise navigation, real listing titles/prices, responsive mobile inbox, accessible dialogs and form labels
- **UX corrections:** เลิก prefill บัญชี/รหัสผ่านทดสอบและเลิกเขียนทับข้อมูล login เมื่อเลือกบทบาท; เอาลิงก์ Mailpit ออกจากหน้าใช้งาน; เปลี่ยนราคาเฉลี่ยจำลองในแถบสายพันธุ์เป็น filter chips; เอาป้าย KYC ที่แสดงแบบไม่ตรวจสถานะออกจาก welcome banner (คงคะแนนความประพฤติ)
- **Validation:** regression/theme 71/71; final production build แยก `.next-ui-test` ผ่าน; TypeScript ผ่าน; Chrome checks 25/25 มี theme persistence/system change, 320/390/1100/1440px, search/reset, dialog focus/Tab/Escape, mobile chat navigation, user/admin, primary-button contrast ทั้งสองธีม และไม่มี runtime exception
- **Artifacts:** `docs/ui-redesign-results.md`, `docs/ui-preview/checks.json`, ภาพหน้าจอจริง 18 ภาพใน `docs/ui-preview/`
- **Isolation:** `next.config.js` รองรับ UI_TEST_BUILD=1 เพื่อไม่ชน next dev; `npm run test:ui` สร้าง production build+ฐาน MySQL+Chrome profile ชั่วคราวแล้วเก็บกวาด; คืน generated type paths กลับ `.next` หลังจบ
- **Data:** ไม่แก้ API/schema/ข้อมูลแอปในงาน UI นี้; ตรวจหลังทดสอบประกาศ 10 / รีวิว 4 ยังอยู่ และเหลือฐาน UI test 0 ฐาน; server/profile ทดสอบถูกหยุดและล้างแล้ว
- **Next:** งานที่อนุมัติรอบนี้เสร็จแล้ว ผู้ใช้รีเฟรชหน้าเว็บเพื่อทดลองธีมและหน้าตาใหม่ได้; browser suite รอบนี้ไม่ครอบคลุม signup/OTP/ทุก action ของ admin
- **Previous completed work:** Database integrity task ด้านล่าง

## Latest Database Integrity Task — 2026-11-02
- **Authorization:** ผู้ใช้สั่ง “ถ้าอันไหนควรแก้ แก้เลยและสรุปผลแก้กับเทสระบบด้วย” อนุมัติลงมือแก้และทดสอบ
- **Evidence:** MySQL 8.0.46 จริง ไม่มี FK จาก license_number ไป id; ก่อนแก้ไม่มี CHECK คะแนน และ daily_market_stats ว่าง
- **Changes:** deals API ตรวจสมาชิก/คู่ค้า/เจ้าของและปิดดีลใน Serializable transaction; report counter transaction; atomic detail-view counter พร้อม UI; snapshot job; rating CHECK และสคริปต์ reconcile totals; เอกสารฐานข้อมูลและ flowchart
- **Scope:** ไม่เพิ่มระบบรับชำระเงิน เพราะระบบเดิมบันทึกข้อตกลง; ไม่เปลี่ยน FK ที่ถูกต้องอยู่แล้ว
- **Validation:** unit/mock 65/65; isolated MySQL integration 10/10; TypeScript, Prisma validate, production build ผ่าน; HTTP smoke 7/7 (หน้าแรก/admin/posts และการปฏิเสธคำขอไม่ล็อกอิน/ID ผิด)
- **Applied to app DB:** CHECK `user_reviews_rating_range`; reconcile report_count/rating_avg/rating_count โดย mismatch = 0; สำรองค่าเดิมที่ `database/backups/aggregate-totals-1793556787570.json`; refresh snapshot วันที่ 2026-11-02 ได้ 1 กลุ่ม/1 ตัวอย่าง
- **Data preservation:** ประกาศเดิม 10 และรีวิวเดิม 4 รายการยังอยู่ครบ; ลบเฉพาะฐานข้อมูลทดสอบชั่วคราวของชุด integration แล้ว เหลือ 0 ฐานทดสอบ; หยุด HTTP smoke server พอร์ต 3107 แล้ว
- **Limitations:** ไม่ได้ทดสอบ browser interaction/อีเมลครบ flow; stats snapshot ต้องเรียก `npm run stats:refresh` (Node 22.18+) ยังไม่ตั้ง OS scheduled task และ dashboard เดิมยังอ่าน posts API
- **Next:** งานที่สั่งรอบนี้เสร็จแล้ว; งานเพิ่มเติมที่เลือกทำภายหลังได้คือ browser end-to-end และกำหนดตารางรัน snapshot หากต้องการเก็บประวัติรายวันต่อเนื่อง
- **Key files:** `docs/database-integrity.md`, `database/hardening.sql`, `scripts/repair-database.cjs`, `scripts/refresh-market-stats.cjs`, `src/lib/market-stats.ts`, `tests/database.integration.cjs`

## Latest Documentation Task — 2026-10-30
- **Status:** COMPLETED — ผู้ใช้อนุมัติแผนด้วยคำว่า “ลุย”; จัดทำ `docs/project-flowchart.md`
- **Deliverable:** Flowchart Mermaid ภาษาไทย 8 ผัง ครอบคลุมภาพรวม สมัคร/เข้าสู่ระบบ ประกาศ แชท ปิดดีล รีวิว ผู้ดูแล และโครงสร้างระบบ พร้อมคำอธิบายสำหรับนำเสนอและลิงก์โค้ดอ้างอิง
- **Evidence:** ตรวจ API และ UI ที่เกี่ยวข้องจริง; ระบุ polling 2 วินาที เงื่อนไขรีวิว การใช้ราคาตั้งต้นในแดชบอร์ด และข้อจำกัด transaction/authorization ของ deals API ตามโค้ดปัจจุบัน
- **Validation:** ตรวจจำนวน Mermaid fences และลิงก์ไฟล์อ้างอิง; ไม่ได้ทดสอบ rendering Mermaid หรือรัน flow กับ MySQL ในงานเอกสารนี้
- **Next:** เอกสารพร้อมใช้อธิบายโปรเจกต์; งานทดสอบ MySQL และ flow ครบวงจรเดิมยังคงค้างตามหัวข้อด้านล่าง

---

## 🎯 Current Goal (คำสั่งและเป้าหมายล่าสุด)
- ระบบตลาดกลางทุเรียน (Durian Hub) ตามแผนใน `durian_marketplace_plan.md`
- ติดตั้งระบบ Skill & Rules ป้องกันการลืมงาน และบันทึกสถานะงานแบบไม่ต้องอ่านโค้ดทั้งหมดซ้ำซ้อน
- ระบบสมัคร/ล็อกอินจริง + OTP ยืนยันอีเมล + ลืมรหัสผ่าน (ผู้ใช้เลือก: **บังคับกรอกอีเมลทุกคน**) เทสอีเมลผ่าน Mailpit
- ระบบโพสต์สินค้าจริง + แชทเจรจาซื้อขายสด (Real-time Polling 2 หน้าต่าง) + ปุ่มตกลงราคาปิดดีล (`/api/deals`) บันทึกลงฐานข้อมูล MySQL
- **[งานล่าสุด 2026-10-29 / 2026-10-30]** 
  1. แก้บั๊กหน้าห้องแชทจอแดง (`Cannot read properties of undefined (reading 'map')`)
  2. แก้บั๊กตัวกรองภูมิภาคในตลาดกลาง (เมื่อกดเลือกภูมิภาคแล้วโพสต์ไม่แสดง)
  3. นำเข้า 77 จังหวัดครบถ้วนจาก Excel และแยก 3 จังหวัดชายแดนใต้ออกจากภาคใต้
  4. ระบบจัดการอายุโพสต์ (Post Retention & Freshness) แสดง Relative Time และคัดกรองเฉพาะโพสต์สดใหม่ 7 วันล่าสุด
  5. สำรองข้อมูล Source Code ทั้งหมดก่อนเริ่มงาน (`D:\csc481_backup_20261028_235315` & `D:\csc481_backup_20261029_034546`)
  6. ปรับปรุงแดชบอร์ดราคาแยกระดับเกรด A, B, C, D (ตกไซซ์/ลาย) x สายพันธุ์ (Matrix Grid & Grade Filter Tabs)
  7. **ตั้งกฎเหล็กถาวร Plan-Before-Execute & Evidence-Based Grounding**
  8. **ระบบจัดโปรไฟล์ผู้ใช้ & อัปโหลดรูปภาพ (Profile Dropdown & Avatar Upload)**
  9. **ระบบสลับภาษา TH / EN แบบครอบคลุมทั้งเว็บไซต์ (Full-Site Dynamic Localization)**
  10. **ระบบแชทเจรจาซื้อขายพร้อม Read Receipts, Red Badges, Fixed Layout & Welcome Dashboard**
  11. **ออกแบบกระดานตลาดกลางใหม่แบบแท็บแยกประเภท (Segmented Category Tabs) & ล็อกการโพสต์ตามบทบาทจริง**
  12. **ระบบขอเพิ่มบทบาทการใช้งานจริง (+ ขอเพิ่มบทบาท) & เว็บไซต์ผู้ดูแลระบบแยก URL ลับเฉพาะ (`/admin`)**
  13. **แก้ไขปัญหา Session ชนกัน (Admin Session Isolation) & รีเซ็ตข้อมูลทดสอบให้สะอาด:**
      - แยกคุกกี้ Admin เป็น `durian_hub_admin_session` และ User เป็น `durian_hub_session` ทำให้เปิดใช้งานพร้อมกัน 2 แท็บได้ 100%
  14. **[งานล่าสุด] ระบบตรวจจับและป้องกันการทักแชทหาประกาศตัวเอง (Self-Chat Prevention & Own Post Tagging):**
      - **การระบุประกาศของตนเอง:** ปรับปรุง API `/api/posts` ให้ส่ง `userId` ของผู้ลงประกาศเสมอ และเพิ่มฟังก์ชัน `checkIsMyOwnPost` บน Frontend
      - **ป้ายแสดงบนการ์ดตลาดกลาง:** การ์ดประกาศที่เป็นของตนเองจะมีป้าย `👤 ประกาศของคุณ` กำกับทันที ไม่ว่าจะกำลังเปิดดูในบทบาทใด
      - **หน้ารายละเอียดประกาศ (Post Detail):** หากเป็นประกาศของตนเอง ระบบจะเปลี่ยนปุ่ม "ทักแชท" เป็นแถบแจ้งเตือน:
        `👤 นี่คือประกาศของคุณเอง (ลงไว้ในบทบาท: ...) ระบบล็อกไม่ให้ทักแชทหาตัวเองเพื่อความปลอดภัย`
        พร้อมปุ่มลัดคลิกไปที่ **"ดูและจัดการใน ประวัติการโพสต์ของคุณ"**
      - **ซ่อนปุ่มรายงานปัญหา:** ซ่อนปุ่ม `🚩 แจ้งปัญหาประกาศ` กรณีที่เป็นประกาศของตนเอง
      - **Backend Guard & Navigation Fix:** ปรับปรุง `handleConfirmStartChat` ให้อยู่ในบล็อก `res.ok` หน้าจอจะไม่กระโดดเข้าห้องแชทกรณีเริ่มแชทไม่สำเร็จ
  15. **[งานล่าสุด] ปรับโฉมหน้า "แดชบอร์ดเปรียบเทียบราคารายพื้นที่" (Regional Durian Dashboard) ใหม่ทั้งหมด:**
      - **แถบเลือก 6 ภูมิภาคด้านบน (Top Compact Region Selector Strip):** เปลี่ยนจากการ์ดขนาดใหญ่ 6 ใบที่โชว์ 77 จังหวัดจนรก เป็นแถบแนวนอน 6 คอลัมน์กะทัดรัด แสดงเฉพาะชื่อภาค, ช่วงเดือนสุก, ป้ายจำนวนประกาศจริง, และราคารับซื้อเฉลี่ย
      - **ขยายแดชบอร์ดหลักเต็มความกว้างหน้าจอ (Full-Width Main Analytics Dashboard 12 คอลัมน์เต็ม):**
        - แสดงชื่อภูมิภาคขนาดใหญ่ พร้อมป้าย Tag จังหวัดในภูมิภาคนั้นแบบเรียบหรู สบายตา
        - การ์ด KPI ราคา 3 ใบขนาดใหญ่เด่นชัด (ราคาขายหน้าสวน, ราคารับซื้อหน้าล้ง, ค่าจ้างตัดทุเรียน) พร้อมปุ่มลัดไปยังตลาดกลาง
        - ขยายตารางเปรียบเทียบราคา Matrix Grid (เกรด A, B, C, D x สายพันธุ์) และกราฟเปรียบเทียบราคาแยกเกรดให้กว้างเต็มหน้าจอ อ่านง่าย สบายตา ไม่ถูกเบียดอยู่ริมขวาอีกต่อไป
        - จัดวางคำแนะนำมาตรฐานการดูทุเรียนสุกและเปอร์เซ็นต์แป้งเป็น Banner เรียบร้อยด้านล่างสุด

  16. **[งานล่าสุด] ระบบแยกกล่องข้อความแชท (Inbox Organization) & แจ้งเตือนปิดดีลอัตโนมัติ (Multi-Buyer Deal Sync):**
      - **แท็บแยกกล่องข้อความสนทนา (Chat Filter Tabs):**
        - `💬 กำลังเจรจา (Active)`: แสดงเฉพาะห้องแชทที่ยังพูดคุยซื้อขายอยู่ ทำให้กล่องข้อความสะอาด ไม่รกสายตา
        - `🤝 ปิดดีลแล้ว (Closed)`: แยกเก็บห้องแชทที่ปิดดีลสำเร็จ (`✅ ปิดดีลสำเร็จ`) และห้องที่สินค้าปิดการขายกับรายอื่นแล้ว (`🔒 ปิดการขายแล้ว`)
        - `ทั้งหมด (All)`: แสดงรวมทุกห้องแชท
      - **ระบบแจ้งเตือนอัตโนมัติไปยังลูกค้ารายอื่นในออเดอร์เดียวกัน (Auto-Broadcast on Deal Close):**
        - เมื่อผู้ใช้กดปิดดีลกับคู่ค้ารายหนึ่งในประกาศใด ระบบใน `/api/deals` จะส่งข้อความแจ้งเตือนอัตโนมัติไปยังห้องแชทของลูกค้ารายอื่นทั้งหมดที่คุยค้างอยู่ในโพสต์เดียวกันทันทีว่า:
          `📢 แจ้งเตือนจากระบบ: ประกาศ "..." ได้ทำการตกลงซื้อขาย (ปิดดีล) กับคู่ค้ารายอื่นเรียบร้อยแล้ว...`
        - ปรับสถานะห้องเหล่านั้นเป็น `ARCHIVED` ทันที และย้ายไปอยู่ในแท็บ "ปิดดีลแล้ว"
      - **Double-Deal Guard & Button Lock:**
        - ป้องกันการกดปิดดีลซ้ำที่ Backend หากโพสต์ปิดไปแล้ว
        - ในหน้าแชท: เปลี่ยนปุ่มปิดดีลเป็นป้าย `✅ ปิดดีลสำเร็จแล้ว` หรือ `🔒 ปิดการขายแล้ว` ตามสถานะจริง พร้อมแสดงแบนเนอร์ชี้แจงด้านบน

  17. **[งานล่าสุด] ระบบคะแนนความประพฤติเต็ม 100 คะแนน พร้อมบทลงโทษระงับไอดีตามขั้นบันได & ระบบให้คะแนนรีวิว 1–5 ดาวหลังปิดดีล:**
      - **ระบบคะแนนความประพฤติ (Discipline / Trust Score 100/100):**
        - รีเซ็ตคะแนนผู้ใช้ทุกคนในฐานข้อมูล MySQL เริ่มต้นที่ `100/100` และล็อกเพดานสูงสุดไว้ที่ `100` (ยกเลิกการบวกเกิน 100 ตอนอนุมัติบทบาท)
        - สร้างโมดูลกลาง `src/lib/trust.ts` คำนวณบทลงโทษอัตโนมัติตามเกณฑ์คะแนนคงเหลือ:
          - `90–100`: สถานะ `ACTIVE` (ปกติ)
          - `80–89`: สถานะ `ACTIVE` (ตักเตือน)
          - `60–79`: สถานะ `SUSPENDED` ระงับชั่วคราว **3 วัน** (`suspendedUntil`)
          - `40–59`: สถานะ `SUSPENDED` ระงับชั่วคราว **7 วัน** (`suspendedUntil`)
          - `1–39`: สถานะ `SUSPENDED` ระงับชั่วคราว **30 วัน** (`suspendedUntil`)
          - `0`: สถานะ `BANNED` **ระงับถาวร**
        - ระบบปลดล็อกอัตโนมัติใน `/api/auth/login` และ `/api/auth/me` เมื่อครบกำหนดวันระงับชั่วคราว และแจ้งข้อความวันครบกำหนดชัดเจนหากยังอยู่ในช่วงถูกระงับ
        - หน้า Admin (`/admin`): เพิ่มตัวเลือกหักคะแนน (`-10`, `-20`, `-30`, `-100`) ตอนจัดการรายงานโพสต์ และปุ่มหัก/รีเซ็ตคะแนน `100/100` ในตารางจัดการสมาชิก
      - **ระบบให้คะแนนรีวิวคู่ค้า 1–5 ดาว (`UserReview` & `ratingAvg`):**
        - สร้าง API `POST /api/reviews` ให้ผู้ซื้อและผู้ขายให้คะแนน `1–5 ดาว` พร้อมความคิดเห็นหลังสถานะแชทเป็น `DEAL_CLOSED` (จำกัด 1 รีวิวต่อ 1 ดีลต่อคน)
        - คำนวณค่าเฉลี่ยดาว (`ratingAvg`) และจำนวนรีวิว (`ratingCount`) อัปเดตลงตาราง `User` ทันที พร้อมส่งข้อความแจ้งเตือนผลการรีวิวเข้าห้องแชทอัตโนมัติ
      - **แก้บั๊กและเพิ่มกลไกความทนทาน (Resilient User Penalty Service):**
        - สร้างโมดูลกลาง [src/lib/user-service.ts](file:///d:/csc481/src/lib/user-service.ts) ที่รองรับการอัปเดตสถานะและบทลงโทษผ่าน Direct SQL Fallback ทำให้การหักคะแนน/แบนผู้ใช้ใน [reports/[id]/route.ts](file:///d:/csc481/src/app/api/admin/reports/%5Bid%5D/route.ts) และ [users/[id]/route.ts](file:///d:/csc481/src/app/api/admin/users/%5Bid%5D/route.ts) ทำงานราบรื่น 100% ไม่ติดปัญหา Windows DLL File Lock หรือ Schema Cache
        - รีเซ็ตรายการร้องเรียน `Report ID: #3` กลับเป็น `PENDING` และโพสต์ `ID: #5` เป็น `OPEN` เรียบร้อยแล้ว

## 📍 Where We Are (ตอนนี้ทำอะไรอยู่)
- **Current focus (2026-11-02): COMPLETED** — UX/UI redesign และ light/dark/system themes; final Chrome checks 25/25, regression/theme 71/71 และ production build ผ่าน ตาม Latest UX/UI Task ด้านบน
- **Previous approved work (2026-10-30):** ปรับ `POST /api/reviews` ให้ตรวจสมาชิกห้อง คู่ค้า ประกาศ สถานะ `DEAL_CLOSED` และดีล `ACCEPTED` ก่อนรีวิว; ยกเลิกการสร้างดีลเก่าอัตโนมัติจากราคาประกาศ
- รวมรีวิว คะแนนเฉลี่ย ข้อความ และเวลาอัปเดตห้องใน Serializable transaction พร้อม retry `P2034` สูงสุด 3 ครั้ง และตอบ 409 เมื่อรีวิวซ้ำ
- ตรวจ ID คะแนนเต็ม 1–5 ดาว JSON และความคิดเห็นไม่เกิน 5,000 ตัวอักษร
- **Validation:** `node --test tests/reviews.test.cjs` ผ่าน 21/21 (mock dependencies; ไม่ได้ทดสอบ transaction/concurrency กับ MySQL จริง)
- **TypeScript:** `node node_modules/typescript/bin/tsc --noEmit --incremental false` ผ่าน ไม่มี errors (เรียกตรงเพราะ PowerShell ปิดการรัน npx.ps1)
- **Compatibility:** ต้องส่ง roomId; ห้องเก่าที่ไม่มีดีล ACCEPTED ต้องให้ผู้ดูแลตรวจข้อมูลก่อน ไม่มีการสร้างดีลแทนโดย API รีวิว
- **Previous next step update:** ทดสอบ MySQL แยกฐานเรื่อง concurrent reviews และ rollback แล้วเมื่อ 2026-11-02; browser flow สมัคร → ประกาศ → แชท → ปิดดีล → รีวิว → รายงาน → ลงโทษ ยังไม่ได้ทำครบ
- **Prior completed focus:**
- **Active Focus:** ระบบคะแนนความประพฤติเต็ม 100 คะแนน (พร้อมระงับไอดีชั่วคราว 3/7/30 วัน ถึงถาวร) และระบบรีวิวคู่ค้า 1–5 ดาวหลังปิดดีล เสร็จสมบูรณ์ 100%:
  1. **100-Point Discipline Ladder:** ผู้ใช้ทุกคนมีคะแนนเต็ม `100/100` แอดมินหักคะแนนเมื่อทำผิดกฎ และระบบคำนวณวันระงับไอดีอัตโนมัติ
  2. **1–5 Star Partner Review:** ให้คะแนนดาวคู่ค้าหลังปิดดีลในห้องแชท คำนวณค่าเฉลี่ยดาวจริง และแสดงผลทั้งในการ์ดโพสต์ โปรไฟล์ และห้องแชท
  3. **Bug Fix Verified:** แก้ไขปัญหาการจัดการรายงานปัญหาสำเร็จและทดสอบการบันทึกสถานะแบน/ระงับลง MySQL ผ่านฉลุย

## 📋 Task Checklist
- [x] Schema Update: เพิ่ม `suspendedUntil` และ `suspensionReason` ในตาราง `User` (`prisma/schema.prisma`)
- [x] Penalty Ladder Logic: สร้าง `src/lib/trust.ts` คำนวณบทลงโทษระงับไอดี 3 วัน / 7 วัน / 30 วัน / ถาวร
- [x] Auto-Unlock & Login Guard: ตรวจสอบวันหมดอายุระงับชั่วคราวใน `/api/auth/login` และ `/api/auth/me`
- [x] Admin Report & User Deduction: เพิ่มปุ่มเลือกหักคะแนน `-10`, `-20`, `-30`, `-100` และปุ่มรีเซ็ต `100/100` ใน `/admin`
- [x] Star Review API & Modal: สร้าง `/api/reviews` และหน้าต่างให้คะแนน 1–5 ดาวในห้องแชทที่ปิดดีลแล้ว
- [x] Reset All Users to 100/100: อัปเดตผู้ใช้ทุกคนใน MySQL และ Seed ให้มี `trustScore = 100`
- [x] Resilient Penalty Service: สร้าง `src/lib/user-service.ts` ป้องกันปัญหา Windows DLL Lock & Fallback SQL
- [x] Reset Test Report #3: รีเซ็ตรายการร้องเรียนกลับมาให้ทดสอบกดแบนได้ทันที
- [x] TypeScript Verification: ผ่าน `npx tsc --noEmit` 0 errors
