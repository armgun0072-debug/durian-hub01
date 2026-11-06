# โครงสร้างฐานข้อมูลล่าสุดและ ER Diagram

แหล่งอ้างอิงหลักคือ `prisma/schema.prisma` ซึ่งใช้ MySQL ไฟล์ export เป็นโครงสร้างตาม source ปัจจุบัน ไม่ใช่ dump หรือผลตรวจฐานข้อมูลที่กำลังรัน

อ่าน [Relationship Diagram 3 กลุ่ม, Flowchart ภาพรวมระบบ และข้อเสนอแนะฐานข้อมูล](../docs/database-overview.md) สำหรับภาพรวมภาษาไทยพร้อมหลักฐานจาก source

| ไฟล์ | ใช้งาน |
| --- | --- |
| [schema-latest.mysql.sql](schema-latest.mysql.sql) | MySQL DDL ล่าสุดครบ 18 ตาราง / 31 Foreign Keys พร้อม indexes, nullability, defaults และ CHECK คะแนนรีวิว 1–5 |
| [schema-latest.dbml](schema-latest.dbml) | วางในเครื่องมือวาด ER ที่รองรับ DBML รวมชนิด enum และความสัมพันธ์ตาม DDL |
| [schema-schemastudio.dbml](schema-schemastudio.dbml) | เวอร์ชันพื้นฐานสำหรับ Schema Studio ที่ระบุ DBML subset; ใช้ Table/Enum และ Ref แบบไม่มีชื่อ |
| [schema-export-checks.json](schema-export-checks.json) | ผลตรวจจำนวนตาราง คอลัมน์ และปลายทาง Foreign Keys ของ export |
| `schema.sql` | แบบออกแบบ PostgreSQL เก่า ไม่ใช่ schema สำหรับแอป MySQL ปัจจุบัน |
| `chat-support.sql` / `support-queue.sql` | อัปเกรดฐานข้อมูลเดิม ไม่ต้องรันซ้ำบนฐานข้อมูลใหม่ที่สร้างจาก latest SQL แล้ว |
| `hardening.sql` | CHECK คะแนนรีวิว ซึ่งรวมใน latest SQL แล้ว ไม่ต้องเพิ่มซ้ำ |

## วาด ER Diagram ด้วย MySQL Workbench

1. เปิด MySQL Workbench แล้วเลือก **File → Import → Reverse Engineer MySQL Create Script**
2. เลือก `schema-latest.mysql.sql` และนำเข้าเป็น model (ไม่ใช่รัน SQL บน connection ฐานข้อมูลจริง)
3. เลือกนำตารางไปวางใน diagram หากเวอร์ชันที่ใช้มีตัวเลือกนี้ หรือสร้าง EER Diagram แล้วลากตารางจาก Catalog ลงบนผัง
4. จัดตำแหน่งตารางตามหมวด เช่น สมาชิก ตลาดกลาง แชต ศูนย์ช่วยเหลือ และสถิติ แล้วบันทึก model เป็น `.mwb` หรือ export ภาพจากเครื่องมือ

หากมีฐานข้อมูลจริงที่อัปเกรดครบแล้ว สามารถ reverse engineer จาก connection นั้นได้ แต่โครงสร้างที่ได้จะตรงกับฐานข้อมูลจริง ณ ตอนนั้น ซึ่งอาจต่างจาก source หากยังไม่ได้อัปเกรด

## ใช้ DBML

**หากใช้ Schema Studio ตามภาพที่แจ้ง error:** เปิด `schema-schemastudio.dbml` แล้วกด Ctrl+A → Ctrl+C จากนั้นแทนที่เนื้อหา editor เดิมทั้งหมดด้วยไฟล์นี้ เวอร์ชันนี้ไม่มี Project, indexes block, default/note หรือชื่อและ options ของ Ref และลดช่องว่างในชนิด decimal เช่น `decimal(10,2)` เพื่อหลีกเลี่ยง syntax ขั้นสูง

