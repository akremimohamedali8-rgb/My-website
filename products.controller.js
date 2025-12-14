const express = require('express');
const router = express.Router();
const { openDb } = require('./db');
const { authMiddleware } = require('./middleware/auth');

router.get('/', async (req, res) => {
  const db = await openDb();
  const rows = await db.all('SELECT * FROM products ORDER BY id ASC');
  res.json({ success: true, data: rows });
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = await openDb();
  const row = await db.get('SELECT * FROM products WHERE id = ?', id);
  if (!row) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
  res.json({ success: true, data: row });
});

router.post('/', authMiddleware, async (req, res) => {
  const { reference, nameAr, price, category, stock, image, description } = req.body || {};
  if (!nameAr) return res.status(400).json({ success: false, message: 'nameAr requis' });
  const db = await openDb();
  const result = await db.run('INSERT INTO products (reference, nameAr, name, price, category, stock, image, description) VALUES (?,?,?,?,?,?,?,?)', [reference || `REF-${Date.now()}`, nameAr, nameAr, price || 0, category || 'général', stock || 0, image || '📦', description || '']);
  const newp = await db.get('SELECT * FROM products WHERE id = ?', result.lastID);
  res.json({ success: true, data: newp });
});

router.put('/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { reference, nameAr, price, category, stock, image, description } = req.body || {};
  const db = await openDb();
  const existing = await db.get('SELECT * FROM products WHERE id = ?', id);
  if (!existing) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
  await db.run('UPDATE products SET reference=?, nameAr=?, name=?, price=?, category=?, stock=?, image=?, description=? WHERE id=?', [reference ?? existing.reference, nameAr || existing.nameAr, nameAr || existing.name, price ?? existing.price, category || existing.category, stock ?? existing.stock, image ?? existing.image, description ?? existing.description, id]);
  const updated = await db.get('SELECT * FROM products WHERE id = ?', id);
  res.json({ success: true, data: updated });
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = await openDb();
  await db.run('DELETE FROM products WHERE id = ?', id);
  res.json({ success: true });
});

module.exports = router;
