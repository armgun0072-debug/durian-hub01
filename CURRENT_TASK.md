# 📌 Project State & Active Task Tracker

**Project:** Durian Hub (ตลาดกลางทุเรียน)
**Last Updated:** 2026-11-03
**Current Status:** SCHEMA STUDIO DBML SUBSET — COMPLETED

## Latest Schema Studio Compatibility Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติ “ลุย” หลังแจ้ง Schema Studio DBML subset error ที่ Project บรรทัด 2
- **Changes:** เพิ่ม database/schema-schemastudio.dbml; ตัด Project/indexes/default/note และ Ref names/actions; คง Table/Enum/Ref พื้นฐาน, single-column unique, PK/nullability; เก็บ SQL/DBML ฉบับเต็มเดิม
- **Reproducibility:** scripts/export-schema-subset.cjs สร้างจากฉบับเต็มและ schema-export-checks.json; exporter หลักเรียกต่ออัตโนมัติ
- **Validation:** container network none ตรวจครบ 18 tables / 169 columns / 31 refs, 17 enum definitions; ยังไม่ทดสอบกับ parser ของเว็บ Schema Studio โดยตรง ไม่แก้ฐานข้อมูลจริง
- **Next:** ให้ผู้ใช้แทนที่เนื้อหา editor ทั้งหมดด้วย database/schema-schemastudio.dbml ตาม database/README.md

## Latest Schema Export Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติ “ลุย” ให้จัดโครงสร้าง MySQL ล่าสุดสำหรับวาด ER Diagram รวม DBML ตามแผนก่อนหน้า
- **Deliverables:** database/schema-latest.mysql.sql, schema-latest.dbml, schema-export-checks.json; database/README.md วิธีใช้ Workbench/DBML; README root เพิ่มลิงก์; scripts/export-schema.cjs สร้างซ้ำได้จาก Prisma
- **Evidence/Validation:** Prisma migrate diff --from-empty สร้าง DDL ใน container ปิด network ไม่มีการเชื่อม DB; ตรวจตรงกับ 18 models และ 31 FK พร้อมตรวจ endpoints ทุกเส้น; รวม hardening rating CHECK ใน SQL
- **Accuracy:** handled_by_id ไม่มี FK จริง, deals ไม่มี room_id, @updatedAt จัดการโดย Prisma; ไม่สร้างความสัมพันธ์เพิ่มเอง; DBML ระบุ rating CHECK เป็น note
- **Limitations:** ไม่ deploy/apply SQL ไม่เปลี่ยนฐานข้อมูลจริง; ไม่ตรวจ DBML ด้วย external parser หรือเปิด Workbench GUI; SQL สำหรับฐานข้อมูลว่างเท่านั้น
- **Next:** ใช้ database/README.md เพื่อ import MySQL script เป็น model ใน Workbench หรือคัดลอก DBML ไปวาดผัง

## Latest Support Portal UX Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติ “ลุยเลย” ให้ทำ flow อ้างอิงภาพ: เลือกรายการ → หัวข้อปัญหา → แชต โดยคง UI Durian Hub
- **Changes:** participant-only paginated GET /api/support/rooms; SupportPortal component พร้อมรายการ/คู่ค้า/สถานะและ direct room entry; เพิ่มเมนูบัญชี; support-center เพิ่ม welcome/topic chips, chat bubbles, sticky composer; ใช้ semantic theme tokens เดิม ไม่มี AI integration หรือ schema change รอบนี้
- **Validation:** unit/regression 143/143 ผ่าน รวม support-rooms API tests 3 กรณี; production build ผ่าน; Edge headless 8/8 checks ผ่าน desktop/mobile light+dark, topic submission, queue, pagination, no horizontal overflow, composer visible; ไม่มี runtime exceptions; ใช้ browser API fixtures ไม่ใช่ live DB
- **Artifacts:** tests/support-ui.ps1 + support-ui.steps.ps1; docs/support-ui-preview ภาพ 5 ภาพ, checks.json และ README
- **Limitations:** ไม่ deploy หรือเปลี่ยนฐานข้อมูลจริง; บริการ Docker เดิมต้อง rebuild เพื่อเห็น UI ล่าสุด และต้องมี queue schema ตามงานก่อนหน้า
- **Next:** หยุด container preview ชั่วคราว; source พร้อมให้ตรวจจากภาพและเปิดใช้งานตามขั้นตอนเดิม

