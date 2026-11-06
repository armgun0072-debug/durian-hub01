# รูปแผนภาพ Durian Hub

จัดทำจากขั้นตอนใน [เอกสารภาพรวมฐานข้อมูล](../database-overview.md) วันที่ 4 พฤศจิกายน 2026: ER ส่งออกด้วย Mermaid ส่วน Flowchart ใช้ SVG กำหนดตำแหน่งเพื่อให้เส้นเป็นระเบียบตามแบบที่ผู้ใช้เลือก

| แผนภาพ | PNG | SVG | ต้นฉบับ Mermaid |
| --- | --- | --- | --- |
| 1. สมาชิกและสิทธิ์ | [2100 × 1000](relationship-01-members.png) | [SVG](relationship-01-members.svg) | [MMD](relationship-01-members.mmd) |
| 2. ประกาศและสถิติตลาด | [2696 × 1800](relationship-02-marketplace.png) | [SVG](relationship-02-marketplace.svg) | [MMD](relationship-02-marketplace.mmd) |
| 3. แชตและธุรกรรม | [2256 × 1800](relationship-03-transactions.png) | [SVG](relationship-03-transactions.svg) | [MMD](relationship-03-transactions.mmd) |
| 4. Flowchart ภาพรวมระบบ | [3800 × 9080](system-flowchart.png) | [SVG](system-flowchart.svg) | [MMD](system-flowchart.mmd) |

ใช้ PNG แทรกในเอกสารหรือสไลด์ได้ทันที ส่วน SVG เหมาะกับการขยายหรือพิมพ์ขนาดใหญ่ โดยเฉพาะ Flowchart ที่มีรายละเอียดมาก ควรเปิดขนาดเต็มเพื่ออ่านข้อความ

ER เรนเดอร์ด้วย Mermaid 11.12.2 พื้นหลังขาว ส่วน Flowchart ใช้พื้นหลังดำ กล่องน้ำเงิน ตัวอักษรฟ้าอ่อน และเส้นหักมุม ทั้งหมดส่งออก PNG ด้วย Chrome headless ความละเอียด 2 เท่า ใช้ฟอนต์ Tahoma และ SVG แบบไม่มี foreignObject เครื่องที่ไม่มี Tahoma อาจแสดงฟอนต์ทดแทนเมื่อเปิด SVG; PNG คงหน้าตาตามภาพที่ส่งออก

ตรวจ PNG ทั้ง 4 ภาพด้วยสายตาแล้ว รวมทั้งตรวจชื่อ 18 ตาราง เส้นหลัก ER 19 เส้น และต้นฉบับ MMD ตรงกับเอกสาร แก้สีป้ายเส้นเชื่อมให้ตัดกับพื้นหลังและเลื่อนป้าย `groups_area` เพื่อหลีกเลี่ยงการซ้อนทับ โดยไม่เปลี่ยนเส้นความสัมพันธ์

[render-checks.json](render-checks.json) บันทึกขนาดภาพและข้อมูล renderer ต้นฉบับ MMD เก็บขั้นตอนและลูกศรเดียวกับภาพ แต่ตำแหน่งที่ Mermaid จัดให้อาจต่างจาก SVG

Flowchart ใช้วงกลมอักษรเดียวกันแทนเส้นยาวที่ข้ามส่วน: A บัญชีสมาชิก, O ยืนยัน OTP, B งานแอดมิน, P ประกาศสาธารณะ, R ขอเพิ่มบทบาท, C รายงานประกาศ, J กลับไปเจรจา, H ศูนย์ช่วยเหลือ, Q เข้าคิวใหม่, S คำนวณสถิติ และ Z สิ้นสุดขั้นตอน กล่องเส้นประหมายถึงจุดตัดสินใจ ลูกศรเส้นประเป็นทางเลือกหรือกระบวนการแยก

สร้าง Flowchart ซ้ำด้วย [render-system-flowchart.cjs](../../scripts/render-system-flowchart.cjs):

```cmd
node scripts/render-system-flowchart.cjs
```

รันจาก root โปรเจกต์ ต้องมี Node.js ที่รองรับ WebSocket global และ Chrome ใน path เริ่มต้นของ Windows หรือกำหนด `CHROME_PATH` สคริปต์สร้าง SVG/PNG/MMD, อัปเดต Mermaid ในเอกสารและ metadata ของ Flowchart โดยไม่แตะ ER ทั้งสามภาพ และตรวจข้อความล้นกล่องก่อนบันทึก PNG ไม่เชื่อมฐานข้อมูลหรือดาวน์โหลด dependency
