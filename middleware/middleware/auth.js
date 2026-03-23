// Protects admin routes with a secret PIN
// Pass the PIN as header: x-admin-pin: trio2026

const adminAuth = (req, res, next) => {
  const pin = req.headers['x-admin-pin'] || req.query.pin;

  if (!pin) {
    return res.status(401).json({
      success: false,
      error: 'Admin PIN required. Send it as x-admin-pin header.',
    });
  }

  if (pin !== process.env.ADMIN_PIN) {
    console.warn(`[AUTH] Wrong PIN attempt from IP: ${req.ip} at ${new Date().toISOString()}`);
    return res.status(403).json({
      success: false,
      error: 'Wrong admin PIN. Access denied.',
    });
  }

  next();
};

module.exports = { adminAuth };