## Latest Support Queue Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติด้วย “ลุยเลย” ให้จัดคิวมาก่อนรับก่อนและแสดงจำนวนผู้รอก่อนหน้า
- **Changes:** queuedAt/index + database/support-queue.sql backfill; list status filters/FIFO pagination; claim API serializable guarded claim; assigned admin-only replies/resolve; reopen resets queue/assignee; user ahead count + handler name; UI status tabs/claim/polling
- **Validation:** unit/regression 140/140 ผ่าน; production build ผ่าน compile/TypeScript/prerender 29/29; MySQL isolated SQL upgrades/backfill + flow + ahead count/FIFO + concurrent claims ไม่ซ้ำ ผ่าน; ลบ container ทดสอบแล้ว
- **Docs:** docs/chat-support.md และ docs/cmd-guide.md เพิ่มขั้นตอน database/support-queue.sql หลัง schema support พร้อม; หาก db push เพิ่ม queued_at แล้วให้ backfill เท่านั้น ไม่รัน ALTER ซ้ำ
- **Limitations:** ยังไม่ทดสอบ UI ใน browser รอบนี้ ไม่ deploy หรือเปลี่ยนฐานข้อมูลจริง
- **Next:** source พร้อม ต้อง backup/apply queue schema/backfill และ rebuild ก่อนบริการเดิมใช้คิวใหม่

## Latest Chat Support Visibility Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติแผนด้วย “ลุยเลย” ให้เอาแท็บทั้งหมดออกและแสดงปุ่มติดต่อแอดมินชัดเจน
- **Changes:** src/app/page.tsx เหลือ ACTIVE/CLOSED/HISTORY, ย้ายปุ่มแจ้งปัญหาไปหัวห้องพร้อม icon/สี/ขอบ/focus และไทยอังกฤษ แสดงทุกสถานะห้อง; src/components/support-center.tsx เปิดคำร้องเดิมของห้องอัตโนมัติและแสดง loading บทสนทนา
- **Validation:** unit/regression 137/137 ผ่าน; production build compile/TypeScript/prerender 28/28 ผ่านใน container แยก source read-only/network none; ตรวจว่าปุ่มไม่ขึ้นกับสถานะห้องและไม่มี ALL filter แล้ว
- **Limitations:** ไม่ได้ทดสอบ browser/mobile จริงรอบนี้ ไม่ deploy และไม่แก้ฐานข้อมูลจริง; API support ไม่มีการเปลี่ยนแปลงในงานนี้
- **Next:** หากใช้ Docker เดิมต้อง rebuild เว็บเพื่อเห็น source ใหม่; entrypoint เดิมยัง seed ตอนเริ่มตามบันทึกก่อนหน้า

## Latest Windows CMD Guide Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติแผนคู่มือด้วย “ลุยเลย”
- **Deliverables:** docs/cmd-guide.md คู่มือภาษาไทย 10 หมวดสำหรับ cmd.exe; เพิ่มลิงก์ใน README.md
- **Scope:** Docker/local Node, environment, Prisma, tests/build, data audit/repair/stats, MySQL backup/restore, chat-support upgrade และ troubleshooting
- **Evidence:** ตรวจ package.json, Compose, Dockerfile/entrypoint, env example, database SQL และสคริปต์จริง; ระบุ seed ทุกครั้งที่เริ่ม container, Node version constraints และ SQL upgrade one-time
- **Validation:** ตรวจชื่อ npm scripts/paths/ลิงก์และรูปแบบ Markdown; ไม่รันคำสั่งที่เปลี่ยนข้อมูลหรือ deploy เพื่อทดสอบคู่มือ
- **Next:** คู่มือพร้อมอ่านจาก README; สถานะ chat-support source พร้อม แต่ยังไม่ deploy/apply SQL กับข้อมูลจริงตามบันทึกด้านล่าง

