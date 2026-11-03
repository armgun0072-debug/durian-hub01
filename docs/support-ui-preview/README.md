# ตัวอย่างศูนย์ช่วยเหลือ Durian Hub

ตรวจด้วย Edge headless ผ่าน `tests/support-ui.ps1` บน isolated production preview ที่ localhost:3112 ข้อมูล API ถูกจำลองใน browser ไม่ใช้ข้อมูลจริง

- [หน้ารวมรายการบน desktop](desktop-help-home.png)
- [เลือกหัวข้อปัญหา](desktop-help-topic.png)
- [บทสนทนาและคิว](desktop-help-chat.png)
- [มือถือ light](mobile-help-chat-light.png)
- [มือถือ dark](mobile-help-chat-dark.png)

ผลตรวจอยู่ใน `checks.json`: เปิดจากเมนูบัญชี, โหลดรายการเพิ่มเติมรวมรายการปิดดีล, ส่งคำร้องพร้อมประเภทปัญหา, แสดงบทสนทนา/คิว, ไม่มี horizontal overflow และช่องพิมพ์อยู่ใน viewport บนมือถือ light/dark รวม 8 checks ไม่มี runtime exceptions
