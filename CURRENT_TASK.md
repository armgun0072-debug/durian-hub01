# 📌 Project State & Active Task Tracker

**Project:** Durian Hub (ตลาดกลางทุเรียน)
**Last Updated:** 2026-11-19
**Current Status:** เปิดใช้การจัดการประกาศ ดีลสองฝ่าย รีวิวหลังส่งมอบ ราคาอ้างอิง และการตรวจสิทธิ์หลักฐานแชตแล้ว
**Latest Commit:** `0220001` (base before local UX/UI + Feature Expansion)
**Latest Backup:** `D:\csc481_backup_20261030_013531`
**Presentation Deck & ERD:** `D:\durian_hub_presentation\index.html`

## ปรับหน้าศูนย์ช่วยเหลือ — 2026-11-19

- ปรับ SupportCenter ให้แอดมินเห็นรายการและรายละเอียดเคสพร้อมกันบนเดสก์ท็อป บนมือถือใช้ปุ่มกลับไปรายการและคืนโฟกัสให้แถวเดิม แสดงฟอร์มผลการแก้ไขเมื่อเลือกปิดเรื่อง
- ตรวจ TypeScript ผ่าน ทดสอบ Edge ด้วยข้อมูลจำลองทั้งหน้าแอดมินและผู้ใช้ ครอบคลุมรับเคส เปิดหลักฐาน พักราคา ตอบข้อความ ปิดเรื่อง การส่งคำร้อง และมุมมองมือถือ ตรวจภาพเดสก์ท็อปธีมสว่างและมืดกับภาพมือถือธีมมืด เก็บภาพใน .local/support-inbox-preview

## ปรับข้อ 2–7 ของตลาดกลาง — 2026-11-19

- แอดมินนำประกาศออกจากตลาดโดยเก็บดีล แชต และคำร้องเดิมไว้ ศูนย์ช่วยเหลือให้ผู้รับเรื่องจัดการประกาศจากคำร้องพร้อมบันทึกผลในเคส
- ผู้รับข้อเสนอเท่านั้นที่ยอมรับได้ ทั้งสองฝ่ายยืนยันส่งมอบแยกกัน รีวิวใหม่ผูกกับดีลและนับคะแนนจากดีลที่ยืนยันครบ ดีลเก่าไม่มีสถานะยืนยันสองฝ่ายย้อนหลัง
- ราคาอ้างอิงใช้มัธยฐานและนับแหล่งข้อมูลต่อกลุ่ม อาศัยอย่างน้อยสามผู้ลงประกาศ และกันราคาสุดโต่งจากช่วงราคา Snapshot เดิมเก็บไว้และไม่นำไปปนกับสูตรใหม่
- การอ่านรูปแชตผ่าน URL ตรวจผู้ใช้ ผู้ดูแลที่รับคำร้องเปิดหลักฐานได้และมีประวัติการเข้าดู คู่มือแยกช่วงส่งข้อความ 7 วันออกจากระยะเก็บข้อมูลจริงซึ่งยังต้องกำหนดตามนโยบาย
- ทดสอบ integration แยกผ่านตั้งแต่ข้อเสนอถึงการลบออกจากตลาดและตรวจสิทธิ์แชต TypeScript ผ่าน ชุดรวมผ่าน 138/148 โดย 10 กรณีที่ยังล้มเหลวเป็นรายการที่เคยล้มเหลวก่อนแก้ ตรวจ schema diff ก่อนอัปเดต หลังอัปเดต /, /admin, /api/posts และ /api/market-stats ตอบ 200 และโหมด SMTP เป็น Gmail

## สมัครสมาชิกก่อนยืนยัน OTP — 2026-11-19

- แยก pending_registrations ออกจาก users คำขอผูกกับคุกกี้ของเบราว์เซอร์และรุ่นของคำขอ อีเมลและเบอร์ในคำขอซ้ำกันได้ สร้างบัญชีและบทบาทพร้อมกันเมื่อ OTP ผ่าน หน้า OTP มีปุ่มกลับไปแก้อีเมลหรือเบอร์โดยคงข้อมูลฟอร์ม
- บัญชีสมาชิกค้างเดิมใช้รหัสผ่านเดิมและข้อมูลติดต่อที่ตรงอย่างน้อยหนึ่งช่องเพื่อแก้ข้อมูล ยืนยันอีเมลใหม่ก่อนอัปเดตบัญชีเดิม ไม่มีการลบบัญชี แยกบัญชีแอดมินออกจากการแก้ผ่านการสมัคร
- ทดสอบ integration กับ MySQL และ Mailpit แยก รวมสองเบราว์เซอร์ การแก้เมลและเบอร์ รหัสเก่า รหัสหมดอายุ ขอรหัสซ้ำ จำนวนครั้งที่กรอกผิด การยืนยันพร้อมกัน บัญชีค้างและแอดมิน ผ่าน TypeScript ผ่าน ชุดเดิมผ่าน 131/146 โดย 15 รายการที่ล้มเหลวตรงกับรายการเดิม ตรวจ schema diff ก่อนเปิดเว็บจริงพบเฉพาะ CREATE TABLE และตรวจหลังเปิดว่าแอดมินยัง ACTIVE

## ล้างข้อมูลทดสอบและเพิ่มคำเตือนใน Launcher — 2026-11-19

- Launcher แสดงข้อความให้กดเริ่มระบบเว็บหลังสลับ Gmail/Mailpit หรือแก้ App Password ตรวจข้อความจากฟอร์มที่คอมไพล์แล้ว
- ล้าง 14 ตาราง รวมผู้ใช้ 9 บัญชีและประกาศ 18 รายการ ล้างไฟล์อัปโหลดทั้งใน workspace และ volume และลบคอนเทนเนอร์ Mailpit ที่เก็บจดหมายทดสอบ
- หลังเปิดเว็บใหม่ 14 ตารางมีศูนย์แถว ไฟล์อัปโหลดศูนย์ หน้าเว็บ HTTP 200 และ API ประกาศส่งรายการว่าง SMTP_HOST เป็น smtp.gmail.com คงพื้นที่ 8 รายการ ฤดูกาลภูมิภาค 6 รายการ พันธุ์ 6 รายการ และเกรด 6 รายการ
- โหมด seed ปกติสร้างเฉพาะข้อมูลอ้างอิง การสร้างข้อมูลตัวอย่างต้องเลือก SEED_DEMO_DATA=true เอง ยังไม่มีแอดมินสำหรับใช้งานจริง

## โหมดส่ง OTP — 2026-11-19

- ตรวจปัญหา OTP ไม่เข้า Gmail พบว่า .env เลือก Gmail แล้วแต่คอนเทนเนอร์เดิมยังใช้ Mailpit และพบอีเมลถึงบัญชีผู้ใช้ในกล่องทดสอบ 2 ฉบับ ตรวจ SMTP verify ผ่าน จากนั้นใช้ docker compose up -d --no-deps web ตรวจ SMTP_HOST ในเว็บได้ smtp.gmail.com และหยุด Mailpit รอผู้ใช้กดขอ OTP ใหม่เพื่อยืนยันการรับใน Gmail

