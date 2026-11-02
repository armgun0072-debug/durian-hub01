# ผลแก้ไขและทดสอบฐานข้อมูล — 2026-11-02

## สิ่งที่แก้

1. ปิดดีล: ตรวจสมาชิกห้อง คู่ค้า ประกาศและเจ้าของ; บังคับ roomId และห้อง ACTIVE; ตรวจค่าราคา/ปริมาณ/วันตัด; claim ประกาศ OPEN แบบ atomic; รวมดีล ข้อความ และสถานะทุกห้องใน Serializable transaction พร้อม retry สูงสุด 3 ครั้ง
2. รายงาน: ตรวจเหตุผล/รายละเอียดและห้ามรายงานตัวเอง; ตัวนับ report_count กับรายการรายงานบันทึกใน transaction; ล็อก parent ก่อน insert child เพื่อแก้ deadlock ที่พบจาก concurrent integration test
3. เข้าชม: เพิ่ม POST /api/posts/:id/view และเรียกจากการเปิดรายละเอียดบน UI; atomic increment; ไม่เพิ่มจาก list/polling และไม่รับโพสต์ซ่อน; นับครั้งเปิด ไม่ใช่ผู้เข้าชมไม่ซ้ำ
4. รีวิว: ติดตั้ง CHECK คะแนน 1–5 จริงบน MySQL; ใช้ API ตรวจคู่ค้าและห้ามรีวิวตัวเองตามเดิม; reconcile ค่าเฉลี่ย/จำนวนรีวิวและจำนวนรายงานเดิมให้ตรงกับรายการต้นทาง
5. สถิติ: เพิ่ม npm run stats:refresh สำหรับ snapshot วันปัจจุบันตามเวลาไทยจาก OPEN/non-outlier ใน 7 วัน; แยกพันธุ์/เกรด/พื้นที่; แปลงราคาต่อตันและเหมาตามปริมาณ; ไม่รวมค่าจ้างตัดใน min/max ราคาผลไม้; คงราคาอ้างอิงที่กรอกไว้; รันซ้ำไม่เพิ่มแถวซ้ำ
6. เอกสาร: ระบุ schema.sql เป็น PostgreSQL เก่า; ใช้ Prisma เป็น schema หลัก MySQL; เพิ่มคู่มือ maintenance และ ER ความสัมพันธ์แบบระบุหน้าที่; ปรับ flowchart ปิดดีลให้ตรงโค้ด

## การเปลี่ยนข้อมูลจริง

- MySQL 8.0.46, ฐานข้อมูลแอป durian_hub
- เพิ่ม CHECK user_reviews_rating_range
- สำรองค่าตัวนับ/คะแนนเดิม: database/backups/aggregate-totals-1793556787570.json
- หลัง reconcile: report_count และ rating_avg/rating_count ต่างจากข้อมูลต้นทาง 0 รายการ
- จำนวนประกาศเดิม 10 และรีวิวเดิม 4 รายการยังอยู่ครบ
- snapshot 2026-11-02: 1 กลุ่ม/1 ตัวอย่างที่ผ่านเงื่อนไข
- ฐานข้อมูลทดสอบแบบสุ่มชื่อ durian_hub_test_<hex> ถูกลบหลังจบ; ตรวจแล้วเหลือ 0 ฐาน

## ผลทดสอบ

| การตรวจ | ผล |
|---|---|
| Unit/mock regression | ผ่าน 65/65 |
| MySQL จริง แยกฐานข้อมูลทดสอบ | ผ่าน 10/10 |
| TypeScript noEmit | ผ่าน |
| Prisma validate | ผ่าน |
| Next.js production build | ผ่าน |
| HTTP smoke หลัง production build | ผ่าน 7/7 |

MySQL integration ใช้ route และฐานข้อมูลจริง โดยแทนเฉพาะ authentication และจุดที่ตั้งใจให้เกิดความล้มเหลวเพื่อทดสอบ rollback ครอบคลุมคนนอกปิดดีลไม่ได้, ปิดดีลพร้อมกันได้หนึ่งผู้ชนะ, rollback ดีล, รีวิวพร้อมกันและคะแนนรวม, รีวิวซ้ำพร้อมกัน, rollback รีวิว, CHECK ปฏิเสธ direct write คะแนน 0/6, concurrent report/view counters, rollback counter เมื่อ insert รายงานล้มเหลว และ snapshot ที่รันซ้ำ/ล้างค่าล้าสมัย/คงราคาอ้างอิง

HTTP smoke: GET /, /admin, /api/posts ได้ 200; POST /api/deals, /api/reviews, /api/posts/0/report ที่ไม่ล็อกอินได้ 401; POST /api/posts/0/view ได้ 400 ไม่มีการสร้างข้อมูลทดสอบในฐานแอปจาก HTTP smoke และหยุด server ทดสอบพอร์ต 3107 แล้ว

## ขอบเขตและข้อจำกัด

- ไม่พบ FK license_number → id ใน Prisma หรือ MySQL จริง จึงไม่มี FK ดังกล่าวให้ลบ
- ไม่เพิ่ม payment workflow เพราะระบบปัจจุบันบันทึกข้อตกลง; ACCEPTED ไม่ได้แปลว่าชำระแล้ว
- snapshot มีคำสั่งพร้อมใช้ แต่ยังไม่ตั้ง scheduled task และหน้า dashboard เดิมยังคำนวณจาก posts API
- ไม่ได้ทดสอบการคลิกผ่าน browser หรือสมัคร/ยืนยันอีเมล/ลงโทษครบวงจรในรอบนี้
- MySQL ไม่อนุญาต cross-column self-review CHECK กับ FK referential action ปัจจุบัน จึงคงการตรวจคู่ค้าและห้ามรีวิวตัวเองที่ API โดยไม่เปลี่ยนนโยบาย FK
- คำสั่ง snapshot ใช้ native TypeScript ของ Node 22.18+ (ตรวจบน Node 26) เพื่อเลี่ยงปัญหา tsx อ่านข้อมูลผู้ใช้ Windows ในสภาพแวดล้อมนี้

รายละเอียดคำสั่งและนิยามสถิติ: [database-integrity.md](database-integrity.md)