## Latest Chat History & Support Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติแผนรวมด้วย “ลุยเลย”; ปิดดีลครบ 168 ชั่วโมงย้ายเข้าประวัติและห้ามส่งข้อความคู่ค้าทั้งสองฝ่าย แต่ยังคุยกับแอดมินได้
- **Implementation:** closedAt + shared chat-history helper; deal API บันทึกเวลาปิดดีลให้ห้องคู่ค้าและห้องอื่นของประกาศ; rooms API เพิ่มประวัติ/ข้อตกลง; messages POST ปฏิเสธเมื่อครบกำหนด
- **Support:** SupportTicket/SupportMessage, private requester/admin APIs; จำกัดหนึ่งคำร้องต่อห้องต่อผู้แจ้ง, เปิดเรื่องซ้ำได้; แอดมินรับเรื่อง ตอบกลับ ดูหลักฐาน และปิดเรื่องพร้อมผลแก้ไข
- **UI:** history tab, read-only composer, support dialog; admin support tab; shared support-center component
- **Database:** เตรียม database/chat-support.sql สำหรับ existing database พร้อม backfill จาก accepted/completed/disputed deals; ยังไม่ apply ฐานข้อมูลจริงและไม่ deploy; schema-only sync ไม่เติมเวลาให้ห้องเก่า ต้องรัน backfill ด้วย
- **Validation:** Prisma schema valid; unit/regression 137/137 ผ่าน; production build ผ่าน compile/TypeScript/prerender 28/28 ใน container ชั่วคราว source mount read-only, network none
- **MySQL:** ทดสอบ SQL upgrade จาก schema เดิม, backfill, เวลาปิดดีลตรง Deal.createdAt, ห้ามส่งแชตหมดเวลา, คำร้องส่วนตัว, แอดมินตอบ/ปิดเรื่องพร้อมผลแก้ไข/เปิดเรื่องซ้ำ และอ่านหลักฐาน ผ่านทั้งหมดในฐานข้อมูล support_check บน MySQL container แยก network none; ไม่ใช่ฐานข้อมูลจริง
- **Docs:** docs/chat-support.md อธิบายพฤติกรรมและลำดับอัปเกรดฐานข้อมูล; tests/chat-support-db.cjs เป็น flow test สำหรับฐานข้อมูลชั่วคราวเท่านั้น
- **Limitations:** ยังไม่ทดสอบ UI ใน browser รอบนี้, ไม่ deploy หรือ apply SQL กับฐานข้อมูลจริง; ห้องเก่าที่ไม่มีหลักฐานดีลจะยังไม่ล็อกจนเติม closedAt ตามหลักฐานจริง
- **Next:** source พร้อมใช้งาน; ต้องสำรอง/อัปเกรดฐานข้อมูลตาม docs/chat-support.md และ rebuild/redeploy ก่อนบริการเดิมเห็นฟีเจอร์ใหม่
**Latest Backup:** `C:\csc481\backups\csc481_backup_20261103_143205` | ZIP: `C:\csc481\backups\durian-hub_backup_20261103_143205.zip`
**Presentation Deck & ERD:** `D:\durian_hub_presentation\index.html`

## Latest Account Settings Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติ Action Plan 4 แท็บด้วย “ลุยเลย”
- **Scope:** ข้อมูลส่วนตัว/รูป; กิจการและบทบาท; เปลี่ยนรหัสผ่านด้วยรหัสเดิม; ภาษา/ธีม; อีเมลและเบอร์อ่านอย่างเดียว; ที่ตั้งระดับบัญชี; ไม่เปลี่ยน schema
- **Plan/files:** แยก `account-settings-dialog.tsx` จาก `page.tsx`; profile GET/PATCH แยก personal/business และตรวจเจ้าของ ACTIVE role; avatar DELETE; password POST; เพิ่ม tests และตรวจ production build/browser
- **Progress:** component 4 หมวดและ API เสร็จ; ลบฟอร์ม/handler เก่าจาก page.tsx; profile GET เป็น private/no-store, PATCH แยก personal/business และห้ามเปลี่ยน email/phone; avatar ตรวจ signature/ชนิดไฟล์และรองรับ DELETE; password ตรวจรหัสเดิม/hash/concurrent guard/local throttle และล้าง cookie เบราว์เซอร์นี้
- **Validation:** unit/regression 126/126 ผ่าน (account ใหม่ 28 กรณี); Edge account UI 17/17 ผ่านและ role/history/chat regression 10/10 ผ่าน ไม่มี runtime exceptions; final production build ผ่าน compile/TypeScript/prerender 26/26 ใน Docker network none พร้อม source mount read-only
- **Artifacts:** `tests/account-settings.test.cjs`, `tests/account-ui.ps1`, `docs/account-ui-preview/README.md`, `checks.json` และภาพ 5 ภาพ; `tests/roles-ui.ps1` ปรับชื่อเมนูใหม่
- **Next:** source พร้อมใช้งาน; หยุด container ทดสอบแล้ว; บริการจริงยังไม่ได้ rebuild/redeploy (entrypoint เดิมมี db push และ seed ทุกครั้งที่เริ่ม)
- **Limitations:** ยังไม่ทำเปลี่ยน email/phone, session list/global logout, ปิดบัญชี หรือที่ตั้งรายกิจการ; password throttle ต่อ process และไม่เพิกถอน session อุปกรณ์อื่น; upload ต้องมี persistent storage เมื่อ deploy; browser ใช้ API fixtures ไม่ใช่ live MySQL integration; ไม่ deploy/แก้ข้อมูลจริง

