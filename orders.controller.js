const express = require('express');
const router = express.Router();
const { openDb } = require('./db');

router.post('/', async (req, res) => {
  const { customer, items } = req.body || {};
  if (!customer || !items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, message: 'Données invalides' });
  const db = await openDb();
  try {
    await db.run('BEGIN TRANSACTION');
    for (const it of items) {
      const prod = await db.get('SELECT stock FROM products WHERE id = ?', it.id);
      if (!prod) throw new Error(`Produit introuvable: ${it.id}`);
      if (prod.stock < it.quantity) throw new Error(`Stock insuffisant pour le produit ${it.id}`);
    }
    for (const it of items) {
      await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', it.quantity, it.id);
    }
    const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const r = await db.run('INSERT INTO orders (customer_name, customer_phone, customer_address, special_message, total) VALUES (?,?,?,?,?)', [customer.name, customer.phone, customer.address, customer.specialMessage || null, total]);
    const orderId = r.lastID;
    for (const it of items) {
      await db.run('INSERT INTO order_items (order_id, product_id, nameAr, price, quantity) VALUES (?,?,?,?,?)', [orderId, it.id, it.nameAr, it.price, it.quantity]);
    }
    await db.run('COMMIT');
    // emit socket if available
    if (req.app && req.app.get && req.app.get('io')) {
      const io = req.app.get('io');
      io.emit('order:created', { orderId, items });
    }
    res.json({ success: true, data: { id: orderId, total } });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  const db = await openDb();
  const orders = await db.all('SELECT * FROM orders ORDER BY id DESC');
  const detailed = [];
  for (const o of orders) {
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', o.id);
    detailed.push({ ...o, items });
  }
  res.json({ success: true, data: detailed });
});

module.exports = router;
