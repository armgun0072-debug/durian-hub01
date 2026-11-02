import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "localhost";
const port = parseInt(process.env.SMTP_PORT || "1025", 10);
const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASS || "";
const from = process.env.MAIL_FROM || "Durian Hub <no-reply@durianhub.local>";

export const mailTransporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user && pass ? { user, pass } : undefined,
});

export async function sendOtpEmail({
  to,
  fullName,
  otpCode,
  purpose,
}: {
  to: string;
  fullName: string;
  otpCode: string;
  purpose: "VERIFY_EMAIL" | "RESET_PASSWORD";
}) {
  const isVerify = purpose === "VERIFY_EMAIL";
  const subject = isVerify
    ? `[Durian Hub] รหัส OTP สำหรับยืนยันอีเมลของคุณ: ${otpCode}`
    : `[Durian Hub] รหัส OTP สำหรับตั้งรหัสผ่านใหม่: ${otpCode}`;

  const purposeText = isVerify
    ? "ยืนยันการสมัครสมาชิกบัญชี Durian Hub"
    : "ตั้งรหัสผ่านใหม่สำหรับเข้าสู่ระบบ Durian Hub";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 32px; text-align: center; color: white; }
          .logo { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 12px; margin-top: 8px; }
          .body { padding: 32px; }
          .otp-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #065f46; font-family: monospace; }
          .warning { font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
          .footer { background: #f8fafc; padding: 16px 32px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🍈 DURIAN HUB</div>
            <div class="badge">ตลาดกลางทุเรียนไทยครบวงจร</div>
          </div>
          <div class="body">
            <h2 style="margin-top: 0; color: #0f172a;">สวัสดีคุณ ${fullName}</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              ระบบได้รับคำขอสำหรับ <strong>${purposeText}</strong> กรุณานำรหัส OTP 6 หลักด้านล่างนี้ไปกรอกในหน้าเว็บไซต์:
            </p>
            <div class="otp-box">
              <div style="font-size: 12px; color: #059669; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">รหัสยืนยันตัวตน (OTP)</div>
              <div class="otp-code">${otpCode}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 6px;">รหัสมีอายุการใช้งาน 10 นาที</div>
            </div>
            <div class="warning">
              ⚠️ <strong>ข้อควรระวัง:</strong> ห้ามเปิดเผยรหัส OTP นี้แก่ผู้อื่นโดยเด็ดขาด เจ้าหน้าที่ Durian Hub จะไม่มีการขอรหัส OTP จากคุณในทุกกรณี หากคุณไม่ได้เป็นผู้ทำรายการนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้
            </div>
          </div>
          <div class="footer">
            อีเมลฉบับนี้ถูกส่งจากระบบอัตโนมัติของ Durian Hub Thailand<br/>
            ตรวจสอบและดูอีเมลจำลองได้ที่ Mailpit (localhost:8025)
          </div>
        </div>
      </body>
    </html>
  `;

  return mailTransporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}
