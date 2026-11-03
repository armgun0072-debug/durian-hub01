# คู่มือคำสั่ง Windows CMD — Durian Hub

คู่มือนี้อ้างอิง `package.json`, `docker-compose.yml`, `Dockerfile`, `docker-entrypoint.js` และสคริปต์ในโปรเจกต์ ใช้กับ **Command Prompt (cmd.exe)** เปิด Terminal ใน VS Code แล้วเลือกโปรไฟล์ Command Prompt ได้

คัดลอกเฉพาะคำสั่งในกรอบ รันทีละบรรทัด และรอให้จบก่อนขั้นถัดไป คำสั่งที่เปิดเซิร์ฟเวอร์หรือดู logs จะค้างรอจนกด `Ctrl+C`

## สารบัญ

1. [เตรียมเครื่องและเข้าโฟลเดอร์](#1-เตรียมเครื่องและเข้าโฟลเดอร์)
2. [รันด้วย Docker](#2-รันด้วย-docker)
3. [จัดการ Docker ระหว่างใช้งาน](#3-จัดการ-docker-ระหว่างใช้งาน)
4. [รันเว็บด้วย Node.js บน Windows](#4-รันเว็บด้วย-nodejs-บน-windows)
5. [Prisma และฐานข้อมูล](#5-prisma-และฐานข้อมูล)
6. [ทดสอบและตรวจ build](#6-ทดสอบและตรวจ-build)
7. [คำสั่งดูแลข้อมูล](#7-คำสั่งดูแลข้อมูล)
8. [สำรองและกู้คืน MySQL](#8-สำรองและกู้คืน-mysql)
9. [อัปเกรดระบบประวัติแชตและศูนย์ช่วยเหลือ](#9-อัปเกรดระบบประวัติแชตและศูนย์ช่วยเหลือ)
10. [แก้ปัญหาที่พบบ่อย](#10-แก้ปัญหาที่พบบ่อย)

## 1. เตรียมเครื่องและเข้าโฟลเดอร์

```cmd
cd /d C:\csc481\durian-hub01-main\durian-hub01-main
dir package.json
```

`/d` ทำให้เปลี่ยนไดรฟ์ด้วย หากย้ายโปรเจกต์ให้เปลี่ยน path ให้ตรงกับเครื่องตัวเอง และใส่เครื่องหมายคำพูดครอบ path ที่มีช่องว่าง

| วิธีรัน | สิ่งที่ต้องเตรียม |
| --- | --- |
| Docker ทั้งระบบ | Docker Desktop ที่เปิดใช้งาน Linux containers |
| Node.js บน Windows | Node.js และ npm พร้อม MySQL/Mailpit; ใช้ Docker เปิดสองบริการนี้ได้ |

Dockerfile ปัจจุบันใช้ Node 20 แต่สคริปต์ `stats:refresh` โหลด TypeScript โดยตรงและ `test:ui` ใช้ WebSocket ของ Node จึงแนะนำ **Node 22.18 ขึ้นไป** สำหรับรันชุดคำสั่งบน Windows ให้ครบทุกหมวด

ตรวจเครื่องมือที่ต้องใช้:

```cmd
docker --version
docker compose version
docker info
node --version
npm --version
```

ผู้ใช้ Docker ทั้งระบบไม่ต้องติดตั้ง Node.js ในเครื่อง หาก `docker info` ติดต่อ engine ไม่ได้ ให้เปิด Docker Desktop และรอให้พร้อม

## 2. รันด้วย Docker

### ครั้งแรกสำหรับฐานข้อมูลใหม่หรือสภาพแวดล้อมสาธิต

เปิด Docker Desktop จากนั้นรันที่ root โปรเจกต์:

```cmd
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

รอ log แจ้งว่า Next.js พร้อมแล้วกด `Ctrl+C` เพื่อออกจากการดู log ตัวเว็บยังทำงานอยู่

| บริการ | ที่อยู่ |
| --- | --- |
| เว็บ | http://localhost:3000 |
| หน้าแอดมิน | http://localhost:3000/admin |
| กล่องอีเมลทดสอบ Mailpit | http://localhost:8025 |
| MySQL จาก Windows | `localhost:3307` ฐานข้อมูล `durian_hub` |
| SMTP จาก Windows | `localhost:1025` |

```cmd
start http://localhost:3000
start http://localhost:8025
```

**พฤติกรรมจริง:** entrypoint จะรัน `prisma db push --skip-generate` → seed → `npm run dev` ทุกครั้งที่เริ่ม container เว็บ การรันด้วย Compose ชุดนี้เป็น development server แม้จะใช้ Docker และการ restart อาจเขียนข้อมูล seed ซ้ำตาม logic ใน `prisma/seed.ts`

Compose กำหนด environment ของบริการไว้ใน YAML การแก้ `.env` ของ Windows เพียงอย่างเดียวไม่ได้เปลี่ยน environment ที่กำหนดตรงไว้ใน Compose

หากมีฐานข้อมูลเดิมและกำลังอัปเกรดระบบแชต ให้ทำ [หมวด 9](#9-อัปเกรดระบบประวัติแชตและศูนย์ช่วยเหลือ) ก่อนเริ่มเว็บเวอร์ชันใหม่

## 3. จัดการ Docker ระหว่างใช้งาน

| งาน | คำสั่ง CMD | ผลที่ควรรู้ |
| --- | --- | --- |
| ดูบริการ | `docker compose ps -a` | แสดงสถานะ รวมบริการที่หยุด |
| ดู log เว็บล่าสุด | `docker compose logs --tail 100 web` | ไม่ค้างรอ |
| ติดตาม log เว็บ | `docker compose logs -f web` | กด Ctrl+C เพื่อออก |
| ดู log ฐานข้อมูล | `docker compose logs --tail 100 mysql` | ใช้ตรวจการเริ่ม MySQL |
| หยุดทุกบริการ | `docker compose stop` | คง container และข้อมูลไว้ |
| เปิด container เดิม | `docker compose start` | เว็บจะผ่าน entrypoint และ seed อีกครั้ง |
| restart เว็บ | `docker compose restart web` | ใช้ image เดิม ไม่อ่าน source ที่แก้ใหม่จากเครื่อง |
| rebuild เว็บหลังแก้โค้ด | `docker compose up -d --build web` | สร้าง image ใหม่และเริ่ม entrypoint อีกครั้ง |
| ปิดและถอด container | `docker compose down` | named volume ของ MySQL ยังอยู่ |
| เปิด shell ในเว็บ | `docker compose exec web sh` | พิมพ์ `exit` เพื่อออก |

โค้ดใน Compose ปัจจุบันไม่ได้ bind mount จาก Windows การแก้ไฟล์แล้ว refresh หรือ restart อย่างเดียวจึงอาจยังเห็นโค้ดเก่า ต้อง rebuild

### ล้างฐานข้อมูลสาธิตทั้งหมด

**ลบข้อมูล MySQL ใน volume ของ Compose นี้ถาวร** ใช้เฉพาะเมื่อยืนยันว่าจะเริ่มใหม่และมี backup ที่จำเป็นแล้ว:

```cmd
docker compose down -v
docker compose up -d --build
```

อย่าใช้คำสั่งนี้เพื่อแก้ปัญหาเว็บทั่วไป

## 4. รันเว็บด้วย Node.js บน Windows

ใช้วิธีนี้เมื่อต้องการแก้โค้ดแล้วให้ development server โหลดใหม่

### 4.1 เปิดเฉพาะ MySQL และ Mailpit

หากเว็บ Docker เดิมใช้พอร์ต 3000 อยู่ ให้หยุดก่อน แล้วเปิดบริการที่จำเป็น:

```cmd
docker compose stop web
docker compose up -d mysql mailpit
docker compose ps
```

### 4.2 ติดตั้ง dependency และตั้งค่า environment

```cmd
npm ci
if not exist .env copy .env.example .env
notepad .env
```

`npm ci` ใช้ lockfile และจัดติดตั้ง `node_modules` ใหม่ ต้องเข้าถึงแหล่งดาวน์โหลดแพ็กเกจได้ หาก lockfile ไม่ตรงกับ `package.json` ให้ตรวจความเปลี่ยนแปลงก่อน ไม่ลบ lockfile เพื่อข้ามปัญหา

ตัวอย่างค่าที่ใช้กับ MySQL/Mailpit จาก Compose เดิม:

```dotenv
DATABASE_URL="mysql://root:password@localhost:3307/durian_hub"
SMTP_HOST="localhost"
SMTP_PORT=1025
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

ส่วนนี้เป็นเนื้อหาไฟล์ `.env` **ไม่ใช่คำสั่ง CMD** ตั้ง `JWT_SECRET` ของตัวเองและอย่า commit `.env`

### 4.3 เตรียมฐานข้อมูลใหม่และเริ่มเว็บ

สำหรับฐานข้อมูลใหม่/สาธิต:

```cmd
npx prisma validate
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

`db push` เปลี่ยน schema และ seed เขียนข้อมูล หากเป็นฐานข้อมูลเดิมให้ตรวจขั้นตอนอัปเกรดก่อน ไม่รันลำดับนี้โดยไม่ตรวจสอบ

เปิด http://localhost:3000 และกด `Ctrl+C` ในหน้าต่างเซิร์ฟเวอร์เพื่อหยุด

เปลี่ยนพอร์ตเฉพาะครั้ง:

```cmd
npm run dev -- --port 3001
```

หากใช้พอร์ตใหม่ ให้ปรับ `NEXT_PUBLIC_APP_URL` ให้สอดคล้อง แล้วเปิด http://localhost:3001

## 5. Prisma และฐานข้อมูล

คำสั่งฝั่ง Windows ต้องติดตั้ง dependency และตั้ง `.env` แล้ว ส่วนคำสั่ง `docker compose exec web ...` ต้องมี container เว็บทำงานอยู่และใช้ source/schema ภายใน image นั้น

| งาน | บน Windows | ใน container เว็บ |
| --- | --- | --- |
| ตรวจรูปแบบ schema | `npx prisma validate` | `docker compose exec web npx prisma validate` |
| สร้าง Prisma Client | `npx prisma generate` | `docker compose exec web npx prisma generate` |
| sync schema ลง DB | `npx prisma db push` | `docker compose exec web npx prisma db push` |
| seed ข้อมูล | `npm run seed` | `docker compose exec web npm run seed` |

`generate` สร้าง client แต่ไม่แก้ข้อมูลในฐานข้อมูล ส่วน `db push` แก้โครงสร้างจริง ถ้าขอให้ยอมรับ data loss ให้หยุดตรวจผลกระทบก่อน

เปิด Prisma Studio จาก Windows:

```cmd
npx prisma studio
```

Studio โดยปกติเปิดที่ http://localhost:5555 และแก้ข้อมูลจริงตาม `.env` ได้ กด Ctrl+C เพื่อปิด

เข้า MySQL ผ่าน Docker โดยให้ถามรหัสผ่าน:

```cmd
docker compose exec mysql mysql -uroot -p durian_hub
```

ค่า development ใน Compose ปัจจุบันคือ `password` จากนั้นใช้ SQL เช่น `SHOW TABLES;` และ `exit` เพื่อออก

โปรเจกต์นี้ยังไม่มี Prisma migration baseline สำหรับฐานข้อมูลเดิม จึงไม่ใช้ `prisma migrate deploy` เป็นขั้นตอนติดตั้งในคู่มือนี้

## 6. ทดสอบและตรวจ build

### Unit และ regression tests

```cmd
npm test
node --test tests/chat-support.test.cjs
npx tsc --noEmit --incremental false
```

คำสั่งแรกทดสอบไฟล์ `tests/*.test.cjs` ส่วนคำสั่งที่สองทดสอบเฉพาะประวัติแชต/ศูนย์ช่วยเหลือ ชุด unit ใช้ mocks ตามขอบเขตแต่ละไฟล์ ไม่ใช่การทดสอบ MySQL จริง

### Production build และเปิดเว็บจาก build

```cmd
npm run build
npm start
```

ต้อง build ผ่านก่อน `npm start` เปิดพอร์ต 3000 และต้องมี DB/environment ที่พร้อม กด Ctrl+C เพื่อหยุด เปลี่ยนพอร์ตได้ด้วย:

```cmd
npm start -- --port 3001
```

คำสั่ง production บน Windows นี้ต่างจาก Compose ปัจจุบันที่ entrypoint เรียก `npm run dev`

### Integration test กับ MySQL

```cmd
npm run test:db
```

ต้องมี `.env` และ MySQL พร้อม บัญชีต้องมีสิทธิ์สร้าง/ลบฐานข้อมูล สคริปต์สร้างฐานข้อมูลสุ่ม `durian_hub_test_...` แล้วลบหลังทดสอบ ไม่ได้ทดสอบบนตารางของแอปโดยตรง แต่ยังใช้เซิร์ฟเวอร์ตาม `DATABASE_URL` จึงควรชี้เซิร์ฟเวอร์ทดสอบ

### Browser test อัตโนมัติ

```cmd
npm run test:ui
```

ใช้ Node 22.18+ และ Google Chrome โดยค่าเริ่มต้นอยู่ที่ `C:\Program Files\Google\Chrome\Application\chrome.exe` ต้องมี MySQL ที่อนุญาตสร้าง/ลบฐานข้อมูลและพอร์ต 3110 ว่าง สคริปต์จัดเตรียม build/เซิร์ฟเวอร์/ฐานข้อมูลทดสอบเอง เก็บผลที่ `docs\ui-preview`

หาก Chrome อยู่ที่อื่น ตั้งค่าเฉพาะหน้าต่าง CMD ปัจจุบันก่อนรัน:

```cmd
set "CHROME_PATH=C:\path\to\chrome.exe"
npm run test:ui
set "CHROME_PATH="
```

ไฟล์ `tests/account-ui.ps1` และ `tests/roles-ui.ps1` เป็นเครื่องมือ PowerShell ที่ต้องเตรียม isolated server/fixtures ตามหัวไฟล์ ไม่ใช่คำสั่ง CMD หลัก ส่วน `tests/chat-support-db.cjs` ใช้เฉพาะฐานข้อมูลชั่วคราวชื่อ `support_check` และรัน SQL อัปเกรด จึงไม่ให้รันกับฐานข้อมูลแอป

### หมายเหตุเรื่อง lint

`npm run lint` ปัจจุบันชี้ไป `next lint` ซึ่งไม่ควรถือว่าเป็น check ที่พร้อมใช้โดยไม่ตรวจเวอร์ชัน Next.js และการตั้งค่า lint ก่อน คู่มือนี้ใช้ TypeScript และ production build เป็นคำสั่งตรวจที่ผ่านการใช้กับโปรเจกต์แล้ว

## 7. คำสั่งดูแลข้อมูล

### ตรวจความถูกต้องของรีวิว โดยไม่แก้ข้อมูล

```cmd
npm run db:audit
```

ตรวจคะแนนนอกช่วง 1–5 และรีวิวตัวเอง ไม่ได้เป็นการ audit ฐานข้อมูลทุกส่วน

### เพิ่ม constraints และคำนวณยอดรีวิว/รายงานใหม่

สำรองฐานข้อมูลก่อน เพราะคำสั่งนี้เขียนข้อมูลและเพิ่ม CHECK constraints:

```cmd
npm run db:repair
```

สคริปต์สำรองเฉพาะค่า aggregate เดิมไว้ที่ `database\backups\aggregate-totals-*.json` ซึ่ง **ไม่ใช่ backup ฐานข้อมูลเต็ม** แล้วคำนวณ `report_count`, `rating_avg`, `rating_count` ใหม่

### อัปเดตสถิติราคาตลาด

```cmd
npm run stats:refresh
```

เขียนสถิติลงฐานข้อมูลตาม `.env` สคริปต์ import ไฟล์ `.ts` โดยตรงจึงใช้ Node 22.18+ สำหรับคำสั่งนี้ หากใช้ Node 20 ใน image เดิม ให้ใช้ tsx loader ที่มีในโปรเจกต์แทน:

```cmd
docker compose exec web node --import tsx scripts/refresh-market-stats.cjs
```

สคริปต์ใน container ใช้ environment ของ Compose อยู่แล้ว ไม่ต้องเพิ่ม `--env-file=.env` ถ้าไม่มีไฟล์นั้นใน image

## 8. สำรองและกู้คืน MySQL

ตัวอย่างนี้ใช้ชื่อฐานข้อมูลและรหัสผ่าน development จาก Compose ปัจจุบัน หากเปลี่ยนค่าต้องแก้คำสั่งให้ตรง รหัสผ่านใน command line อาจถูกเห็นจากประวัติคำสั่ง/รายการ process ใช้วิธีจัดการ credential ของระบบจริงเมื่อใช้งานนอกเครื่องสาธิต

### สำรองฐานข้อมูล

```cmd
if not exist database\backups mkdir database\backups
docker compose exec -T mysql mysqldump -uroot -ppassword --single-transaction --no-tablespaces --set-gtid-purged=OFF --default-character-set=utf8mb4 durian_hub > database\backups\durian_hub_before_change.sql
echo %ERRORLEVEL%
dir database\backups\durian_hub_before_change.sql
```

ค่า exit code ควรเป็น `0` ตรวจไฟล์ว่ามี SQL จริงก่อนนำไปใช้ ชื่อไฟล์ตัวอย่างถูกเขียนทับเมื่อรันซ้ำ ให้เปลี่ยนชื่อแต่ละครั้ง อย่าแก้ schema ระหว่าง dump

การสำรองนี้ไม่รวมไฟล์ upload, source code, `.env` หรือ configuration ต้องสำรองส่วนเหล่านั้นแยกหากต้องการกู้ระบบทั้งหมด

### กู้คืน

**การนำเข้า SQL อาจแทนที่ตารางและข้อมูลปัจจุบัน** ตรวจไฟล์และฐานข้อมูลปลายทางให้ถูกต้อง สำรองของเดิม และหยุดเว็บก่อน:

```cmd
docker compose stop web
docker compose exec -T mysql mysql -uroot -ppassword --default-character-set=utf8mb4 durian_hub < database\backups\durian_hub_before_change.sql
echo %ERRORLEVEL%
```

เครื่องหมาย `<` และ `>` ในตัวอย่างนี้เป็น syntax ของ CMD การกู้ฐานข้อมูลที่มี support tickets อยู่แล้วอาจติด foreign key หาก dump/ปลายทางไม่ตรงกัน จึงควรซ้อม restore ลงฐานข้อมูลทดสอบก่อน อย่าเปิดเว็บจน schema ตรงกับ source ที่จะใช้งาน

## 9. อัปเกรดระบบประวัติแชตและศูนย์ช่วยเหลือ

ระบบคิวเพิ่มไฟล์ `database\support-queue.sql` อีกหนึ่งขั้น **หลัง** schema ระบบช่วยเหลือพร้อมแล้ว และ **ก่อน** เปิดเว็บเวอร์ชันคิว หากตรวจแล้วว่ายังไม่มี `queued_at` ใช้:

```cmd
docker compose exec -T mysql mysql -uroot -ppassword --default-character-set=utf8mb4 durian_hub < database\support-queue.sql
echo %ERRORLEVEL%
```

สำรอง/หยุดเว็บก่อนตามขั้นตอนด้านล่าง หากคอลัมน์ถูกเพิ่มจาก `db push` แล้วให้ทำเฉพาะ backfill ตาม [คู่มือระบบช่วยเหลือ](chat-support.md) ห้ามรัน ALTER ซ้ำ

อ่านรายละเอียดเพิ่มเติมที่ [chat-support.md](chat-support.md) ขั้นตอนต่อไปนี้สำหรับ **ฐานข้อมูลเดิมที่ยังไม่มี `closed_at` และตาราง support** เท่านั้น

1. สำรองฐานข้อมูลตามหมวด 8
2. หยุดเว็บ แต่ให้ MySQL ทำงานอยู่
3. ตรวจโครงสร้างก่อนนำเข้า SQL

```cmd
docker compose stop web
docker compose up -d mysql
docker compose exec -T mysql mysql -uroot -ppassword durian_hub -e "SHOW COLUMNS FROM chat_rooms LIKE 'closed_at'; SHOW TABLES LIKE 'support_tickets'; SHOW TABLES LIKE 'support_messages';"
```

หากทั้งคอลัมน์และตารางยังไม่มี ให้นำเข้าไฟล์ครั้งเดียว:

```cmd
docker compose exec -T mysql mysql -uroot -ppassword --default-character-set=utf8mb4 durian_hub < database\chat-support.sql
echo %ERRORLEVEL%
```

ไฟล์นี้เพิ่ม schema และเติมเวลาปิดดีลจากหลักฐานดีลเดิม ท้ายไฟล์แสดงห้องที่ยังไม่มีเวลาอ้างอิง ต้องตรวจห้องเหล่านั้นเองโดยไม่เดาเวลา

**ถ้ามีคอลัมน์/ตารางแล้วบางส่วนหรือครบแล้ว อย่านำเข้าทั้งไฟล์ซ้ำ** โดยเฉพาะกรณีที่ `db push` ทำงานไปแล้ว ให้ตรวจ schema และใช้เฉพาะ UPDATE backfill/SELECT ตามคู่มือระบบแชต การรัน SQL ล้มเหลวอาจมีบาง DDL สำเร็จแล้ว เพราะ MySQL ไม่ rollback ทั้งไฟล์

หลังตรวจว่าอัปเกรดสำเร็จแล้ว จึง rebuild และเปิดเว็บ:

```cmd
docker compose up -d --build web
docker compose logs -f web
```

ขั้นตอนนี้ยังเรียก seed ตาม entrypoint เดิม ใช้กับสภาพแวดล้อมพัฒนาที่เข้าใจผลของ seed แล้ว สำหรับข้อมูลใช้งานจริงต้องจัดขั้นตอนเริ่มบริการที่เหมาะสมก่อน

## 10. แก้ปัญหาที่พบบ่อย

| อาการ | วิธีตรวจและแก้ |
| --- | --- |
| `docker` ไม่พบ | ติดตั้ง Docker Desktop แล้วเปิด CMD ใหม่ |
| ติดต่อ Docker engine ไม่ได้ | เปิด Docker Desktop รอ engine พร้อม แล้วลอง `docker info` |
| `node` หรือ `npm` ไม่พบ | ติดตั้ง Node.js และเปิด CMD ใหม่ ตรวจด้วย `where node` / `where npm` |
| PowerShell ปิดการรัน `npm.ps1` | เปลี่ยน terminal เป็น CMD ตามคู่มือนี้ หรือใช้ `npm.cmd` ใน PowerShell |
| เว็บยังเป็นโค้ดเก่า | ใช้ `docker compose up -d --build web` เพราะ Compose ไม่มี source bind mount |
| Prisma ต่อ MySQL ไม่ได้ | เช็ก `docker compose ps`, logs และ URL: Windows ใช้ `localhost:3307`; container ใช้ `mysql:3306` |
| ขาดคอลัมน์หรือตาราง support | ตรวจหมวด 9 อย่า generate client อย่างเดียว เพราะไม่ได้เปลี่ยน DB |
| ไฟล์ Prisma ถูกล็อกบน Windows | หยุด dev server/Studio ที่ใช้ client ก่อน แล้วลอง generate ใหม่ |
| ไม่เห็นอีเมล OTP | เปิด Mailpit ที่พอร์ต 8025; SMTP จาก Windows ใช้ localhost:1025 ส่วน container ใช้ mailpit:1025 |
| build ผ่านแต่ start ไม่ได้ | ตรวจ environment, DB, พอร์ต และว่า build อยู่ใน working directory เดียวกัน |
| คำสั่งแก้ DB พบ validation error | ตรวจ schema/source ให้ตรงกับฐานข้อมูลก่อน อย่าใช้การล้าง volume เป็นทางแก้แรก |

ตรวจคนใช้พอร์ต 3000 หรือ 3307:

```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :3307
```

ดู PID จากผลลัพธ์แล้วตรวจโปรแกรม เช่น PID 1234:

```cmd
tasklist /FI "PID eq 1234"
```

หยุดโปรแกรมจากหน้าต่างที่เปิดมัน หรือเลือกพอร์ตใหม่ หลีกเลี่ยงการปิด process ที่ยังไม่ทราบว่าเป็นบริการอะไร

### ชุดคำสั่งใช้บ่อย

Docker ที่ติดตั้งพร้อมแล้ว:

```cmd
cd /d C:\csc481\durian-hub01-main\durian-hub01-main
docker compose up -d
docker compose logs --tail 50 web
start http://localhost:3000
```

แก้โค้ดบน Windows หลังติดตั้ง dependency และเตรียม DB แล้ว:

```cmd
cd /d C:\csc481\durian-hub01-main\durian-hub01-main
docker compose stop web
docker compose up -d mysql mailpit
npm run dev
```