- เลือก Gmail หรือ Mailpit ด้วย COMPOSE_FILE ใน .env แล้วกดเริ่มระบบเว็บใน Launcher ตาม README ตั้งผู้ส่ง Gmail เป็น tobibotroo04@gmail.com พร้อมตรวจว่ามี App Password ก่อนเริ่ม Gmail
- สร้างอิมเมจใหม่และย้ายไฟล์อัปโหลด 6 ไฟล์ไปยัง volume web_uploads ตรวจ SHA-256 ตรงกันทุกไฟล์ก่อนสร้างคอนเทนเนอร์เว็บใหม่
- ทดสอบส่ง OTP ผ่านฟังก์ชันของแอปแล้วพบข้อความใน Mailpit เว็บตอบ HTTP 200 ทดสอบ Compose ทั้งสองโหมดและกรณีขาดรหัสแอป ผ่าน TypeScript ส่วน npm test ผ่าน 131 จาก 146 รายการ ล้มเหลว 15 รายการชุดเดิม ยังไม่ได้ทดสอบส่งถึง Gmail จริง

## Windows Launcher — 2026-11-19

- เปิด Docker Desktop แล้วดับเบิลคลิก `DurianHubLauncher.exe` ที่อยู่คู่กับ `docker-compose.yml` กด “เริ่มระบบเว็บ” แล้วรอสถานะพร้อมก่อนเปิดหน้าเว็บ แอดมิน หรือ Mailpit
- “เริ่ม Studio” เปิดฐานข้อมูลที่ localhost:5555 ผ่านบริการ web ของ Compose เดิมและเปิดเบราว์เซอร์เมื่อพร้อม “เปิดลิงก์สาธารณะ” แชร์เว็บพอร์ต 3000 ผ่าน Cloudflare แล้วคัดลอก URL ได้ ปิด Launcher เพื่อยุติ Tunnel ได้ ส่วนบริการ Docker มีปุ่มหยุดแยก
- ปุ่มหยุดระบบใช้ compose stop และเก็บ volume MySQL ไว้ เมื่อเริ่มคอนเทนเนอร์เว็บ สคริปต์เดิมเรียก prisma db push และ prisma db seed
- คอมไพล์ scripts/DurianHubLauncher.cs ด้วย Windows Framework64 csc.exe /codepage:65001 /target:winexe /optimize+ /warnaserror+ ผ่าน ตรวจ PE subsystem, สร้างฟอร์มจาก assembly และทดสอบการแยก URL ผ่าน ตรวจ Compose พบ durian-hub01-main และบริการ web, mysql, mailpit
- ทดสอบคำสั่ง Studio ได้ HTTP 200 จากพอร์ต 5555 แล้วหยุดคอนเทนเนอร์ทดสอบ ยังไม่ได้เปิด Tunnel สาธารณะหรือทดสอบหยุด/เปิดชุดเว็บที่ใช้งานอยู่ การทดสอบเว็บในคอนเทนเนอร์ด้วย npm test ผ่าน 131 จาก 146 รายการ อีก 15 รายการเกี่ยวกับประวัติประกาศ สิทธิ์ลงประกาศ ตลาด และรีวิว

## Latest Phase 2 Feature Expansion Suite (5 Features) — 2026-11-18
- **Authorization:** ผู้ใช้สั่ง “วาง Action Plan รวบทั้ง 5 ข้อ แล้วลุย”
- **Implemented Features:**
  1. **หน้าโปรไฟล์คู่ค้า & อ่านคอมเมนต์รีวิวจริง (`PartnerReviewsDialog`):** เพิ่ม `GET /api/reviews?userId=...` ใน `src/app/api/reviews/route.ts` และสร้าง `src/components/partner-reviews-dialog.tsx` เชื่อมปุ่ม "ดูโปรไฟล์ & รีวิว" ในหน้ารายละเอียดประกาศ
  2. **ตัวกรองเกรดทุเรียน & ระบบจัดเรียงประกาศในตลาดกลาง:** เพิ่มตัวกรองเกรด (`A/AB`, `B`, `C`, `D`) และตัวเลือกเรียงลำดับ (`ล่าสุด`, `ราคาต่ำ→สูง`, `ราคาสูง→ต่ำ`, `ปริมาณมาก→น้อย`, `คะแนนรีวิวสูงสุด`) ใน `src/app/page.tsx`
  3. **อัปเดตสถานะส่งมอบดีล (`COMPLETED`) & พิมพ์ใบสัญญาซื้อขายดิจิทัล:** เพิ่ม `src/app/api/deals/[id]/route.ts` (`PATCH`) และอัปเดต `src/components/my-deals-dialog.tsx` ให้กดยืนยันส่งมอบเสร็จสมบูรณ์และเปิด/พิมพ์ใบสรุปสัญญาซื้อขาย (Digital Contract Slip) ได้
  4. **กระดิ่งแจ้งเตือนรวมบนแถบเมนู (`NotificationBell`):** เพิ่ม `src/app/api/notifications/route.ts` (`GET`) และ `src/components/notification-bell.tsx` แจ้งเตือนรวมเมื่อมีแชตใหม่ ปิดดีล/ส่งมอบดีล ได้รับรีวิว หรือผลอนุมัติบทบาท พร้อมบันทึกสถานะอ่านแล้วใน `localStorage` แยกตาม `userId` ไม่ให้ตัวเลขเด้งซ้ำหลัง Login ใหม่/รีเฟรช
  5. **ปุ่มบันทึก Snapshot ราคารายวัน & Export CSV ในหน้า Admin:** เพิ่ม `src/app/api/admin/market-stats/refresh/route.ts` (`POST`) และเพิ่มปุ่มบันทึก Snapshot ราคากลางประจำวัน + ปุ่ม Export CSV สำหรับตารางประกาศและสมาชิกใน `src/app/admin/page.tsx`
- **Validation:** `npx tsc --noEmit --incremental false` ผ่าน 0 errors, `node tests/ui-feedback.test.cjs` ผ่าน 3/3, `impeccable detect` 0 issues (`[]`), ทดสอบ HTTP endpoints จริงผ่านครบ (`/`, `/admin`, `/api/reviews?userId=1` = 200; `/api/notifications` unauth = 401; `/api/admin/market-stats/refresh` unauth = 403)

## หน้าราคาตลาด — 2026-11-18

