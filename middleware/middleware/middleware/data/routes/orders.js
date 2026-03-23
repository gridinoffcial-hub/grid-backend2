// POST /api/orders     → customer places a new order
// GET  /api/orders/:id → customer tracks their order

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();

const { validateOrder }           = require('../middleware/validate');
const { saveOrder, getOrderById } = require('../data/store');
const { sendOrderNotification }   = require('../services/mailer');

// ── Place a new order ──
router.post('/', validateOrder, async (req, res) => {
  try {
    const order = {
      id         : 'ORD-' + uuidv4().slice(0, 8).toUpperCase(),
      name       : req.cleanBody.name,
      phone      : req.cleanBody.phone,   // stored privately — never sent back
      type       : req.cleanBody.type,
      details    : req.cleanBody.details,
      plan       : req.cleanBody.plan,
      contactTime: req.cleanBody.time,
      status     : 'new',
      adminNote  : '',
      createdAt  : new Date().toISOString(),
      updatedAt  : new Date().toISOString(),
      ip         : req.ip,
    };

    saveOrder(order);
    sendOrderNotification(order).catch(() => {});

    console.log(`[ORDER] ✅ New order ${order.id} — ${order.type} — ${order.name}`);

    // Return confirmation WITHOUT phone number (privacy!)
    res.status(201).json({
      success          : true,
      message          : 'Order received! We will contact you within 1 hour. 🎨',
      orderId          : order.id,
      name             : order.name,
      type             : order.type,
      plan             : order.plan,
      estimatedContact : '1 hour',
    });

  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, error: 'Failed to save order. Please try again.' });
  }
});

// ── Track an order by ID ──
router.get('/:id', (req, res) => {
  const order = getOrderById(req.params.id.toUpperCase());
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found. Check your Order ID.' });
  }

  // Return safe fields only — phone never exposed!
  res.json({
    success  : true,
    orderId  : order.id,
    name     : order.name,
    type     : order.type,
    plan     : order.plan,
    status   : order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
});

module.exports = router;