## Latest Roles & Chat Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติแผนด้วย “ลุยเลย”
- **Goal:** ดูตลาดได้ทุกหมวด; สลับเฉพาะบทบาทที่อนุมัติโดยไม่ logout; ลงประกาศตามบทบาทปัจจุบัน; ประวัติกรองประเภทและสถานะ; สถานะแชตอ่านชัด
- **Changes:** เพิ่มตัวเลือกในเมนูบัญชีทุกขนาดจอ, อัปเดตชื่อกิจการเมื่อสลับ, ป้องกันสลับระหว่างเปิดฟอร์ม/ส่งโพสต์, ตรวจ ACTIVE role และ postType ใน API, authorRole/ชื่อกิจการตาม postType, ตัวกรองประเภทฝั่ง server, สถานะแชตสีขาวบนเขียว
- **Validation:** unit/regression 98/98 ผ่าน; production build + TypeScript + prerender 25/25 ผ่านใน Docker ชั่วคราว; Edge headless 10/10 ผ่าน (ดูหมวดรับซื้อขณะเป็นชาวสวน, approved role selectors desktop/mobile, เปลี่ยนชื่อกิจการโดยไม่ logout, ประวัติกรองประเภท+สถานะ, ฟอร์มรับซื้อ/ล็อกการสลับ, chat contrast light/dark, mobile overflow); ไม่มี runtime exceptions
- **Artifacts:** `tests/post-roles.test.cjs`, `tests/post-history.test.cjs`, `tests/roles-ui.ps1`, `docs/role-ui-preview/README.md`, `checks.json` และภาพ 5 ภาพ
- **Scope/limitations:** ไม่เปลี่ยน schema หรือฐานข้อมูลจริง; browser ใช้ API fixtures และ route tests จำลอง DB/session; ไม่ได้ทดสอบ live MySQL integration; ชื่อกิจการตามข้อมูลบทบาทล่าสุดไม่ใช่ snapshot ในอดีต
- **Next:** Source พร้อมใช้งาน; บริการ Docker เดิมยังไม่ได้ rebuild/redeploy จึงยังแสดงโค้ดเดิม; container ทดสอบแยกถูกหยุดหลังตรวจ

## Latest Post History Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติแผนประวัติโพสต์ด้วยคำว่า “ลุยเลย”
- **Goal:** ประกาศยังอยู่ในประวัติส่วนตัวหลังปิดดีล รวมรายการเก่าเกิน 7 วัน
- **Implementation:** `src/app/api/posts/mine/route.ts` ตรวจ session และกรองด้วย userId ฝั่ง server; ครอบคลุม OPEN/CLOSED/HIDDEN_BY_ADMIN, เรียง createdAt/id, แบ่งหน้า 20 รายการ, private/no-store
- **UI:** `src/components/my-posts-dialog.tsx` แยกจาก marketplace state; ตัวกรองสถานะ, โหลดเพิ่มเติม, loading/error/retry/empty, ไทย/อังกฤษ, ดูรายละเอียดย้อนหลัง; ยกเลิก fetch เมื่อปิดและล้างข้อมูลเมื่อ logout/เปลี่ยนบัญชี
- **Integration:** `src/app/page.tsx` เชื่อม dialog, ตรวจเจ้าของด้วย userId, แสดง closed/hidden แบบอ่านอย่างเดียว, refresh marketplace หลังปิดดีล และยอมรับผลลัพธ์รายการว่างเพื่อไม่ค้างประกาศเดิม
- **Server guard:** `src/app/api/chat/rooms/route.ts` ปฏิเสธการเริ่มเจรจาสำหรับโพสต์ CLOSED/HIDDEN_BY_ADMIN (409)
- **Validation:** unit/regression 82/82 ผ่าน รวม tests/post-history.test.cjs ใหม่ 11 กรณี; TypeScript ผ่านใน Docker ชั่วคราว ใช้ source mount แบบ read-only และ network none; tests/helpers.cjs เพิ่ม URL ให้ VM จำลอง browser/server API ได้
- **Build:** production build ผ่านครบ รวม prerender 25/25 เมื่อกำหนด NODE_ENV=production; รอบแรกที่สืบทอด development จาก image compile/typecheck ผ่าน แต่ prerender /404 ล้มเหลว
- **Limitations:** ไม่เปลี่ยน schema/ข้อมูลจริง; ยังไม่ได้ทดสอบ browser หรือ MySQL integration รอบนี้; container ที่ให้บริการอยู่ไม่มี bind mount จึงยังใช้ source เดิมจนกว่าจะ rebuild/recreate
- **Next:** Source พร้อมใช้งาน; หากใช้ container เดิมต้อง rebuild/recreate web เพื่อโหลด source ใหม่ (`docker compose up -d --build web`); ยังไม่ได้ deploy ทับ service ที่รันอยู่

