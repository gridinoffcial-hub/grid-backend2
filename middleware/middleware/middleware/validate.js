// Cleans and validates all incoming data
// Stops bad/fake inputs before they reach the database

function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/<[^>]*>/g, '')    // remove HTML tags
    .replace(/['"`;\\]/g, '')   // remove dangerous chars
    .slice(0, 500);             // max 500 characters
}

function isValidPhone(phone) {
  // Indian numbers: 10 digits, starts with 6, 7, 8, or 9
  return /^[6-9][0-9]{9}$/.test(phone.replace(/\s/g, ''));
}

function validateOrder(req, res, next) {
  const { name, phone, type, details, plan } = req.body;
  const errors = [];

  if (!name || sanitise(name).length < 2)
    errors.push('name: must be at least 2 characters');

  if (!phone || !isValidPhone(phone))
    errors.push('phone: must be a valid 10-digit Indian mobile number (starts with 6-9)');

  const allowedTypes = [
    'Birthday Poster', 'Farewell Design', 'Event Flyer',
    'Business Promo', 'Social Media Post', 'Sports Day Poster', 'Other',
  ];
  if (!type || !allowedTypes.includes(type))
    errors.push('type: please select a valid poster type');

  if (!details || sanitise(details).length < 10)
    errors.push('details: please describe your poster (at least 10 characters)');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.cleanBody = {
    name   : sanitise(name),
    phone  : phone.replace(/\s/g, ''),
    type,
    details: sanitise(details),
    plan   : sanitise(plan || 'Basic — ₹199'),
    time   : sanitise(req.body.time || 'Anytime'),
  };

  next();
}

function validateContact(req, res, next) {
  const { name, phone, posterType, message } = req.body;
  const errors = [];

  if (!name || sanitise(name).length < 2)
    errors.push('name: required');
  if (!phone || !isValidPhone(phone))
    errors.push('phone: invalid 10-digit number');
  if (!posterType)
    errors.push('posterType: required');
  if (!message || sanitise(message).length < 5)
    errors.push('message: too short');

  if (errors.length > 0)
    return res.status(400).json({ success: false, errors });

  req.cleanBody = {
    name      : sanitise(name),
    phone     : phone.replace(/\s/g, ''),
    posterType,
    message   : sanitise(message),
    replyVia  : sanitise(req.body.replyVia || 'Phone call'),
  };

  next();
}

module.exports = { validateOrder, validateContact, sanitise };