ยังครบ 18 ตาราง, 169 คอลัมน์, 17 enum definitions และ 31 ความสัมพันธ์ รวม PK, increment, not null และ unique ของคอลัมน์เดี่ยว ส่วน composite unique/indexes, defaults, notes, CHECK และ delete/update actions ให้อ้างอิงไฟล์ MySQL/DBML ฉบับเต็ม ตัวไฟล์ subset ใช้วาดผัง ไม่ใช่แหล่งสร้าง schema ฐานข้อมูลจริง

ตรวจความครบถ้วนด้วยสคริปต์แล้ว แต่ยังไม่ได้ตรวจ parser ของเว็บ Schema Studio โดยตรง

เปิด `schema-latest.dbml` แล้วคัดลอกเนื้อหาทั้งไฟล์ไปยัง editor ที่รองรับ DBML ไฟล์นี้ใช้ชื่อ physical table/column เช่น `users`, `support_tickets`, `queued_at` ให้ตรงกับ MySQL

ข้อจำกัดที่บันทึกตามโครงสร้างจริง:

- `support_tickets.handled_by_id` เป็นรหัสแอดมินที่ตรวจในแอป แต่ **ยังไม่มี FK** ใน Prisma จึงไม่มีเส้นเชื่อมใน ER นี้
- `deals` อ้างอิงประกาศและคู่ค้า ไม่มี `room_id` โดยตรง จึงไม่เพิ่มเส้นเชื่อมกับห้องแชตเอง
- ค่า `@updatedAt` ถูกจัดการโดย Prisma ไม่ได้แปลว่า SQL มี `ON UPDATE CURRENT_TIMESTAMP`
- DBML บันทึก CHECK คะแนนรีวิวเป็น note ส่วนข้อบังคับจริงอยู่ใน SQL
- คำสั่งล็อกแชตหลัง 7 วันและลำดับคิวเป็น business logic ไม่ใช่ความสัมพันธ์ระหว่างตาราง

## สร้างไฟล์ใหม่หลังแก้ Prisma

เมื่อติดตั้ง Node.js/dependencies แล้ว รันจาก root โปรเจกต์ใน CMD:

```cmd
node scripts/export-schema.cjs
```

สคริปต์เรียก `prisma migrate diff --from-empty` เพื่อสร้าง DDL แล้วแปลงเป็น DBML โดยไม่เชื่อมฐานข้อมูล ตรวจว่าจำนวนตารางตรงกับ models และ Foreign Keys ทุกเส้นอ้างอิงคอลัมน์ที่มีอยู่ เขียนทับไฟล์ export ทั้งสามไฟล์ ไม่เปลี่ยน `prisma/schema.prisma`

สคริปต์จะสร้าง `schema-schemastudio.dbml` ให้อีกไฟล์ด้วย หากมีฉบับเต็มอยู่แล้วและต้องการสร้างเฉพาะ subset ใช้ `node scripts/export-schema-subset.cjs`

**สำหรับสร้างฐานข้อมูลใหม่เท่านั้น:** latest SQL ไม่มี CREATE DATABASE/USE และไม่มี seed data หากจะรันต้องเลือกฐานข้อมูล MySQL ว่างเอง ห้ามใช้แทน migration ของฐานข้อมูลเดิม รายละเอียดอัปเกรดอยู่ใน [คู่มือแชตและศูนย์ช่วยเหลือ](../docs/chat-support.md)

การตรวจ export รอบนี้ตรวจ DDL ที่ Prisma สร้าง จำนวนตาราง/คอลัมน์/Foreign Keys และเอกสาร ไม่ได้เชื่อมต่อหรือเปลี่ยนฐานข้อมูลจริง และยังไม่ได้เปิดผังใน GUI ของ Workbench หรือทดสอบ DBML ด้วย parser ภายนอก
