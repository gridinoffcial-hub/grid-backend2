// All admin routes — needs x-admin-pin header
//
// GET    /api/admin/stats         → dashboard numbers
// GET    /api/admin/orders        → all orders (with phone numbers)
// GET    /api/admin/orders/:id    → single order full details
// PATCH  /api/admin/orders/:id    → update status / add note
// DELETE /api/admin/orders/:id    → delete order
// GET    /api/admin/contacts      → all contact form messages

const express = require('express');
const router  = express.Router();

const { adminAuth }  = require('../middleware/auth');
const { sanitise }   = require('../middleware/validate');
const {
  getAllOrders, getOrderById, updateOrderStatus, deleteOrder,
  getAllContacts, getStats,
} = require('../data/store');

// Every admin route needs PIN
router.use(adminAuth);

// ── Stats dashboard ──
router.get('/stats', (_req, res) => {
  const stats = getStats();
  res.json({
    success: true,
    stats,
    message: stats.newOrders > 0
      ? `⚡ You have ${stats.newOrders} new order(s) waiting!`
      : '✅ All orders handled.',
  });
});

// ── Get all orders ──
router.get('/orders', (req, res) => {
  let orders = getAllOrders();

  // Filter by status: ?status=new
  if (req.query.status) {
    orders = orders.filter(o => o.status === req.query.status);
  }
  // Filter by date: ?date=2026-03-22
  if (req.query.date) {
    orders = orders.filter(o => o.createdAt.startsWith(req.query.date));
  }

  res.json({ success: true, count: orders.length, orders });
});

// ── Get one order (full details including phone) ──
router.get('/orders/:id', (req, res) => {
  const order = getOrderById(req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });
  res.json({ success: true, order });
});

// ── Update order status ──
// Body: { "status": "in_progress", "note": "Started design" }
router.patch('/orders/:id', (req, res) => {
  const validStatuses = ['new', 'in_progress', 'preview_sent', 'completed', 'cancelled'];

  if (req.body.status && !validStatuses.includes(req.body.status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Use: ' + validStatuses.join(', '),
    });
  }

  const updated = updateOrderStatus(
    req.params.id.toUpperCase(),
    req.body.status,
    req.body.note ? sanitise(req.body.note) : undefined,
  );

  if (!updated) return res.status(404).json({ success: false, error: 'Order not found.' });

  console.log(`[ADMIN] Order ${updated.id} → ${req.body.status}`);
  res.json({ success: true, order: updated });
});

// ── Delete an order ──
router.delete('/orders/:id', (req, res) => {
  const deleted = deleteOrder(req.params.id.toUpperCase());
  if (!deleted) return res.status(404).json({ success: false, error: 'Order not found.' });
  console.log(`[ADMIN] Deleted order ${req.params.id}`);
  res.json({ success: true, message: 'Order deleted.' });
});

// ── Get all contact messages ──
router.get('/contacts', (_req, res) => {
  const contacts = getAllContacts();
  res.json({ success: true, count: contacts.length, contacts });
});

module.exports = router;
