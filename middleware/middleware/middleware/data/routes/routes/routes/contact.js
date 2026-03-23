// POST /api/contact
// Receives contact form submissions
// Phone stored privately — never returned to browser

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();

const { validateContact }         = require('../middleware/validate');
const { saveContact }             = require('../data/store');
const { sendContactNotification } = require('../services/mailer');

router.post('/', validateContact, async (req, res) => {
  try {
    const contact = {
      id       : 'CNT-' + uuidv4().slice(0, 8).toUpperCase(),
      name     : req.cleanBody.name,
      phone    : req.cleanBody.phone,
      posterType: req.cleanBody.posterType,
      message  : req.cleanBody.message,
      replyVia : req.cleanBody.replyVia,
      createdAt: new Date().toISOString(),
      ip       : req.ip,
    };

    saveContact(contact);
    sendContactNotification(contact).catch(() => {});

    console.log(`[CONTACT] 📬 New message ${contact.id} — ${contact.name}`);

    res.status(201).json({
      success: true,
      message: "Message received! We'll reply within 1 hour. 🎨",
      id     : contact.id,
    });

  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ success: false, error: 'Failed to send message. Please try again.' });
  }
});

module.exports = router;

