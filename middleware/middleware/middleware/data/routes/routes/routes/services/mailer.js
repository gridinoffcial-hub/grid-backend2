// Sends email to the trio when a new order arrives
// Setup: add EMAIL_USER and EMAIL_PASS in Render environment variables
// Use Gmail App Password (not your regular password!)
// Get it at: myaccount.google.com → Security → App Passwords

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
}

function maskPhone(phone) {
  const p = String(phone).replace('+91', '').replace(/\s/g, '');
  return p.slice(0, 4) + '••••' + p.slice(-2);
}

async function sendOrderNotification(order) {
  const t = getTransporter();
  if (!t) {
    console.log('[MAIL] Email not configured. Add EMAIL_USER and EMAIL_PASS to env vars.');
    return;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#0f0e0c;padding:20px;text-align:center;border-radius:12px 12px 0 0">
        <h2 style="color:#fff;margin:0">Grid<span style="color:#e8400a">.</span> — New Order! 🔱</h2>
      </div>
      <div style="background:#f8f7f4;padding:24px;border-radius:0 0 12px 12px;border:1px solid #eee">
        <p style="margin:0 0 16px;font-size:.9rem;color:#555">A new order just came in. Reply within 1 hour!</p>
        <table style="width:100%;border-collapse:collapse;font-size:.85rem">
          <tr style="border-bottom:1px solid #eee"><td style="padding:8px 0;color:#888;width:40%">Order ID</td><td style="padding:8px 0;font-weight:700">${order.id}</td></tr>
          <tr style="border-bottom:1px solid #eee"><td style="padding:8px 0;color:#888">Customer</td><td style="padding:8px 0;font-weight:700">${order.name}</td></tr>
          <tr style="border-bottom:1px solid #eee"><td style="padding:8px 0;color:#888">Phone</td><td style="padding:8px 0">+91 ${maskPhone(order.phone)} <small style="color:#e8400a">(see admin panel for full number)</small></td></tr>
          <tr style="border-bottom:1px solid #eee"><td style="padding:8px 0;color:#888">Type</td><td style="padding:8px 0;font-weight:700">${order.type}</td></tr>
          <tr style="border-bottom:1px solid #eee"><td style="padding:8px 0;color:#888">Plan</td><td style="padding:8px 0">${order.plan}</td></tr>
          <tr style="border-bottom:1px solid #eee"><td style="padding:8px 0;color:#888;vertical-align:top">Details</td><td style="padding:8px 0">${order.details}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Best time</td><td style="padding:8px 0">${order.contactTime}</td></tr>
        </table>
        <div style="margin-top:20px;padding:12px;background:#fff;border-radius:8px;border-left:3px solid #e8400a">
          <p style="margin:0;font-size:.8rem;color:#555">
            View full phone number in admin panel:<br>
            <strong>GET /api/admin/orders/${order.id}</strong><br>
            Header: <strong>x-admin-pin: your_pin</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await t.sendMail({
      from   : `Grid Orders <${process.env.EMAIL_USER}>`,
      to     : process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
      subject: `🔱 
module.exports = { sendOrderNotification, sendContactNotification };