## Latest Project Backup Task — 2026-11-03
- **Authorization:** ผู้ใช้อนุมัติสำรองข้อมูลโปรเจกต์ด้วยคำว่า “ลุยเลย”
- **Status:** COMPLETED — สำรอง Source Code, Docker configs, Docs, Flowcharts ครบ 100%
- **Deliverables:**
  - โฟลเดอร์สำรองข้อมูล: `C:\csc481\backups\csc481_backup_20261103_143205` (202 ไฟล์)
  - ไฟล์บีบอัด (.zip): `C:\csc481\backups\durian-hub_backup_20261103_143205.zip` (ขนาด ~2.36 MB)
- **Validation:** ตรวจสอบไฟล์ครบ 202 รายการ สร้าง zip สมบูรณ์ ไม่มีไฟล์ build/node_modules ปนเปื้อน

## Latest Flowchart Images Task — 2026-11-02
- **Authorization:** ผู้ใช้อนุมัติแผนสร้างภาพ Flowchart แบบละเอียดด้วยคำว่า “ลุย”
- **Status:** COMPLETED — สร้าง 10 ผังภาษาไทย ทั้ง PNG และ SVG รวม 20 ไฟล์ พร้อมหน้ารวมและต้นฉบับแก้ไขได้
- **Deliverables:** `docs/flowcharts/index.html`, `01-overview` ถึง `10-system-architecture` (.png/.svg), `generate.ps1`, `README.md`, `validation.json`; อัปเดตลิงก์ภาพและขอบเขตตรวจสอบใน `docs/project-flowchart.md`
- **Scope:** ภาพรวม; สมัคร/OTP/login/reset password; ประกาศ; แชท; ปิดดีล; รีวิว; ขอเพิ่มบทบาท; รายงาน/บทลงโทษ; dashboard/snapshot; architecture/Docker/Mailpit
- **Evidence:** ตรวจ API auth/deals/reviews/role requests/reports, `src/lib/otp.ts`, `trust.ts`, `market-stats.ts`, polling ใน page.tsx และ Compose; ใช้เอกสารเดิมเป็นฐาน ไม่สแกนทั้งโปรเจกต์
- **Validation:** 10 SVG อ่าน XML ได้; 148 โหนด / 151 เส้นเชื่อม ตรวจปลายเส้นครบ; ตรวจความกว้างข้อความทุกโหนด; 10 PNG เปิดอ่านได้และขนาดตรง manifest; ลิงก์ภาพใน gallery 40 จุดมีไฟล์ครบ; เปิดดูตัวอย่างภาพรวม/auth/deals/architecture/dashboard และปรับเส้น/ป้ายกำกับ
- **Limitations:** งานเอกสาร ไม่รัน business flow หรือแก้ฐานข้อมูล; SVG ใช้ฟอนต์ไทยในเครื่อง; PNG มีตัวอักษรที่ render แล้ว เหมาะแชร์ข้ามเครื่อง; generator ใช้ Windows System.Drawing
- **Next:** ภาพพร้อมนำไปใส่รายงานหรือสไลด์ เปิด `docs/flowcharts/index.html` เพื่อเลือกภาพ; วิธีสร้างซ้ำอยู่ใน README ของโฟลเดอร์ภาพ

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
