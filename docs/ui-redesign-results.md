# ผลปรับ UX/UI — 2026-11-02

ผู้ใช้อนุมัติแผนด้วยคำว่า “ลุย” เป้าหมายคือหน้าตาคลีน ใช้งานง่าย ไปในทิศทางเดียวกัน และเลือกโหมดมืดได้

## สิ่งที่เปลี่ยน

- ใช้ระบบสีร่วมตามหน้าที่: พื้นหน้า พื้นการ์ด ข้อความ เส้นขอบ สีหลัก และสีสถานะ ผ่าน CSS variables และ Tailwind ทั้งหน้าเว็บผู้ใช้และแอดมิน
- เพิ่มตัวเลือกสว่าง/มืด/ตามระบบ บนหน้าเข้าสู่ระบบและแถบหัวเว็บ จำค่าที่เลือกใน localStorage รองรับการเปลี่ยนธีมของระบบและการซิงก์ storage ระหว่างแท็บ มี bootstrap ก่อนแสดงเนื้อหาเพื่อลดการกะพริบของธีม
- ปรับพื้นหลัง การ์ด ระยะห่าง ขนาดข้อความ ความหนาตัวอักษร ปุ่ม ช่องกรอก และหัวข้อให้เป็นรูปแบบเดียวกัน ลด gradient เงา และข้อความกำกับที่ซ้ำซ้อน
- ใช้ ListingCard กลางสำหรับประกาศขาย/รับซื้อ/บริการตัด เน้นชื่อประกาศ ราคา ปริมาณ พื้นที่ และผู้ขาย แยกข้อมูลออกจากแถวป้ายที่เคยเบียดชื่อผู้ขาย
- ย่อเมนูและหัวข้อไทย/อังกฤษ แถบสายพันธุ์เปลี่ยนเป็น filter chips พร้อมจำนวนผลลัพธ์และปุ่มล้างตัวกรอง โดยไม่แสดงราคาเฉลี่ยจำลองของแถบเดิม
- มือถือมีตัวเลือกสลับบทบาทและภาษา แชทแสดงรายการห้องหรือห้องที่เลือกทีละส่วน พร้อมปุ่มกลับรายการสนทนา หน้าเข้าสู่ระบบลดความสูงของส่วนแบรนด์ให้เข้าถึงฟอร์มง่ายขึ้น
- ใช้ DialogFrame ร่วมกับโมดัลผู้ใช้และแอดมิน: เก็บโฟกัสภายใน กด Escape เพื่อปิด คืนโฟกัสเดิม และล็อกการเลื่อนพื้นหลัง ปรับขนาดให้เลื่อนได้ในจอเตี้ย
- เชื่อม label กับช่องกรอก เพิ่ม focus indicator, skip link และรองรับ prefers-reduced-motion
- ช่อง login เริ่มว่างและไม่ถูกเขียนทับด้วยบัญชีทดสอบเมื่อเลือกบทบาท เอาลิงก์ Mailpit/รหัสผ่าน demo ออกจากหน้าใช้งาน; Mailpit backend ยังทำงานตามเดิม
- เอาข้อความ “ยืนยันตัวตนแล้ว” ที่ welcome banner แสดงโดยไม่ตรวจ KYC ออก คงคะแนนความประพฤติ ส่วน ListingCard แสดงสัญลักษณ์ยืนยันเฉพาะเมื่อข้อมูลประกาศระบุว่าผ่านจริง

## การใช้งานธีม

เลือกไอคอนดวงอาทิตย์ ดวงจันทร์ หรือจอภาพ ที่มุมหัวหน้าเว็บ ตัวเลือกจอภาพใช้ธีมตามระบบ ค่าถูกจำเฉพาะ browser นี้ หาก browser ปิดกั้น storage ยังเปลี่ยนธีมในแท็บปัจจุบันได้

## ผลทดสอบ

| การตรวจ | ผล |
|---|---|
| Regression และ theme bootstrap | ผ่าน 71/71 |
| Chrome จริง + MySQL แยกฐาน | ผ่าน 25/25 checks |
| Production build ของ source สุดท้าย | ผ่าน ใน `.next-ui-test` |
| TypeScript noEmit หลังคืน type paths | ผ่าน |
| Runtime exceptions ใน Chrome suite | 0 |
| ฐานข้อมูล UI test ที่เหลือหลังจบ | 0 |

