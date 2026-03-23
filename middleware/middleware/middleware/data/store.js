// Saves all orders and contacts to JSON files
// No database needed — perfect for starting out!
// When you grow big → switch to MongoDB

const fs   = require('fs');
const path = require('path');

const ORDERS_FILE  = path.join(__dirname, 'orders.json');
const CONTACT_FILE = path.join(__dirname, 'contacts.json');

function readFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ── Orders ──────────────────────────────────────

function getAllOrders() {
  return readFile(ORDERS_FILE);
}

function getOrderById(id) {
  return getAllOrders().find(o => o.id === id) || null;
}

function saveOrder(order) {
  const orders = getAllOrders();
  orders.unshift(order); // newest first
  writeFile(ORDERS_FILE, orders);
  return order;
}

function updateOrderStatus(id, status, note) {
  const orders = getAllOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  if (status) orders[idx].status = status;
  orders[idx].updatedAt = new Date().toISOString();
  if (note) orders[idx].adminNote = note;
  writeFile(ORDERS_FILE, orders);
  return orders[idx];
}

function deleteOrder(id) {
  const orders = getAllOrders();
  const filtered = orders.filter(o => o.id !== id);
  if (filtered.length === orders.length) return false;
  writeFile(ORDERS_FILE, filtered);
  return true;
}

// ── Contacts ─────────────────────────────────────

function getAllContacts() {
  return readFile(CONTACT_FILE);
}

function saveContact(contact) {
  const contacts = getAllContacts();
  contacts.unshift(contact);
  writeFile(CONTACT_FILE, contacts);
  return contact;
}

// ── Stats ─────────────────────────────────────────

function getStats() {
  const orders   = getAllOrders();
  const contacts = getAllContacts();
  const today    = new Date().toDateString();
  return {
    totalOrders  : orders.length,
    newOrders    : orders.filter(o => o.status === 'new').length,
    inProgress   : orders.filter(o => o.status === 'in_progress').length,
    completed    : orders.filter(o => o.status === 'completed').length,
    totalContacts: contacts.length,
    todayOrders  : orders.filter(o => new Date(o.createdAt).toDateString() === today).length,
    revenue      : orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => {
        const match = o.plan.match(/₹(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0),
  };
}

module.exports = {
  getAllOrders, getOrderById, saveOrder, updateOrderStatus, deleteOrder,
  getAllContacts, saveContact, getStats,
};


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 9 of 12 — Filename: routes/orders.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
