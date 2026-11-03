param([string]$OutputDirectory = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

# Editable diagram source: ID | column (0..2) | row | shape | text lines separated by ~.
# Edges: source > target | label. Coordinates are shared by SVG and PNG.
$diagrams = @(
@{ File='01-overview'; Title='ภาพรวมการทำงานของ Durian Hub'; Sub='เส้นทางผู้ใช้ตั้งแต่ค้นหาคู่ค้า จนถึงบันทึกข้อตกลงและรีวิว'; Sources='src/app/page.tsx; src/app/api/deals/route.ts; src/app/api/reviews/route.ts'; Note='การปิดดีลคือบันทึกข้อตกลง ระบบยังไม่มีขั้นตอนรับชำระเงินหรือจัดส่ง'; Nodes=@'
A|1|0|start|เริ่มใช้งาน Durian Hub
B|1|1|process|ดูตลาดกลาง / แดชบอร์ดราคา~ค้นหาตามประเภทและพื้นที่
C|1|2|decision|ต้องการทำรายการ?
D|0|3|process|ดูข้อมูลต่อได้~โดยยังไม่เข้าสู่ระบบ
E|1|3|process|สมัคร / ยืนยันอีเมล OTP~หรือเข้าสู่ระบบ
F|1|4|decision|เลือกการใช้งาน
G|0|5|process|ลงประกาศตามสิทธิ์~SELL / BUY / CUT_SERVICE
H|1|5|process|เลือกประกาศของคู่ค้า~ตรวจว่าไม่ใช่ประกาศตนเอง
I|2|5|process|ขอเพิ่มบทบาท~ส่งคำขอให้ผู้ดูแลตรวจ
J|1|6|process|เปิดห้องแชท~เจรจาราคา / ปริมาณ / วันตัด
K|1|7|decision|ตกลงกันได้?
L|0|8|process|เจรจาต่อ~หรือเลือกคู่ค้ารายอื่น
M|1|8|process|ตรวจสมาชิกห้องและประกาศ~บันทึกดีล ACCEPTED
N|1|9|process|ประกาศ CLOSED~ห้องคู่ค้า DEAL_CLOSED
O|2|9|process|แจ้งห้องอื่นของประกาศ~เปลี่ยนห้อง ACTIVE เป็น ARCHIVED
P|1|10|process|คู่ค้ารีวิวกัน 1–5 ดาว~คนละหนึ่งครั้งต่อดีล
Q|1|11|end|อัปเดตคะแนนเฉลี่ย / จำนวนรีวิว
R|2|6|process|พบปัญหา: รายงานประกาศ~ผู้ดูแลตรวจและพิจารณาลงโทษ
'@; Edges=@'
A>B
B>C
C>D|ยังไม่ทำ
C>E|ทำรายการ
E>F
F>G|ลงประกาศ
F>H|ค้นหาคู่ค้า
F>I|เพิ่มบทบาท
H>J
H>R|รายงาน
J>K
K>L|ยังไม่ได้
K>M|ตกลงได้
M>N
N>O|แจ้งรายอื่น
N>P
P>Q
'@ },
@{ File='02-authentication'; Title='สมัครสมาชิก · OTP · เข้าสู่ระบบ'; Sub='รวมการตรวจบัญชี การยืนยันอีเมล และการตั้งรหัสผ่านใหม่'; Sources='src/app/api/auth/{register,login,verify-email,forgot-password,reset-password}/route.ts; src/lib/otp.ts'; Note='OTP 6 หลัก อายุ 10 นาที • ลองได้สูงสุด 5 ครั้ง • ขอรหัสใหม่เว้นอย่างน้อย 60 วินาที'; Nodes=@'
A|1|0|start|เริ่มใช้งานบัญชี
B|1|1|decision|มีบัญชีแล้ว?
C|0|2|process|สมัคร: ข้อมูลส่วนตัว / อีเมล~รหัสผ่าน / บทบาทหลัก
D|0|3|decision|ข้อมูลถูกต้องและไม่ซ้ำ?
E|0|4|process|แฮชรหัสผ่าน / สร้างบัญชี~สร้างบทบาทหลัก ACTIVE
F|0|5|process|ส่ง OTP ยืนยันอีเมล~ผ่าน SMTP / Mailpit
G|0|6|decision|OTP ถูกต้องและยังใช้ได้?
H|0|7|process|บันทึก emailVerifiedAt~สร้าง Session และ Cookie
I|1|2|process|กรอกอีเมลหรือเบอร์โทร~พร้อมรหัสผ่าน
J|1|3|decision|บัญชีและรหัสผ่านผ่าน?
K|1|4|decision|ยืนยันอีเมลแล้ว?
L|1|5|process|เลือกบทบาทที่เปิดใช้งาน~ADMIN ใช้ช่องทาง /admin
M|1|7|process|ตั้ง Session / Cookie~แยกผู้ใช้กับผู้ดูแล
N|1|8|end|เข้าสู่ระบบสำเร็จ
O|2|2|process|ลืมรหัสผ่าน: ระบุอีเมล
P|2|3|process|ถ้าบัญชี ACTIVE: ส่ง OTP~purpose RESET_PASSWORD
Q|2|4|process|กรอก OTP และรหัสผ่านใหม่~อย่างน้อย 6 ตัวอักษร
R|2|5|decision|ตรวจข้อมูลและ OTP ผ่าน?
S|2|6|end|ตั้งรหัสผ่านใหม่สำเร็จ~ยืนยันอีเมล แล้วกลับไปล็อกอิน
X|2|8|error|ไม่ผ่าน: แจ้งข้อผิดพลาด~แก้ข้อมูล / ขอ OTP / ลองใหม่
'@; Edges=@'
A>B
B>C|ไม่มี
B>I|มีแล้ว
C>D
D>E|ผ่าน
E>F
F>G
G>H|ผ่าน
H>N
I>J
J>K|ผ่าน
K>L|ยืนยันแล้ว
K>F|ยังไม่ยืนยัน
L>M
M>N
I>O|ลืมรหัสผ่าน
O>P
P>Q
Q>R
R>S|ผ่าน
D>X|ไม่ผ่าน
G>X|ไม่ผ่าน
J>X|ไม่ผ่าน / ระงับ
R>X|ไม่ผ่าน
'@ },
@{ File='03-marketplace'; Title='ลงประกาศและค้นหาคู่ค้า'; Sub='สิทธิ์ตามบทบาท ประเภทประกาศ ตัวกรองตลาดกลาง และการป้องกันแชทตัวเอง'; Sources='src/app/api/posts/route.ts; src/app/api/posts/[id]/route.ts; src/app/page.tsx'; Note='ตลาดกลางเริ่มต้นแสดง OPEN อายุไม่เกิน 7 วัน • พ้นช่วงเป็นการกรอง ไม่ใช่ลบประกาศ'; Nodes=@'
A|0|0|start|ผู้ลงประกาศเข้าสู่ระบบ
B|0|1|process|เลือกประเภทตามบทบาท~SELLER → SELL / BUYER → BUY~CUTTER → CUT_SERVICE
C|0|2|process|กรอกหัวข้อ ราคา หน่วย ปริมาณ~สายพันธุ์ เกรด พื้นที่ และรายละเอียด
D|0|3|decision|ข้อมูลและสิทธิ์ผ่าน?
E|0|4|data|บันทึก MarketplacePost~สถานะ OPEN / ผูกเจ้าของ
F|1|5|process|ตลาดกลางแสดงประกาศ~ตามสถานะ อายุ และตัวกรอง
G|2|0|start|ผู้สนใจเปิดตลาดกลาง
H|2|1|process|เลือกประเภท / ภูมิภาค / จังหวัด~สายพันธุ์ และคำค้นหา
I|2|6|process|เปิดรายละเอียดประกาศ~ดูราคา ข้อมูลเจ้าของ และรีวิว
J|2|7|decision|เป็นประกาศของตนเอง?
K|1|8|process|แสดงป้ายประกาศของคุณ~ไปประวัติการโพสต์เพื่อจัดการ
L|2|8|process|เข้าสู่ระบบแล้วกดทักแชท~หรือรายงานประกาศเมื่อพบปัญหา
X|1|3|error|แจ้งข้อผิดพลาด~กลับไปแก้ข้อมูลหรือเลือกบทบาท
'@; Edges=@'
A>B
B>C
C>D
D>E|ผ่าน
D>X|ไม่ผ่าน
E>F
G>H
H>F|ค้นหา
F>I
I>J
J>K|ใช่
J>L|ไม่ใช่
'@ },
@{ File='04-chat'; Title='แชทเจรจาและสถานะอ่านข้อความ'; Sub='สร้างหรือใช้ห้องเดิม ดึงข้อความทุก 2 วินาที และตรวจสมาชิกห้อง'; Sources='src/app/api/chat/rooms/route.ts; src/app/api/chat/rooms/[id]/messages/route.ts; src/app/page.tsx:932'; Note='ใช้ HTTP polling ทุก 2 วินาที • ARCHIVED เป็นการจัดหมวดห้อง ไม่ได้ห้ามส่งข้อความใน API โดยอัตโนมัติ'; Nodes=@'
A|1|0|start|กดทักแชทจากประกาศ
B|1|1|decision|ล็อกอิน / พบประกาศ~และไม่ใช่เจ้าของเอง?
C|1|2|decision|มีห้องเดิมของผู้เริ่มแชท~กับประกาศนี้แล้ว?
D|0|3|process|สร้าง ChatRoom ACTIVE~พร้อมข้อความ PRODUCT_CARD
E|1|4|process|เปิดห้องสนทนา~ดึงห้องและข้อความทุก 2 วินาที
F|1|5|decision|กำลังเปิดห้องนี้?
G|0|6|process|markRead=true~ทำเครื่องหมายข้อความคู่ค้าว่าอ่านแล้ว
H|2|6|process|คงสถานะยังไม่อ่าน~แสดงจำนวนข้อความค้าง
I|1|7|process|แสดงข้อความ / สถานะอ่าน~ผู้ใช้พิมพ์ข้อความ
J|1|8|decision|เป็นสมาชิกห้อง~และข้อความไม่ว่าง?
K|1|9|data|Transaction: บันทึกข้อความ~อัปเดต lastMessageAt
L|1|10|end|รอบ polling ถัดไป~แสดงข้อความล่าสุดให้คู่ค้า
X|2|2|error|ปฏิเสธคำขอ~แจ้งเหตุผลแก่ผู้ใช้
Y|2|9|error|ไม่บันทึกข้อความ~ให้ตรวจสิทธิ์หรือแก้ข้อความ
'@; Edges=@'
A>B
B>C|ผ่าน
B>X|ไม่ผ่าน
C>D|ไม่มี
C>E|มีแล้ว
D>E
E>F
F>G|ใช่
F>H|ไม่ใช่
G>I
H>I
I>J
J>K|ผ่าน
J>Y|ไม่ผ่าน
K>L
'@ },
@{ File='05-close-deal'; Title='ปิดดีลและแจ้งคู่ค้ารายอื่น'; Sub='ตรวจสิทธิ์และป้องกันปิดดีลซ้ำภายใน Serializable Transaction'; Sources='src/app/api/deals/route.ts:19–80'; Note='ACCEPTED ยืนยันข้อตกลงเท่านั้น • Transaction ล้มเหลวจะ rollback • P2034 ลองรวมสูงสุด 3 ครั้ง'; Nodes=@'
A|1|0|start|คู่ค้าเจรจาตกลงกัน
B|1|1|process|ส่ง roomId / postId / receiverId~ราคา ปริมาณ วันตัด และหมายเหตุ
C|1|2|decision|ล็อกอินและข้อมูลถูกต้อง?
D|1|3|process|เริ่ม Serializable Transaction
E|1|4|decision|สมาชิก / คู่ค้า / เจ้าของตรง?~ห้อง ACTIVE และประกาศตรง?
F|1|5|decision|เปลี่ยนประกาศ OPEN → CLOSED~ได้หนึ่งรายการ?
G|1|6|data|สร้าง Deal สถานะ ACCEPTED~บันทึกราคาและรายละเอียดข้อตกลง
H|1|7|process|ส่งข้อความสรุปในห้อง~เปลี่ยนห้องเป็น DEAL_CLOSED
I|1|8|process|ค้นหาห้อง ACTIVE อื่น~ในประกาศเดียวกัน
J|1|9|process|ส่งข้อความแจ้งปิดกับรายอื่น~เปลี่ยนห้องเหล่านั้นเป็น ARCHIVED
K|1|10|end|Commit / ตอบสำเร็จ~ผู้ใช้ไปรีวิวคู่ค้าได้
X|2|3|error|ตอบข้อผิดพลาด~ไม่เริ่มบันทึกดีล
Y|2|6|error|Rollback ทั้ง Transaction~ปฏิเสธสิทธิ์ / ดีลซ้ำ / บันทึกล้มเหลว
Z|0|6|process|กรณีชนกัน P2034~ลอง Transaction ใหม่~ครบ 3 ครั้งแล้วยังชน: ตอบ 409
'@; Edges=@'
A>B
B>C
C>D|ผ่าน
C>X|ไม่ผ่าน
D>E
E>F|ผ่าน
E>Y|ไม่ผ่าน
F>G|ได้ 1 รายการ
F>Y|ไม่ได้
G>H
H>I
I>J
J>K
D>Z|serialization conflict
'@ },
@{ File='06-reviews'; Title='รีวิวคู่ค้าหลังปิดดีล'; Sub='ตรวจดีลจริง จำกัดหนึ่งรีวิวต่อคนต่อดีล และคำนวณค่าเฉลี่ยใหม่'; Sources='src/app/api/reviews/route.ts; prisma/schema.prisma: UserReview'; Note='คะแนนรีวิว ratingAvg แยกจากคะแนนความประพฤติ trustScore • ไม่มีการสร้างดีลย้อนหลังให้ห้องเก่า'; Nodes=@'
A|1|0|start|ผู้ใช้ส่งรีวิวคู่ค้า
B|1|1|process|roomId / postId / revieweeId~คะแนนเต็ม 1–5 / ความเห็น ≤ 5,000 ตัว
C|1|2|decision|ล็อกอิน / ข้อมูลถูกต้อง~และไม่รีวิวตัวเอง?
D|1|3|process|เริ่ม Serializable Transaction
E|1|4|decision|เป็นสมาชิก / คู่ค้าตรง~ประกาศตรง / ห้อง DEAL_CLOSED?
F|1|5|decision|มี Deal ACCEPTED~ของคู่ค้าคู่นี้ในประกาศ?
G|1|6|decision|เคยรีวิวดีลนี้แล้ว?
H|1|7|data|บันทึก UserReview~unique: dealId + reviewerId
I|1|8|process|รวมรีวิวของผู้รับทั้งหมด~คำนวณ ratingAvg / ratingCount
J|1|9|process|ส่งข้อความรีวิวในห้อง~อัปเดต lastMessageAt
K|1|10|end|Commit / แสดงคะแนนใหม่
X|2|4|error|ปฏิเสธคำขอ / Rollback~ไม่บันทึกข้อมูลบางส่วน
Y|2|7|error|ตอบ 409: รีวิวซ้ำ~หนึ่งคนรีวิวได้ครั้งเดียวต่อดีล
Z|0|8|process|P2034: ลองรวมสูงสุด 3 ครั้ง~หากยังชน ตอบ 409
'@; Edges=@'
A>B
B>C
C>D|ผ่าน
C>X|ไม่ผ่าน
D>E
E>F|ผ่าน
E>X|ไม่ผ่าน
F>G|มี
F>X|ไม่มี
G>H|ยังไม่เคย
G>Y|เคย
H>I
I>J
J>K
D>Z|serialization conflict
'@ },
@{ File='07-role-requests'; Title='บทบาทผู้ใช้และคำขอเพิ่มบทบาท'; Sub='ผู้ใช้หนึ่งคนมีหลายบทบาทได้ โดยผู้ดูแลตรวจคำขอพร้อมเอกสาร'; Sources='src/app/api/user/role-requests/route.ts; src/app/api/admin/role-requests/[id]/route.ts'; Note='บทบาทหลักตอนสมัครเป็น ACTIVE และ isVerified=false • การขอเพิ่มบทบาทเป็นคนละขั้นตอนกับสมัครบัญชี'; Nodes=@'
A|1|0|start|ผู้ใช้เข้าสู่ระบบ
B|1|1|process|เลือกขอเพิ่มบทบาท~SELLER / BUYER / CUTTER
C|1|2|process|กรอกข้อมูลกิจการและแนบเอกสาร~ตามบทบาทที่ต้องการ
D|1|3|decision|ข้อมูล / ไฟล์ผ่าน?~ไม่มีบทบาท ACTIVE หรือคำขอซ้ำ?
E|1|4|data|สร้างคำขอสถานะ PENDING
F|1|5|process|ผู้ดูแลเข้าสู่ระบบ /admin~เปิดคำขอและตรวจหลักฐาน
G|1|6|decision|อนุมัติคำขอ?
H|0|7|process|คำขอ APPROVED~เพิ่มหรืออัปเดตบทบาท ACTIVE~isVerified=true
I|2|7|process|คำขอ REJECTED~บันทึกหมายเหตุจากผู้ดูแล
J|0|8|end|ผู้ใช้เลือกบทบาทใหม่~ใช้งานตามสิทธิ์ของบทบาทนั้น
K|2|8|end|ผู้ใช้ดูผลพิจารณา~และปรับข้อมูลตามหมายเหตุ
X|2|4|error|ปฏิเสธคำขอที่ไม่ถูกต้อง~แจ้งข้อมูลหรือเอกสารให้แก้ไข
'@; Edges=@'
A>B
B>C
C>D
D>E|ผ่าน
D>X|ไม่ผ่าน
E>F
F>G
G>H|อนุมัติ
G>I|ปฏิเสธ
H>J
I>K
'@ },
@{ File='08-moderation'; Title='รายงานปัญหาและคะแนนความประพฤติ'; Sub='ผู้ดูแลตรวจรายงาน ซ่อนประกาศ และประเมินบทลงโทษจากคะแนนคงเหลือ'; Sources='src/app/api/posts/[id]/report/route.ts; src/app/api/admin/reports/[id]/route.ts; src/lib/trust.ts; src/lib/auth.ts'; Note='เมื่อพ้นระยะระงับ การตรวจบัญชีคืน ACTIVE ได้ แต่ไม่รีเซ็ตคะแนนกลับ 100 อัตโนมัติ'; Nodes=@'
A|1|0|start|ผู้ใช้พบปัญหาในประกาศ
B|1|1|process|ส่งรายงานพร้อมเหตุผล~API ตรวจสิทธิ์และข้อมูล
C|1|2|data|บันทึกรายงาน PENDING~อัปเดตตัวนับรายงานใน Transaction
D|1|3|process|ผู้ดูแลเข้าสู่ระบบ /admin~ตรวจรายละเอียดและหลักฐาน
E|1|4|decision|อนุมัติรายงาน?
F|0|5|end|รายงาน REJECTED~จบการพิจารณา
G|1|5|process|รายงาน APPROVED~ประกาศ HIDDEN_BY_ADMIN
H|1|6|process|หักคะแนนเจ้าของประกาศ~จำกัดคะแนนคงเหลือในช่วง 0–100
I|1|7|decision|คะแนนคงเหลือเท่าไร?
J|0|8|process|90–100: ACTIVE ปกติ~80–89: ACTIVE ตักเตือน
K|1|8|process|60–79: SUSPENDED 3 วัน~40–59: SUSPENDED 7 วัน
L|2|8|process|1–39: SUSPENDED 30 วัน~0: BANNED ถาวร
M|1|9|data|บันทึก status / suspendedUntil~suspensionReason / trustScore
N|1|10|decision|ตรวจบัญชี: พ้นกำหนด~ระงับชั่วคราวแล้ว?
O|0|11|end|คืนสถานะ ACTIVE~คงคะแนนเดิม
P|2|11|end|ยังระงับหรือ BANNED~ปฏิเสธการเข้าสู่ระบบตามสถานะ
'@; Edges=@'
A>B
B>C
C>D
D>E
E>F|ปฏิเสธ
E>G|อนุมัติ
G>H
H>I
I>J|80–100
I>K|40–79
I>L|0–39
J>M
K>M
L>M
M>N|เมื่อถูกระงับ
N>O|ครบกำหนด
N>P|ยังไม่ครบ / ถาวร
'@ },
@{ File='09-market-dashboard'; Title='แดชบอร์ดราคาและสถิติรายวัน'; Sub='แยกเส้นทางแสดงราคาบนหน้าเว็บ ออกจากงานบันทึก snapshot สถิติ'; Sources='src/app/page.tsx; src/lib/market-stats.ts; scripts/refresh-market-stats.cjs'; Note='ราคาประกาศและค่าประมาณไม่ใช่ราคาชำระจริง • ยังไม่มี OS schedule อัตโนมัติสำหรับ snapshot'; Nodes=@'
A|0|0|start|ผู้ใช้เปิดแดชบอร์ด
B|0|1|process|โหลดประกาศจาก posts API~เลือกภูมิภาค / สายพันธุ์ / เกรด
C|0|2|decision|มีราคาประกาศที่ตรง~สำหรับการคำนวณ?
D|0|3|process|คำนวณราคาเฉลี่ย~จากประกาศที่โหลดมา
E|1|3|process|ไม่มีข้อมูล: ใช้ค่าตั้งต้น~ราคาแยกเกรดอาจใช้ค่าประมาณ
F|0|4|end|แสดง KPI / ตาราง / กราฟ~ราคาขาย / รับซื้อ / ค่าตัด
G|2|0|start|ผู้ดูแลรัน npm run stats:refresh
H|2|1|process|อ่านประกาศ OPEN ใน 7 วัน~isPriceOutlier=false
I|2|2|process|แปลงราคาต่อกิโลกรัม~คัดหน่วยหรือราคาที่ใช้ไม่ได้ออก
J|2|4|process|จัดกลุ่มสายพันธุ์ + เกรด + พื้นที่~แยกราคาซื้อ / ขาย / ค่าตัด
K|2|5|process|หาค่าเฉลี่ย ต่ำสุด สูงสุด~ปริมาณรวม และจำนวนตัวอย่าง
L|2|6|data|Upsert DailyMarketStat ของวัน~ตามวันที่ Asia/Bangkok
M|2|7|end|บันทึก snapshot เสร็จ~คงราคาอ้างอิงทางการเดิม
N|0|6|process|หน้าแดชบอร์ดปัจจุบัน~ยังอ่านประกาศจาก posts API~ไม่ได้อ่าน snapshot นี้โดยตรง
'@; Edges=@'
A>B
B>C
C>D|มี
C>E|ไม่มี
D>F
E>F
G>H
H>I
I>J
J>K
K>L
L>M
F>N|แหล่งข้อมูลปัจจุบัน
'@ },
@{ File='10-system-architecture'; Title='โครงสร้างระบบและเส้นทางข้อมูล'; Sub='Next.js / React → API Routes → Prisma / MySQL พร้อมบริการอีเมลทดสอบ'; Sources='docker-compose.yml; prisma/schema.prisma; src/lib/{auth,prisma,mail,otp}.ts'; Note='Docker: web :3000 • MySQL host :3307 → container :3306 • Mailpit SMTP :1025 / Web UI :8025'; Nodes=@'
A|1|0|start|ผู้ใช้ / ผู้ดูแลผ่าน Browser
B|1|1|process|Next.js + React~ตลาดกลาง / แชท / โปรไฟล์ / admin
C|1|2|process|HTTP Request / JSON Response~แชท polling ทุก 2 วินาที
D|1|3|process|Next.js API Routes~auth / posts / chat / deals / reviews
E|1|4|decision|Session และสิทธิ์ผ่าน~ข้อมูลและเงื่อนไขถูกต้อง?
F|1|5|process|บริการข้อมูล / Prisma~Transaction ในงานที่กำหนด
G|1|6|data|MySQL 8~บัญชี / บทบาท / ประกาศ / ห้องแชท~ข้อความ / ดีล / รีวิว / รายงาน / สถิติ
H|2|5|error|ตอบข้อผิดพลาด HTTP~หน้าเว็บแสดงเหตุผล
I|0|4|process|บริการ OTP~สร้างรหัส / แฮช / ตรวจอายุ
J|0|5|process|Nodemailer → SMTP~mailpit:1025 ใน Docker
K|0|6|data|Mailpit เก็บอีเมลทดสอบ~Browser เปิด localhost:8025
L|2|7|process|งาน stats:refresh~สร้าง snapshot ราคา~ผ่านบริการข้อมูลไป MySQL
M|1|8|end|API ตอบ JSON~หน้าเว็บแสดงผลให้ผู้ใช้
'@; Edges=@'
A>B
B>C
C>D
D>E
E>F|ผ่าน
E>H|ไม่ผ่าน
D>I|ขอ / ตรวจ OTP
I>J|ส่งอีเมล
J>K
F>G
G>M|ผลลัพธ์ผ่าน API
L>G|บันทึกสถิติ
H>M
'@ }
)

function Escape-Xml([string]$s) { [System.Security.SecurityElement]::Escape($s) }
$fontFamily = 'Tahoma'
$font = New-Object System.Drawing.Font($fontFamily, 16)
$decisionFont = New-Object System.Drawing.Font($fontFamily, 14)
$smallFont = New-Object System.Drawing.Font($fontFamily, 12)
$titleFont = New-Object System.Drawing.Font($fontFamily, 27, ([System.Drawing.FontStyle]::Bold))
$subFont = New-Object System.Drawing.Font($fontFamily, 15)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$report = @()
foreach ($d in $diagrams) {
    $nodes = @{}; $ordered = @(); $edges = @()
    foreach ($line in ($d.Nodes.Trim() -split '\r?\n')) {
        $p = $line -split '\|',5
        $n = @{ Id=$p[0]; X=(50 + 450 * [int]$p[1]); Y=(190 + 216 * [int]$p[2]); Shape=$p[3]; Lines=($p[4] -split '~') }
        $nodes[$p[0]]=$n; $ordered += $n
    }
    foreach ($line in ($d.Edges.Trim() -split '\r?\n')) {
        $p=$line -split '\|',2; $ids=$p[0] -split '>'
        if (!$nodes.ContainsKey($ids[0]) -or !$nodes.ContainsKey($ids[1])) { throw "Invalid edge $line" }
        $edges += @{ From=$ids[0]; To=$ids[1]; Label=$(if($p.Count -gt 1){$p[1]}else{''}) }
    }
    $width=1400; $height=([int](($ordered | ForEach-Object { $_.Y } | Measure-Object -Maximum).Maximum) + 320)
    $bitmap=New-Object System.Drawing.Bitmap($width,$height)
    $g=[System.Drawing.Graphics]::FromImage($bitmap)
    $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear([System.Drawing.Color]::FromArgb(247,250,249))
    $svg=New-Object System.Text.StringBuilder
    [void]$svg.AppendLine("<svg xmlns=`"http://www.w3.org/2000/svg`" width=`"$width`" height=`"$height`" viewBox=`"0 0 $width $height`" role=`"img`" aria-labelledby=`"title desc`"><title id=`"title`">$(Escape-Xml $d.Title)</title><desc id=`"desc`">$(Escape-Xml $d.Sub)</desc><defs><marker id=`"arrow`" markerWidth=`"10`" markerHeight=`"10`" refX=`"8`" refY=`"4`" orient=`"auto`" markerUnits=`"userSpaceOnUse`"><path d=`"M0 0 L8 4 L0 8 Z`" fill=`"#536b63`"/></marker></defs><rect width=`"100%`" height=`"100%`" fill=`"#f7faf9`"/><g font-family=`"Tahoma, Leelawadee UI, sans-serif`">")
    function Draw-Text([string]$text,[single]$x,[single]$y,[single]$w,[single]$h,$f,[int]$size,[string]$color) {
        $brush=New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
        $g.DrawString($text,$f,$brush,(New-Object System.Drawing.RectangleF($x,$y,$w,$h)),$format)
        $brush.Dispose()
        [void]$svg.AppendLine("<text x=`"$($x+$w/2)`" y=`"$($y+$h/2)`" text-anchor=`"middle`" dominant-baseline=`"central`" font-size=`"$size`" fill=`"$color`">$(Escape-Xml $text)</text>")
    }
    Draw-Text 'DURIAN HUB  /  SYSTEM FLOWCHART' 35 15 1330 30 $smallFont 16 '#527267'
    Draw-Text $d.Title 35 48 1330 55 $titleFont 36 '#164735'
    Draw-Text $d.Sub 35 110 1330 35 $subFont 20 '#526960'
    $pen=New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#536b63'),2)
    $arrowCap=New-Object System.Drawing.Drawing2D.AdjustableArrowCap(4,6)
    $pen.CustomEndCap=$arrowCap
    $edgeLabels=@()
    foreach ($e in $edges) {
        $a=$nodes[$e.From];$b=$nodes[$e.To]
        $ax=$a.X+200;$ay=$a.Y+160;$bx=$b.X+200;$by=$b.Y
        if ($b.Y -lt $a.Y -and $a.X -ne $b.X) {
            $dir=[Math]::Sign($a.X-$b.X);$gutter=$b.X+200+225*$dir;$by=$b.Y+80;$bx=$b.X+200+200*$dir;$mid=$ay+28
            $points=@([System.Drawing.PointF]::new($ax,$ay),[System.Drawing.PointF]::new($ax,$mid),[System.Drawing.PointF]::new($gutter,$mid),[System.Drawing.PointF]::new($gutter,$by),[System.Drawing.PointF]::new($bx,$by))
        } elseif ($a.X -eq $b.X) {
            $points=@([System.Drawing.PointF]::new($ax,$ay),[System.Drawing.PointF]::new($bx,$by))
        } elseif ($a.Y -eq $b.Y) {
            $by=$b.Y+160;$mid=$ay+28
            $points=@([System.Drawing.PointF]::new($ax,$ay),[System.Drawing.PointF]::new($ax,$mid),[System.Drawing.PointF]::new($bx,$mid),[System.Drawing.PointF]::new($bx,$by))
        } else {
            # Branch in the gap immediately below the source, then follow column gutters.
            $mid=$ay+28
            if ([Math]::Abs($b.Y-$a.Y) -gt 216) {
                $dir=[Math]::Sign($b.X-$a.X);$gutter=$a.X+200+225*$dir
                $points=@([System.Drawing.PointF]::new($ax,$ay),[System.Drawing.PointF]::new($ax,$mid),[System.Drawing.PointF]::new($gutter,$mid),[System.Drawing.PointF]::new($gutter,$by-20),[System.Drawing.PointF]::new($bx,$by-20),[System.Drawing.PointF]::new($bx,$by))
            } else {
                $points=@([System.Drawing.PointF]::new($ax,$ay),[System.Drawing.PointF]::new($ax,$mid),[System.Drawing.PointF]::new($bx,$mid),[System.Drawing.PointF]::new($bx,$by))
            }
        }
        $g.DrawLines($pen,[System.Drawing.PointF[]]$points)
        $path='M '+(($points | ForEach-Object { "$($_.X),$($_.Y)" }) -join ' L ')
        [void]$svg.AppendLine("<path d=`"$path`" fill=`"none`" stroke=`"#536b63`" stroke-width=`"2`" marker-end=`"url(#arrow)`"/>")
        if ($e.Label) {
            $lx=($points[0].X+$points[1].X)/2; $ly=($points[0].Y+$points[1].Y)/2
            if($a.X -ne $b.X){$lx=($points[1].X+$points[2].X)/2;$ly=$points[1].Y}
            if($a.X -eq $b.X){$lx+=52}
            $labelWidth=[Math]::Max(70,$g.MeasureString($e.Label,$smallFont).Width+18)
            $edgeLabels+=@{Text=$e.Label;X=$lx;Y=$ly;Width=$labelWidth}
        }
    }
    foreach($label in $edgeLabels){
            $lx=$label.X;$ly=$label.Y;$labelWidth=$label.Width
            $brush=[System.Drawing.Brushes]::White
            $g.FillRectangle($brush,[single]($lx-$labelWidth/2),[single]($ly-13),[single]$labelWidth,[single]26)
            [void]$svg.AppendLine("<rect x=`"$($lx-$labelWidth/2)`" y=`"$($ly-13)`" width=`"$labelWidth`" height=`"26`" fill=`"white`"/>")
            Draw-Text $label.Text ($lx-$labelWidth/2) ($ly-13) $labelWidth 26 $smallFont 16 '#36574a'
    }
    foreach ($n in $ordered) {
        $x=$n.X;$y=$n.Y;$w=400;$h=160
        $fill='#ffffff';$stroke='#9bb5aa'
        switch($n.Shape){
            'start' {$fill='#164735';$stroke='#164735'}
            'end' {$fill='#e0f2e8';$stroke='#27805a'}
            'decision' {$fill='#fff4cf';$stroke='#c99e38'}
            'data' {$fill='#e7f0fc';$stroke='#6b94c8'}
            'error' {$fill='#fce9e7';$stroke='#c88077'}
        }
        $brush=New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($fill))
        $border=New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($stroke),2)
        if($n.Shape -eq 'decision') {
            $poly=[System.Drawing.PointF[]]@([System.Drawing.PointF]::new($x+$w/2,$y),[System.Drawing.PointF]::new($x+$w,$y+$h/2),[System.Drawing.PointF]::new($x+$w/2,$y+$h),[System.Drawing.PointF]::new($x,$y+$h/2))
            $g.FillPolygon($brush,$poly);$g.DrawPolygon($border,$poly)
            $pts=($poly|ForEach-Object{"$($_.X),$($_.Y)"}) -join ' '
            [void]$svg.AppendLine("<polygon points=`"$pts`" fill=`"$fill`" stroke=`"$stroke`" stroke-width=`"2`"/>")
        } else {
            $g.FillRectangle($brush,$x,$y,$w,$h);$g.DrawRectangle($border,$x,$y,$w,$h)
            [void]$svg.AppendLine("<rect x=`"$x`" y=`"$y`" width=`"$w`" height=`"$h`" rx=`"12`" fill=`"$fill`" stroke=`"$stroke`" stroke-width=`"2`"/>")
        }
        $ink=if($n.Shape -eq 'start'){'#ffffff'}else{'#183f32'}
        $lineHeight=27;$total=$n.Lines.Count*$lineHeight;$top=$y+($h-$total)/2
        $nodeFont=$font;$nodeSize=21;$textLimit=376
        if($n.Shape -eq 'decision'){$nodeFont=$decisionFont;$nodeSize=18;$textLimit=330}
        for($i=0;$i -lt $n.Lines.Count;$i++){Draw-Text $n.Lines[$i] ($x+12) ($top+$i*$lineHeight) ($w-24) $lineHeight $nodeFont $nodeSize $ink}
        foreach($line in $n.Lines){ if($g.MeasureString($line,$nodeFont).Width -gt $textLimit){throw "Text too wide in $($d.File): $line"} }
        $brush.Dispose();$border.Dispose()
    }
    $foot=$height-132
    Draw-Text 'สีเขียว: เริ่ม/สำเร็จ    สีเหลือง: เงื่อนไข    สีฟ้า: ข้อมูล    สีแดง: ไม่ผ่าน/ข้อผิดพลาด' 25 $foot 1350 28 $smallFont 16 '#526960'
    Draw-Text $d.Note 25 ($foot+34) 1350 32 $smallFont 16 '#36574a'
    Draw-Text ('อ้างอิง: '+$d.Sources) 25 ($foot+72) 1350 26 $smallFont 16 '#687b74'
    [void]$svg.AppendLine('</g></svg>')
    $svgPath=Join-Path $OutputDirectory ($d.File+'.svg');$pngPath=Join-Path $OutputDirectory ($d.File+'.png')
    [System.IO.File]::WriteAllText($svgPath,$svg.ToString(),[System.Text.UTF8Encoding]::new($false))
    $bitmap.Save($pngPath,[System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose();$bitmap.Dispose();$pen.Dispose();$arrowCap.Dispose()
    [xml]$verified=Get-Content -LiteralPath $svgPath -Encoding UTF8 -Raw
    $report+=@{file=$d.File;title=$d.Title;width=$width;height=$height;nodes=$ordered.Count;edges=$edges.Count;svgValid=($verified.DocumentElement.LocalName -eq 'svg')}
}
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'validation.json') -Encoding UTF8
$links=$report | ForEach-Object { '<article><h2>'+[System.Net.WebUtility]::HtmlEncode($_.title)+'</h2><p><a href="'+$_.file+'.png">PNG</a> · <a href="'+$_.file+'.svg">SVG</a></p><a href="'+$_.file+'.svg"><img loading="lazy" src="'+$_.file+'.svg" alt="'+[System.Net.WebUtility]::HtmlEncode($_.title)+'"></a></article>' }
$html='<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Durian Hub — Flowcharts</title><style>body{font-family:Tahoma,sans-serif;background:#f7faf9;color:#164735;max-width:1100px;margin:40px auto;padding:0 20px}article{background:white;padding:24px;margin:24px 0;border:1px solid #dce7df;border-radius:16px}img{width:100%;height:auto}a{color:#216d50}p{line-height:1.8}@media print{article{break-before:page;border:0}body{margin:0}}</style><h1>Durian Hub — Flowchart ระบบโดยละเอียด</h1><p>เลือกเปิด SVG เพื่อซูมโดยภาพไม่แตก หรือดาวน์โหลด PNG ใส่รายงาน ภาพแสดงเงื่อนไขและสถานะตามโค้ดที่ตรวจ 2 พฤศจิกายน 2569 ไม่ใช่ผลทดสอบครบวงจร</p>'+($links -join "`n")+'</html>'
[System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'index.html'),$html,[System.Text.UTF8Encoding]::new($false))
$font.Dispose();$decisionFont.Dispose();$smallFont.Dispose();$titleFont.Dispose();$subFont.Dispose();$format.Dispose()
$report | ForEach-Object { [pscustomobject]$_ } | Format-Table file,nodes,edges,width,height,svgValid -AutoSize