Chrome ตรวจหน้าเข้าสู่ระบบ หน้าหลัก ตลาดกลาง แดชบอร์ด แชท และแอดมิน; viewport 320, 390, 1100 และ 1440px; การจำธีมหลัง reload; system preference เปลี่ยนแล้วธีมเปลี่ยนตาม; ค้นหาและล้างตัวกรอง; เปิดโมดัล/โฟกัส/Tab/Escape; กลับจากห้องแชทบนมือถือ; root page ไม่ล้นแนวนอนใน viewport ที่ตรวจ; และ contrast ของปุ่มหลักทั้งสว่างและมืดอย่างน้อย 4.5:1 การตรวจ contrast นี้เป็นตัวอย่างปุ่มหลัก ไม่ใช่การรับรอง accessibility ทั้งเว็บไซต์

ชุด browser ใช้บัญชี/ประกาศตัวอย่างใน MySQL ชั่วคราวและล็อกอินผ่าน API จริง ไม่ใช้ข้อมูลสมาชิกจริง ไม่มีการส่งอีเมลหรือเปลี่ยนข้อมูลแอป การทดสอบนี้ยังไม่ครอบคลุมสมัครสมาชิก/OTP และทุกคำสั่งจัดการข้อมูลของแอดมิน

หลังจบตรวจฐานข้อมูลแอป: ประกาศ 10 และรีวิว 4 รายการยังอยู่ตามเดิม งานรอบนี้ไม่มีการแก้ schema หรือ API

## ภาพตัวอย่างจาก Chrome

- ตลาดกลาง: [สว่าง](ui-preview/market-light.png) · [มืด](ui-preview/market-dark.png) · [มือถือ](ui-preview/market-mobile-light.png)
- เข้าสู่ระบบ: [สว่าง](ui-preview/login-light.png) · [มืด](ui-preview/login-dark.png) · [มือถือ](ui-preview/login-mobile-dark.png)
- หน้าหลัก: [สว่าง](ui-preview/workspace-light.png) · [มืด](ui-preview/workspace-dark.png)
- แดชบอร์ด: [มืด](ui-preview/dashboard-dark.png) · [มือถือ](ui-preview/dashboard-mobile.png)
- แชท: [กล่องข้อความ](ui-preview/inbox-mobile.png) · [ห้องสนทนา](ui-preview/conversation-mobile.png)
- แอดมิน: [สว่าง](ui-preview/admin-light.png) · [มืด](ui-preview/admin-dark.png) · [มือถือ](ui-preview/admin-mobile-dark.png)
- โมดัลลงประกาศ: [มือถือ](ui-preview/listing-modal-mobile.png)
- หลักฐาน checks: [checks.json](ui-preview/checks.json)

ภาพทั้งหมดเป็นข้อมูลตัวอย่างในฐานทดสอบ

## รันทดสอบซ้ำ

```powershell
npm test
npm run test:ui
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

`test:ui` ต้องมี `.env` ที่เชื่อม MySQL พร้อมสิทธิ์ CREATE/DROP DATABASE, Chrome ที่ตำแหน่งมาตรฐาน Windows (หรือกำหนด CHROME_PATH), Node ที่มี WebSocket ในตัว และพอร์ต 3110 ว่าง สคริปต์สร้าง production build ใน `.next-ui-test` แยกจาก next dev, ใช้ฐาน `durian_hub_ui_test_<hex>` และ Chrome profile ชั่วคราว แล้วหยุด server/Chrome และล้างฐาน/profile ของการรันนั้นหลังจบ พร้อมคืน generated type paths ของแอป

## ไฟล์หลัก

`src/app/globals.css`, `src/app/layout.tsx`, `tailwind.config.ts`, `src/lib/theme.ts`, `src/components/`, `src/app/page.tsx`, `src/app/admin/page.tsx`, `next.config.js`, `tests/theme.test.cjs`, `tests/ui-browser.cjs`