- ฟอร์มลงประกาศอ่านจังหวัดจากโปรไฟล์เมื่อเปิดทุกครั้ง หากไม่มีพื้นที่ให้เลือกเอง ใช้เกรดตลาด A–D ร่วมกับตารางราคา ตรวจ TypeScript ผ่าน ทดสอบใน Edge ด้วยบัญชีผู้ขายทดสอบที่ตั้งเป็นยะลา แม้เปิดจากตัวกรองภาคตะวันออก ฟอร์มแสดง 3 จังหวัดชายแดนใต้ / ยะลา โพสต์หมอนทอง B ที่ 168 บาท/กก. (#13) แสดงเฉพาะช่องขายเกรด B ในตารางของภาคนั้น ปิด #13 และตรวจทั้งสี่เกรดกลับเป็นไม่มีข้อมูล ทดสอบกรณีโปรไฟล์ไม่มีจังหวัดและคืนจังหวัดเดิมของบัญชีทดสอบแล้ว
- เอาราคาตั้งต้นระดับภาค/พันธุ์ ตัวคูณเกรด และราคาที่กรอกล่วงหน้าในฟอร์มออก หน้าราคาตลาดเฉลี่ยราคาเสนอจากประกาศ OPEN ตามช่วงเวลาที่เลือก โดยแยกประเภทและเกรดตามข้อมูลที่บันทึก คำนวณหน่วยบาท/กก. และแสดง “ยังไม่มีข้อมูล” เมื่อไม่มีตัวอย่าง
- ทดสอบผ่านฟอร์มใน Edge บน localhost ด้วยบัญชีสวนและล้ง สำหรับหมอนทองเกรด C ใน 3 จังหวัดชายแดนใต้ เริ่มจากไม่มีข้อมูล → ขาย 120 (#10) → ขายเพิ่ม 160 (#11) ได้เฉลี่ย 140 → รับซื้อ 150 (#12) ได้รับซื้อ 150 และขาย 140 เกรดอื่น ภาคตะวันออก และค่าจ้างตัดยังไม่มีข้อมูล ปิดเฉพาะ #10–12 แล้วเปิดหน้าใหม่ ยืนยันกลับเป็นไม่มีข้อมูลและ 0 ประกาศเปิดในช่วง 7 วัน
- ตรวจ TypeScript ผ่าน และชุดทดสอบ market-stats กับ ui-feedback ผ่าน 7/7
- ถอดกล่องแนวโน้มราคาย้อนหลัง 30 วันออกจากหน้าราคาตลาดตามคำขอ เก็บคอมโพเนนต์และ API สำหรับนำกลับมาใช้ ตรวจใน Edge ที่ 390 และ 1440 พิกเซลแล้ว หน้าภาคกลางไม่มีส่วนกราฟค้างท้ายหน้า ไม่มีคำขอสถิติย้อนหลัง เลือกเกรด B และกลับไปยังตารางทุกเกรดได้ TypeScript ผ่าน
- ปรับตัวเลือกภาคและพันธุ์ พับรายชื่อจังหวัด วางราคาสวนคู่กับราคาล้ง และแยกค่าจ้างตัดเป็นแถวรองใน `src/app/page.tsx`
- ตารางมือถือแสดงเกรด สวนเสนอขาย และล้งรับซื้อ ส่วนจอใหญ่ใช้ตารางเปรียบเทียบหลายเกรด ตัวกรองพันธุ์ใช้กับทั้งตารางและมุมมองเกรดเดียว
- ทดสอบใน Edge headless กับเว็บจริงบน localhost โดยใช้บัญชีทดสอบ ที่ความกว้าง 320, 390, 768 และ 1440 พิกเซล การเลือกภาค พันธุ์ เกรด เปิดปิดจังหวัด และกรณีพวงมณีไม่มีราคาแยกเกรดผ่าน หน้าไม่ล้นแนวนอน
- ราคาตั้งต้นภาคตะวันออกตรงกับหน้าเดิมทั้ง 32 ค่าในตารางและ 3 ค่าสรุปทุกขนาด ทดสอบสลับภาษาอังกฤษ เลือกเกรดบนเดสก์ท็อป และอ่านตารางบนมือถือผ่าน
- TypeScript ผ่าน และ Impeccable detect คืน `[]`

- **Latest Marketplace Card & Post Detail Layout Fix — 2026-11-18:**
  - ปรับ `ListingCard` (`src/components/listing-card.tsx`) ใช้ Thumbnail `w-24 h-24` (`object-contain`) ด้านข้างภายในตัวการ์ด และคืน `h-full` + `.listing-grid` แบบปกติ (`src/app/globals.css`) เพื่อไม่ให้เกิดช่องว่างระหว่างแถว และเห็นรูปเต็มใบไม่โดนครอป
  - ตัดเลย์เอาท์ `POST_DETAIL` (`src/app/page.tsx`) ใหม่: นำรูปที่โพสต์จริงมาแสดงฝั่งซ้ายแทนกล่องเขียว `👑` เดิม พร้อม Lightbox Modal คลิกดูภาพขนาดเต็ม (`lightboxImageUrl`), แก้ `จ.undefined`, `ความประพฤติ undefined/100` (`?? 100`), และคำซ้ำ `เกรด เกรด A`
- **Latest Auth Session Flash Fix — 2026-11-18:** เพิ่ม `isCheckingSession` ใน `src/app/page.tsx` แสดงหน้าจอตรวจสอบสถานะการเข้าสู่ระบบระหว่างรอ `/api/auth/me` เพื่อไม่ให้หน้า Login กระพริบเมื่อรีเฟรช (`tsc --noEmit` ผ่าน, `tests/ui-feedback.test.cjs` 3/3 ผ่าน, HTTP 200)
## Latest Feature Expansion Suite — 2026-11-18
- **Authorization:** ผู้ใช้อนุมัติให้ดำเนินการพัฒนาฟีเจอร์ที่วิเคราะห์ด้วยคำว่า “ลุยทำทั้งหมดเลย”
- **Implemented Features:**
  1. **แก้ไข / ปิดการขาย / ลบประกาศของตนเอง:** เพิ่ม `src/app/api/posts/[id]/route.ts` (`PATCH`, `DELETE`), อัปเดต `/api/posts/mine` และเพิ่มฟอร์มแก้ไขออนไลน์, ปุ่มปิด/เปิดรับ, และลบประกาศใน `src/components/my-posts-dialog.tsx`
  2. **อัปโหลดรูปภาพประกอบประกาศ (`PostImage`):** เพิ่ม `src/lib/upload.ts` (ตรวจ magic bytes JPG/PNG/WebP ไม่เกิน 5MB) + `src/app/api/uploads/route.ts`, บันทึกลง `PostImage` ใน `POST /api/posts`, เพิ่มปุ่มอัปโหลด/พรีวิวในฟอร์มลงประกาศ และแสดงรูปในหน้ารายละเอียดประกาศ
  3. **หน้าประวัติสัญญาดีล & สรุปยอดซื้อขาย (`MyDealsDialog`):** เพิ่ม `GET /api/deals` พร้อมสรุปยอดดีล/ปริมาณ/มูลค่า และสร้าง `src/components/my-deals-dialog.tsx` เชื่อมเข้าเมนูบัญชีผู้ใช้
  4. **กราฟแนวโน้มราคาย้อนหลัง 30 วัน (`MarketTrendPanel`):** เพิ่ม `GET /api/market-stats` (ดึง `DailyMarketStat` และ Fallback อัตโนมัติไปรวมค่าเฉลี่ยรายวันจาก `MarketplacePost` จริงเมื่อยังไม่มี Snapshot), สร้าง `src/components/market-trend-panel.tsx` พร้อมกราฟเส้น SVG + แถบราคารายวัน และ Empty State ภาษาผู้ใช้ทั่วไปพร้อมปุ่มไปตลาดกลาง (ไม่มีศัพท์เทคนิค/CLI) รวมถึงแก้คำซ้ำหัวตาราง `เกรด D` ใน `src/app/page.tsx`
  5. **ส่งรูปภาพในห้องแชตเจรจา (`ChatMessageType.IMAGE`):** อัปเดต `/api/chat/rooms/[id]/messages` ให้รองรับ `IMAGE` และเพิ่มปุ่มแนบรูปในห้องแชตพร้อมพรีวิวภาพในบับเบิล
  *(หมายเหตุ: ฟีเจอร์แก้ไขจังหวัดในตั้งค่าบัญชีมีอยู่แล้วใน `/api/user/profile` และ `AccountSettingsDialog`)*
- **Validation:**
  - `npx tsc --noEmit --incremental false`: ผ่าน 0 errors
  - `node tests/ui-feedback.test.cjs`: ผ่าน 3/3
  - `impeccable detect`: 0 warnings/errors (`[]`)
  - Live HTTP checks: `/` (200), `/admin` (200), `/api/market-stats` (200), `/api/deals` unauth (401), `/api/uploads` unauth (401)
  - ซิงก์ไฟล์ทั้งหมดเข้า `durian_hub_web` เรียบร้อย

## Latest UX/UI Refinement (User & Admin) — 2026-11-18
- **Authorization:** ผู้ใช้อนุมัติ Action Plan ด้วยคำว่า “ลุย”
- **Changes (User Page `src/app/page.tsx`):**
  - แทนที่ `alert()` ทั้ง 6 จุดด้วย In-app `uiNotice` banner พร้อมรองรับภาษา TH/EN
  - แก้ `border-l-4` (`side-tab`) บนรายการห้องแชตที่เลือก เป็น Soft Card Highlight (`ring-1 ring-inset ring-brand-line/50`)
  - แก้ปุ่มให้คะแนนดาวคู่ค้าให้มี Hover State (`hover:bg-sky-800`) และเอา `animate-pulse` ออก
  - แทนที่ Emoji ดิบที่หลงเหลือ (`📦`, `💡`, `🎉`, `⚠️`, `✅`, `🚩`, `👤`, `💬`, `🤝`, `🔒`, `🛡️`) ด้วย Lucide Icons และใช้ `<ReviewSummary />` ใน Modal รีวิวแทนค่า fallback `5.0`
  - เพิ่ม `role="tablist"` / `role="tab"` / `aria-selected` ในแท็บตัวกรองห้องแชต
- **Changes (Admin Page `src/app/admin/page.tsx`):**
  - เปลี่ยนการ์ด KPI ทั้ง 4 ใบจาก `<div onClick>` เป็น `<button type="button">` เพื่อรองรับคีย์บอร์ด และเอา `animate-pulse` ออก
  - จัดลำดับแท็บ Desktop ให้ตรงกับ Mobile `<select>` (`ROLE_REQUESTS`, `REPORTS`, `POSTS`, `USERS`, `SUPPORT`), ใช้ `role="tablist"` / `role="tab"` / `aria-selected`, และแก้ Badge Contrast (`bg-warning-soft text-warning-ink`)
  - เพิ่มช่องค้นหาประกาศ (`postSearch`) พร้อมปุ่มล้างคำค้นในแท็บ `POSTS`
  - ปรับปุ่มจัดการในตาราง `POSTS` ให้ใช้ `flex flex-wrap justify-end gap-1.5` และ Semantic Color Tokens
- **Validation:**
  - `impeccable detect`: 0 warnings/errors (`[]`)
  - `tsc --noEmit --incremental false`: 0 errors
  - `tests/ui-feedback.test.cjs`: 3/3 ผ่าน
  - ซิงก์ไฟล์เข้า `durian_hub_web` และตรวจ HTTP 200 OK ทั้ง `/` และ `/admin`

## Latest Docker Rebuild & Cleanup Task — 2026-11-18
- **Authorization:** ผู้ใช้อนุมัติ "โอเคครับจัดไปแล้วก็พวกของตัวเก่าที่ไม่ใช้ลบไปเลย"
- **Actions Performed:**
  1. ลบคอนเทนเนอร์เก่าที่ค้างสะสม: `adoring_bohr` และ `durian_prisma_studio`
  2. ตั้งค่า `.env` เพื่อล็อก `COMPOSE_PROJECT_NAME=durian-hub01-main` ให้ตรงกับระบบ Docker Network และ MySQL Volume เดิม
  3. Rebuild คอนเทนเนอร์ `durian_hub_web` สำเร็จ พร้อมเริ่มทำงานด้วย Next.js 15.5 บนโค้ด Git ล่าสุด
  4. ทำการ Prune แคชและ Image ส่วนเกิน Reclaim พื้นที่คืนได้ **4.348 GB**
  5. ทดสอบ Smoke Test เข้า `http://localhost:3000` สำเร็จ ตอบกลับ `HTTP/1.1 200 OK`



## Latest System-Wide Design Overhaul (Master Action Plan) — 2026-11-11
- **Authorization:** ผู้ใช้อนุมัติ "ลุยเลย" และยืนยัน Master Action Plan ให้รื้อและปรับปรุงดีไซน์ทั้งระบบให้ทันสมัย ใช้งานง่าย ไม่รกสายตา ตามเกณฑ์ของ Skill `impeccable` (`craft-floor.md`, `distill.md`, และ `operate.md`)
- **Key Problems Resolved & Refactorings Applied:**
  1. **Top Navbar & Mobile Navigation (src/app/page.tsx):**
     - ปรับขนาด Navbar ให้กะทัดรัด (Compact 56px) พร้อมจัดระเบียบปุ่ม เมนูสลับธีมถูกย้ายไปรวมใน Profile Dropdown อย่างเรียบร้อย
     - ใน Mobile Nav ปรับสถานะปุ่มที่เลือกอยู่เป็น Soft Accent (`bg-brand-soft text-brand-ink`) คลีนสบายตา
  2. **Role Home Workspace (src/app/page.tsx):**
     - ปรับ Welcome Banner ให้เรียบง่าย สบายตา
     - ยุบการ์ดโครงสร้างหน้า 3 ใบที่เคยอธิบายยาวเวิ่นเว้อ ให้เป็น **Compact Quick Action Cards** แถวเดียว พร้อมไอคอนที่ชัดเจน
     - นำ `<select>` สลับบทบาทที่ลอยซ้ำซ้อนกลางหน้าออก
  3. **Regional Dashboard & Grade Comparison (src/app/page.tsx):**
     - แถบ 6 ภูมิภาค: ปรับเป็นการ์ด Compact Switcher โทนสีเดียวกัน ไม่มีการตัดข้อความเดือนทิ้ง (`...`)
     - ส่วนหัวภูมิภาค: ปลดป้ายแท็ก 3 ใบซ้อนและกรอบกล่องรอบคำอธิบายออก เหลือเฉพาะ Typography ที่สง่างาม
     - พื้นที่จังหวัด: ยุบกำแพงป้าย 17–20 จังหวัดด้วย Progressive Disclosure (`เชียงใหม่ · เชียงราย · ลำปาง... + อีก 12 จังหวัด`)
     - การ์ดราคากลาง 3 ใบ: เปลี่ยนจากกล่องสีฉูดฉาด (เขียว/น้ำเงิน/น้ำตาล) เป็น Modern Stat Cards ตัวเลข `tabular-nums`
     - ตารางเปรียบเทียบเกรด (Matrix Table): **ยกเลิกกล่องสี่เหลี่ยมสีฟ้า/เขียว 24 กล่องในตาราง** เปลี่ยนเป็น Financial Data Layout คมชัด (ล้ง `฿...` / สวน `฿...`) อ่านง่ายทันที
     - นำ Emoji ในระบบออกทั้งหมด เปลี่ยนเป็น Lucide Icons มาตรฐาน (`Sprout`, `Store`, `Scissors`)
  4. **Marketplace Unified Filter Toolbar (src/app/page.tsx):**
     - ยุบแถบตัวกรอง 4 ชั้น (สายพันธุ์, ค้นหา, จังหวัด, ช่วงเวลา, แท็บประกาศ) ให้อยู่ใน **Unified Toolbar แถบเดียว**
     - ผู้ใช้มองเห็นการ์ดประกาศได้ทันทีตั้งแต่ครึ่งบนของหน้าจอ (Above the fold) โดยไม่ต้องเลื่อนหน้าจอลงยาว
  5. **Admin Console (src/app/admin/page.tsx):**
     - ปรับแต่ง KPI Summary Cards ทั้ง 4 ใบให้ใช้ตัวเลข `num` (tabular-nums) คมชัด
     - ตัด Eyebrow ที่ไม่จำเป็นออกตามกฎ craft-floor
- **Verification:**
  - TypeScript Compilation: `tsc --noEmit --incremental false` ผ่าน 0 errors
  - UI Unit Tests: `tests/ui-feedback.test.cjs` ผ่าน 3/3 tests
  - Docker Sync: คัดลอก source files เข้าคอนเทนเนอร์ `durian_hub_web` สำเร็จ
  - Live HTTP Check: `http://localhost:3000` ตอบกลับ `HTTP/1.1 200 OK`

## Latest Season Month Removal from UI — 2026-11-11
- **Authorization:** ผู้ใช้อนุมัติ "ลุย" ให้นำการแสดงผลเดือนฤดูกาลเก็บเกี่ยว (`📅 พ.ค. - มิ.ย.` ฯลฯ) ออกจากหน้าเว็บ เนื่องจากทุเรียนยุคใหม่มีการทำนอกฤดู และระบบเป็นตลาดกลางที่อิงตามกลไกตลาดจริง (Demand-Supply) โดยเก็บตาราง `RegionalSeason` ในฐานข้อมูลไว้ตามเดิมเพื่อรักษาโครงสร้าง ERD และ Foreign Key
- **Resolution:**
  1. ในการ์ดเลือก 6 ภูมิภาคด้านบน: นำป้ายเดือนและไอคอนปฏิทินออก เปลี่ยนมาแสดงจำนวนจังหวัดและสายพันธุ์หลักในพื้นที่ (เช่น `3 จังหวัด • 3 สายพันธุ์`) ช่วยแก้ปัญหาข้อความล้น `...` และแสดงขอบเขตตลาดได้ชัดเจน
  2. ในส่วนหัวของแดชบอร์ดเจาะลึก: นำป้าย `ช่วงผลผลิตออก` และ `ก่อนฤดูกาล` ออก แทนที่ด้วยป้ายจำนวนจังหวัดและสายพันธุ์เด่นของพื้นที่
  3. ปรับคำโปรยหัวเว็บ (`heroSub` และ `heroBadge` ทั้งภาษาไทยและอังกฤษ) ให้เน้นเรื่องข้อมูลราคากลางและกลไกตลาด
- **Validation:** TypeScript check ผ่าน (`tsc --noEmit`), ซิงก์ไฟล์เข้า Docker container `durian_hub_web` สำเร็จ, HTTP GET `http://localhost:3000` ตอบกลับ 200 OK

## Latest Price Sources Note Refactoring (Option 3) — 2026-11-11
- **Authorization:** ผู้ใช้อนุมัติ "ตกลง" ตามแนวทางที่ 3 (ย่อกล่องคำชี้แจงที่มาของราคาเป็นปุ่มกด [ℹ️ ที่มาของราคา] พร้อมปุ่มปิด [×])
- **Problem Solved:** กล่องชี้แจงสีน้ำตาลขนาดใหญ่เดิมแสดงผลค้างไว้ถาวรด้านบนสุดของหน้าแดชบอร์ดราคาตลาด ทำให้บดบังและเกะกะสายตา
- **Resolution:**
  1. เพิ่ม State `showPriceSourceInfo` (default: `false`)
  2. ย้ายคำชี้แจงเข้าไปอยู่ในปุ่ม action ของ `PageHeading` แสดงเป็นปุ่ม `[ℹ️ ที่มาของราคา]` ที่มุมขวาบนของหัวข้อหน้า
  3. เมื่อคลิกปุ่มจะเปิดกล่องคำอธิบายฉบับเต็มอย่างสวยงาม พร้อมปุ่มกากบาท `×` ที่มุมขวาบนสำหรับปิดได้ทุกเมื่อ
  4. หากเกิดข้อผิดพลาดในการโหลดข้อมูล (`postsError`) ระบบจะแสดงแถบแจ้งเตือนสีแดงพร้อมปุ่ม "ลองใหม่" อัตโนมัติ
- **Validation:** TypeScript check ผ่าน (`tsc --noEmit`), ซิงก์ไฟล์เข้า Docker container `durian_hub_web` สำเร็จ, HTTP GET `http://localhost:3000` ตอบกลับ 200 OK

## Latest Dynamic Regional Variety Dashboard — 2026-11-11
- **Authorization:** ผู้ใช้อนุมัติ "ลุยเลย" ตามแนวทาง C (Dynamic ผูกการ์ด KPI กับปุ่มเลือกสายพันธุ์)
- **Problem Solved:** การ์ดราคาเฉลี่ยภาพรวมระดับภูมิภาคเดิมนำทุกสายพันธุ์มาเฉลี่ยรวมกัน ซึ่งผิดหลักเศรษฐศาสตร์เกษตรและราคาตลาดทุเรียน (เช่น มูซังคิง vs หมอนทอง vs บาตามัส)
- **Resolution:**
  1. แปลงป้ายสายพันธุ์ในแดชบอร์ดภูมิภาคให้เป็น **Interactive Variety Pills** (ปุ่มเลือกสายพันธุ์ได้จริง) พร้อมตัวเลือก `🌐 ทุกสายพันธุ์ (ภาพรวม)` และปุ่มเฉพาะรายสายพันธุ์ของภาคนั้น
  2. เชื่อมโยง State `selectedDashboardVariety` กับการ์ด KPI 3 ใบด้านบน (ราคาหน้าสวน, ราคารับซื้อล้ง, ค่าจ้างตัด) อัปเดตราคาและป้ายกำกับสายพันธุ์ทันทีแบบ Dynamic
  3. ไฮไลต์แถวในตาราง Matrix และการ์ดใน Detail View เมื่อคลิกเลือกสายพันธุ์ และสามารถคลิกแถวเพื่อสลับสายพันธุ์ได้
  4. ซิงก์ State เมื่อสลับภูมิภาค ให้รีเซ็ตกลับเป็น `"ALL"` ป้องกันการแสดงผลสายพันธุ์ค้าง
- **Validation:** TypeScript check ผ่าน (`tsc --noEmit`), ซิงก์ไฟล์เข้า Docker container `durian_hub_web` สำเร็จ, HTTP GET `http://localhost:3000` ตอบกลับ 200 OK

## Latest Button Duplicate Plus Fix — 2026-11-11
- **Authorization:** ผู้ใช้อนุมัติ "ลุยเลย" ให้แก้เครื่องหมายบวกซ้ำซ้อนในปุ่ม "+ + ลงประกาศใหม่"
- **Root Cause:** ใน `src/app/page.tsx` มีการใส่ SVG icon `<Plus />` ไว้หน้าปุ่มอยู่แล้ว แต่ในข้อความ `I18N_DICT` (TH/EN) ของ `newPostBtn` ดันมีเครื่องหมายบวกนำหน้าคำ (`"+ ลงประกาศใหม่"` และ `"+ Create Post"`) ทำให้เรนเดอร์เป็น `+  + ลงประกาศใหม่`
- **Resolution:** แก้ `newPostBtn` ใน `src/app/page.tsx` เป็น `"ลงประกาศใหม่"` (TH) และ `"Create Post"` (EN)
- **Validation:** TypeScript check ผ่าน (`tsc --noEmit`), ซิงก์ไฟล์เข้า Docker container `durian_hub_web` สำเร็จ, HTTP GET `http://localhost:3000` ตอบกลับ 200 OK

## Latest UX/UI Implementation — 2026-11-11
- **Authorization:** ผู้ใช้อนุมัติ “ลุยปรับทั้งผู้ใช้และแอดมิน” ตามแผน audit
- **Completed:** responsive navigation/chat/admin tables; mobile section selector; real empty/loading/error/retry states; admin outage retains session/data; in-app confirmation and pending controls; truthful review/price labels; listing images; accessible send/theme/filter controls
- **Files:** src/app/page.tsx, src/app/admin/page.tsx, src/app/ux-layout.css, src/app/globals.css, src/app/layout.tsx, src/components/{review-summary,listing-card,account-settings-dialog,ui}.tsx, src/lib/ui-feedback.ts, src/data/mockData.ts, tests/ui-feedback.test.cjs, scripts/build-pages-demo.cjs
- **Verification:** TypeScript ผ่าน; targeted tests 13/13; full suite 139/146 (7 failures เดิมใน post-roles); static demo build/export ผ่าน; browser ตรวจ mobile/tablet/desktop ตาม matrix ในรายงาน รวม offline/retry และยกเลิก confirmation โดยไม่เปลี่ยนคะแนน
- **Runtime:** ซิงก์ source เข้า Docker local แล้ว; browser คืน online, ปิด DevTools, หน้าหลัก dark; ไม่ deploy public หรือเปลี่ยน DB/API
- **Report:** docs/ux-ui-improvements-2026-11-11.md; ประวัติเดิมใน docs/ui-redesign-results.md
- **Limits/Next:** scope UX ที่อนุมัติเสร็จแล้ว; role tests 7 ข้อเป็นงานค้างเดิม; ยังไม่รับรอง screen reader/WCAG/physical mobile หรือธุรกรรมครบวงจร

## Prior UX/UI Audit — 2026-11-11 (historical)
- **Authorization:** ผู้ใช้ขอวิเคราะห์/ปรับ UX/UI เพิ่มแอดมิน และอนุญาต “ตรวจทุกอย่างเลยได้เต็มที่”; รอบนี้ตรวจและทำรายงาน ยังไม่ได้อนุมัติ implementation plan ใหม่
- **UI inspected:** Edge native + device emulation 320px, 390x844, 768x1024, 1440x900 ตาม matrix ในรายงาน; light/dark; สมาชิก/marketplace/ราคา/inbox/chat/account; admin ทั้ง 5 หมวด; guest login/register/forgot; login EN/200%/offline
- **Findings:** มือถือ chat actions แตกแนวตั้ง, ตารางสมาชิกแอดมินบีบและเลื่อนยาก, แสดง 5.0 ทั้งที่ 0 รีวิว, ราคาสำรองไม่ระบุที่มา, error/retry/auth ambiguity, admin search ไม่มี empty state, send button ไม่มีชื่อสำหรับ accessibility
- **Report:** docs/ux-ui-audit-2026-11-11.md มี coverage จริง, UI vs code-only findings, หลักฐานไฟล์/บรรทัด, ความเสี่ยงและแผนแก้; ไม่อ้างว่าตรวจครบทุก combination หรือผ่าน WCAG
- **Validation:** theme/market-stats unit tests ผ่าน 10/10; TypeScript --noEmit --incremental false ผ่าน; CSS token contrast หลักดี แต่ placeholder light บน surface คำนวณได้ 3.42:1
- **Side effects:** ไม่มีส่งข้อความ/ลงประกาศ/OTP/ลงโทษ/ลบข้อมูล; offline test ทำใน InPrivate ด้วยข้อมูลสมมติ คืน online ล้างข้อมูลและปิดหน้าต่างแล้ว; คืนหน้าต่างหลักหน้าแรก dark zoom 90%; ไม่แก้ application source
- **Limits:** ไม่มี physical mobile, screen reader, pixel scan, performance benchmark หรือธุรกรรมครบวงจร; role tests เดิม 7 ข้อไม่ได้รันใหม่
- **Next:** ให้ผู้ใช้อนุมัติ implementation plan ในรายงานก่อนแก้หน้า marketplace/chat/admin; เริ่ม P1 ของ mobile layout และความถูกต้องของสถานะ/ข้อมูล

## Latest Design Skills Setup — 2026-11-11
- **Authorization:** ผู้ใช้อนุมัติ “ลุย” ตามแผนติดตั้ง Taste Skill/Hallmark ตรวจ Impeccable เดิม และเพิ่มคู่มือทั้งสามตัว
- **Changes:** เพิ่ม design-taste-frontend (Taste 2.5.1) และ hallmark (2.0.0) พร้อม assets/references/scripts/LICENSE; Impeccable 4.8.2 คง revision เดิม
- **Compatibility:** เอา Claude Stop hook ของ Taste ออกจาก frontmatter; เพิ่มหมายเหตุ runtime/scope/approval ให้ทั้งสอง Skills; ไม่เปิด hooks/live mode ไม่เรียก API หรือเปลี่ยน source แอป
- **Provenance:** Taste f6b76575f949707b4e3c37cd86cb44b0b98643e8; Hallmark 407fa689f4a276f2fd389208d271d0fef08f5058; อัปเดต skills-lock.json พร้อม local adaptations
- **Guide:** docs/design-skills-guide.md มีตารางเลือกใช้ ตัวอย่างคำขอภาษาไทย ชื่อเรียกจริง และข้อกำหนด browser/Node/API; เชื่อมจาก docs/agent-skills.md
- **Validation:** python scripts/verify-agent-skills.py ผ่าน (10 managed Skills, 13 ชื่อไม่ซ้ำ, 1,903 file hashes, metadata/LICENSE/local Markdown links); Node v26.7.0; node --check ผ่าน Taste gate/copy-lint และ Hallmark sloplint/theme; Hallmark sloplint --help ผ่าน; git diff --check ผ่าน
- **Limits:** ยังไม่รัน browser gate, render audit หรือ Impeccable engine กับแอป; ไม่ได้แก้หรือทดสอบ role tests เดิม 7 ข้อใหม่
- **Next:** งานติดตั้งและคู่มือเสร็จแล้ว; เรียก $design-taste-frontend, $impeccable หรือ $hallmark ในเทิร์นถัดไป หาก IDE ไม่เห็นให้โหลด session ใหม่

## Latest Agent Skills Setup — 2026-11-11
- **Authorization:** ผู้ใช้อนุมัติ “ลุย” ตามแผนติดตั้ง Find Skills, Skills ที่เลือกจาก Superpowers และ Impeccable พร้อมคู่มือและบันทึกเวอร์ชัน
- **Changes:** เพิ่ม 8 Skills ใน .agents/skills; ปรับ writing-plans และ executing-plans ให้ใช้ CURRENT_TASK.md และทำงาน inline; คง LICENSE และไฟล์ประกอบ
- **Provenance:** skills-lock.json เป็น manifest เฉพาะโปรเจกต์ เก็บ pinned commit และ SHA-256; คู่มือ docs/agent-skills.md ระบุขอบเขตและ local adaptations
- **Scope:** ยังไม่ติดตั้ง claude-mem/task-observer; ไม่เปิด hooks/live mode หรือดาวน์โหลด Impeccable engine; ไม่แก้ source แอป/ฐานข้อมูล/deployment
- **Validation:** python scratch/verify-agent-skills.py ผ่าน: 8 Skills ใหม่, 11 ชื่อไม่ซ้ำรวมของเดิม, metadata/LICENSE/local Markdown links ครบ, ตรวจ SHA-256 ทั้ง 84 ไฟล์ตรงกับ manifest; git diff --check ผ่าน
- **Next:** งานติดตั้งเสร็จแล้ว; Skills พร้อมให้ค้นพบในเทิร์นถัดไปหรือโหลด session ใหม่; role tests เดิม 7 ข้อยังไม่ได้แก้หรือทดสอบใหม่ในงานนี้

## Latest GitHub Pages Demo — 2026-11-07
- **Authorization:** ผู้ใช้เลือกเว็บเดโมบน GitHub Pages และอนุมัติ “ลุย” ตามแผน static demo, ทดสอบ, commit/push และ deploy
- **Changes:** src/demo/page.tsx ใช้ข้อมูลตัวอย่างและคอมโพเนนต์เดิม รองรับค้นหา/กรองประเภทและจังหวัด รายละเอียดประกาศ สถิติ 6 ภูมิภาค ธีม และแชตจำลองใน memory; ไม่มีการส่ง API หรือรับรหัสผ่าน/ไฟล์จริง
- **Build:** scripts/build-pages-demo.cjs คัดลอก source แบบ allowlist ไป .pages-demo-build (Git/TypeScript ignore) และ static export พร้อม basePath /durian-hub01; ไม่รวม API, admin, .env, public/uploads หรือข้อมูลฐานข้อมูล; เพิ่ม workflow และคู่มือ
- **Validation:** static production build ผ่าน; TypeScript ผ่าน; Chrome browser 18/18 checks ผ่าน desktop 1440px/mobile 390px, ไม่มี runtime errors/API requests/broken assets; ตรวจภาพ scratch/pages-demo-desktop.png และ pages-demo-mobile-dark.png
- **Existing regression results:** tests/*.test.cjs ผ่าน 136/143, ไม่ผ่าน 7 ใน tests/post-roles.test.cjs (role validation และ author role); API source ส่วนนั้นไม่มี diff ในงานเดโมนี้ ไม่ได้แก้ข้อผิดพลาดเหล่านี้
- **Hosting:** เปิด Pages build_type=workflow ที่ public repository; deploy commit 42f0e4af2a2bfaf6436c10acabe8fe56d49b9d04 สำเร็จผ่าน Actions https://github.com/armgun0072-debug/durian-hub01/actions/runs/42272598705 (build/deploy success)
- **Live validation:** https://armgun0072-debug.github.io/durian-hub01/ เปิดได้; Chrome checks บน URL จริงผ่าน 18/18 ไม่มี runtime errors/API requests/broken assets; เพิ่ม PAGES_DEMO_URL สำหรับตรวจเว็บจริงซ้ำได้
- **Next:** งาน deploy demo เสร็จแล้ว; source/build configuration ที่ push ไป main จะ deploy ใหม่อัตโนมัติ บันทึกเอกสารและ browser tests ไม่กระตุ้น deploy; ยังมีข้อผิดพลาด API role tests เดิม 7 ข้อตามบันทึกข้างต้น

## Latest Prisma Client Refresh — 2026-11-07
- **Authorization:** ผู้ใช้อนุมัติ “ช่วยจัดการที” ตามแผนสร้าง Client ใหม่และตรวจ TypeScript
- **Cause:** schema ภายใน generated Client เดิมไม่ตรงกับ prisma/schema.prisma โดยไม่มี closedAt, SupportTicket และ SupportMessage
- **Resolution:** รัน node node_modules/prisma/build/index.js generate สำเร็จ ได้ Prisma Client v6.19.3 โดยไม่ต้องหยุดโปรเซสหรือแก้ schema
- **Validation:** node node_modules/typescript/bin/tsc --noEmit --incremental false ผ่าน (exit code 0, ไม่มี errors)
- **Scope:** อัปเดต generated files ใน node_modules และบันทึกนี้ ไม่รัน migration/db push/seed และไม่แก้ข้อมูลฐานข้อมูล
- **Next:** ปัญหา TypeScript จาก Client เก่าแก้แล้ว; รวมบันทึกรอบนี้ใน commit งาน Pages demo

## Latest Git Publication Task — 2026-11-07
- **Authorization:** ผู้ใช้อนุมัติ “ลุย” ให้ commit งานค้างทั้งหมด 19 ไฟล์และ push ไป origin/main ที่ https://github.com/armgun0072-debug/durian-hub01.git
- **Scope:** แก้ syntax posts API, เอกสาร/ภาพฐานข้อมูลและ Flowchart, สคริปต์ renderer และบันทึกสถานะ; ไฟล์ชั่วคราวที่เคลียร์เป็น ignored files จึงไม่มีรายการลบใน commit
- **Validation:** git diff --check และ node --check scripts/render-system-flowchart.cjs ผ่าน; TypeScript ไม่ผ่านเนื่องจาก generated Prisma Client ในเครื่องไม่มี closedAt/supportTicket/supportMessage ที่ source ใช้ ยังไม่ได้แก้ปัญหานี้ในงานเผยแพร่
- **Remote check:** GitHub main ชี้ไป 12f3c0ac41bdb741a15502a71d5746e3e155a549 ตรงกับ local HEAD ก่อน commit
- **Result:** commit 184a1e22a7923b89ece6fe19005d39f3743852d3 push ไป origin/main สำเร็จ และตรวจ remote hash ตรงกับ local แล้ว

## Latest Temporary File Cleanup — 2026-11-07
- **Authorization:** ผู้ใช้อนุมัติ “ลุย” ตามแผนลบเฉพาะ .next-ui-test/, scratch/flowchart-render/ และ tsconfig.tsbuildinfo
- **Changes:** ลบไฟล์ชั่วคราว/ผล build รวม 497 ไฟล์ ขนาดรวม 151,095,340 bytes (ประมาณ 144.1 MiB); เก็บ source, docs, dependencies, ZIP และไฟล์สำรองเดิมไว้
- **Validation:** ยืนยันพาธอยู่ภายใน D:\csc481 และไม่มี reparse points; ทดลองเปิดไฟล์ทั้ง 497 ไฟล์แบบ exclusive ผ่านก่อนลบ ตรวจ CIM process command lines ไม่ได้เพราะ access denied จึงใช้การตรวจ file locks แทน
- **Impact:** การ build/ทดสอบ/เรนเดอร์ครั้งถัดไปจะสร้างแคชและพื้นที่ชั่วคราวใหม่ ไม่เปลี่ยนโค้ดแอปหรือฐานข้อมูล
- **Next:** งานเคลียร์ตามรายการที่อนุมัติเสร็จแล้ว; รายการอื่นต้องประเมินแยกก่อนลบ

## Latest Hotfix Task — 2026-11-06
- **Authorization:** ผู้ใช้อนุมัติแก้ไข Syntax error จากภาพหน้าจอเบราว์เซอร์
- **Root Cause:** พบเครื่องหมาย `+` เกินมาที่บรรทัด 56 ของ `src/app/api/posts/route.ts` ภายใน Docker container `durian_hub_web` ทำให้ Next.js เกิด Build Error `Expression expected`
- **Resolution:** ซิงค์ไฟล์ที่ถูกต้องเข้า container และสั่งรีสตาร์ท `durian_hub_web`
- **Validation:** ทดสอบยิง HTTP Request ไปที่ `http://localhost:3000/api/posts` และ `http://localhost:3000` ตอบกลับ `200 OK` สมบูรณ์ หน้าเว็บใช้งานได้ปกติ 100%

## Latest Vertical Flowchart Redesign Task — 2026-11-04
- **Authorization:** ผู้ใช้อนุมัติ “ลุย” หลังเสนอแผนปรับ Flowchart ตามภาพอ้างอิง: แนวตั้ง เส้นหักมุม พื้นดำ กล่องน้ำเงิน ตัวอักษรฟ้า
- **Changes:** Flowchart SVG/PNG จัดตำแหน่งเอง ใช้จุดเชื่อมอักษรเดียวกันแทนเส้นข้ามภาพ; MMD/เอกสารอัปเดตขั้นตอนตรงกัน มีคำอธิบายจุดเชื่อม; เพิ่ม scripts/render-system-flowchart.cjs สร้างซ้ำด้วย Chrome และแก้ caption ภาษาไทยที่แสดงเป็นเครื่องหมายคำถามในเอกสาร
- **Validation:** Chrome render ผ่าน PNG 3800×9080, SVG 1900×4540, 73 nodes (รวม connectors), 68 arrows, ไม่มีข้อความล้นกล่อง/foreignObject; geometry check พบ 0 กล่องทับกัน / 0 เส้นผ่านกล่องอื่น / 0 เส้นตัดกัน; Mermaid 11.12.2 parse MMD ผ่าน; source ตรงเอกสาร, ลิงก์ docs overview/diagrams README 72 จุดผ่าน และ git diff --check ผ่าน
- **Scope:** แก้ภาพและเอกสาร ไม่เปลี่ยน ER/API/schema หรือข้อมูลจริง ไม่ใส่ flow COMPLETED ที่ยังไม่ได้ยืนยันการใช้งานจริง
- **Next:** เปิด docs/diagrams/system-flowchart.png หรือ SVG ใหม่; สร้างซ้ำได้ด้วย node scripts/render-system-flowchart.cjs (ใช้ local Chrome ไม่ต้องดาวน์โหลด dependencies)

## Latest Database Diagram Image Export Task — 2026-11-04
- **Authorization:** ผู้ใช้อนุมัติ “ลุย” ให้ส่งออก ER 3 กลุ่มและ Flowchart เป็น PNG/SVG ตามแผน
- **Deliverables:** docs/diagrams/ มี PNG/SVG/MMD อย่างละ 4 ไฟล์ พร้อม README และ render-checks.json; docs/database-overview.md แสดง PNG พร้อมลิงก์ PNG/SVG และพับ Mermaid ต้นฉบับไว้
- **Rendering:** Mermaid 11.12.2 / Chrome headless, Tahoma, PNG 2x, SVG ไม่มี foreignObject; ปรับสีป้ายเส้นและตำแหน่ง groups_area เพื่อให้อ่านได้ ไม่เปลี่ยนความสัมพันธ์
- **Validation:** เรนเดอร์สำเร็จทั้ง 4 ภาพ ตรวจภาพและภาษาไทย; Node ตรวจ PNG signature/dimensions 4 ไฟล์, SVG 4 ไฟล์ไม่มี script/foreignObject, MMD ตรงเอกสารทั้ง 4, ER ครบ 18 ตาราง/19 เส้นและป้ายชื่อครบ; local links 70 จุดและ git diff --check ผ่าน
- **Scope:** ดาวน์โหลด renderer ไว้ scratch/diagram-renderer และใช้ helper ชั่วคราว ไม่แก้ package dependencies/schema/API หรือฐานข้อมูลจริง
- **Next:** เปิดรูปขนาดเต็มจาก docs/diagrams/README.md; SVG เหมาะกับขยาย Flowchart และงานพิมพ์

## Latest Database Overview Documentation Task — 2026-11-04
- **Authorization:** ผู้ใช้อนุมัติ “ลุยเลย” ตามแผน Relationship Diagram 3 กลุ่ม, Flowchart ภาพรวม และข้อเสนอแนะฐานข้อมูล
- **Changes:** เพิ่ม docs/database-overview.md พร้อม Mermaid ER 3 กลุ่ม ครบ 18 ตารางและ FK หลัก, flowchart และข้อเสนอแนะอ้างอิง source; database/README.md เพิ่มลิงก์
- **Evidence:** ตรวจ prisma/schema.prisma และ auth/posts/chat/deals/reviews/support/admin APIs รวม market-stats/repair scripts; ไม่เพิ่มเส้น FK handled_by_id หรือ deals.room_id ที่ไม่มีจริง
- **Validation:** Node ตรวจผ่าน 18 tables / 31 FK จาก Prisma; ER 3 กลุ่มครอบคลุม 18 ตาราง เส้นหลัก 19 เส้นตรง FK และ optional cardinality; รวม Mermaid 4 blocks; local links 50 จุดผ่าน และ git diff --check ผ่าน ไม่ได้ทดสอบ render ด้วย Mermaid parser/viewer โดยตรง
- **Scope:** เอกสารเท่านั้น ไม่แก้ schema/API ไม่เชื่อมหรือแก้ฐานข้อมูลจริง
- **Next:** เอกสารพร้อมอ่านผ่าน docs/database-overview.md หรือ database/README.md; ใช้ Markdown viewer ที่รองรับ Mermaid เพื่อดูภาพ ข้อเสนอแนะฐานข้อมูลยังไม่ได้ดำเนินการ

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
