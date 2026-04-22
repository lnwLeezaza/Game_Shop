import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  return resend.emails.send({
    from: 'GameShop <noreply@yourdomain.com>',
    to,
    subject: 'รีเซ็ตรหัสผ่าน GameShop',
    html: `
      <div style="font-family:monospace;background:#050508;color:#f1f5f9;padding:40px;max-width:480px;margin:0 auto;border-radius:16px;border:1px solid #2a2a45">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
          <div style="width:40px;height:40px;background:linear-gradient(135deg,#7c3aed,#2563eb);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">🛒</div>
          <span style="font-size:20px;font-weight:bold;background:linear-gradient(135deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent">GameShop</span>
        </div>
        <h2 style="color:#a78bfa;margin-top:0;font-size:18px">// รีเซ็ตรหัสผ่าน</h2>
        <p style="color:#cbd5e1;line-height:1.6">คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี GameShop<br>กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;letter-spacing:0.05em">
          [ รีเซ็ตรหัสผ่าน ]
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:20px;padding-top:20px;border-top:1px solid #1a1a2e">
          ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง<br>
          หากคุณไม่ได้ขอรีเซ็ต กรุณาเพิกเฉยต่ออีเมลนี้
        </p>
      </div>
    `,
  })
}
