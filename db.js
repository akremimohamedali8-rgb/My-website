const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
require('dotenv').config();

const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'data', 'store.sqlite');

async function openDb() {
  await fs.promises.mkdir(path.dirname(DB_FILE), { recursive: true });
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });
  return db;
}

if (require.main === module) {
  (async () => {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations.sql'), 'utf-8');
    const db = await openDb();
    await db.exec('PRAGMA foreign_keys = ON;');
    await db.exec(sql);
    
    // Create admin user
    const row = await db.get("SELECT id FROM users WHERE username = 'admin'");
    if (!row) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('admin123', 10);
      await db.run("INSERT INTO users (username, passwordHash, role) VALUES (?,?,?)", ['admin', hash, 'admin']);
      console.log('Admin created with username=admin password=admin123 (change it)');
    }

    // Add sample products if none exist
    const productCount = await db.get("SELECT COUNT(*) as count FROM products");
    if (productCount.count === 0) {
      const sampleProducts = [
        { reference: 'PHONE-001', nameAr: 'هاتف ذكي 5G', price: 1200, category: 'الهواتف', stock: 15, image: '📱', description: 'أحدث هاتف ذكي بتقنية 5G وشاشة AMOLED' },
        { reference: 'PHONE-002', nameAr: 'هاتف متوسط', price: 600, category: 'الهواتف', stock: 25, image: '📱', description: 'هاتف بسيط وموثوق للاستخدام اليومي' },
        { reference: 'LAPTOP-001', nameAr: 'حاسوب محمول Pro', price: 2500, category: 'الحواسيب', stock: 8, image: '💻', description: 'حاسوب محمول قوي للعمل والتصميم' },
        { reference: 'TABLET-001', nameAr: 'لوح إلكتروني 12 بوصة', price: 1500, category: 'الأجهزة اللوحية', stock: 12, image: '📲', description: 'لوح إلكتروني بشاشة كبيرة وبطارية طويلة الأمد' },
        { reference: 'WATCH-001', nameAr: 'ساعة ذكية', price: 400, category: 'الملحقات', stock: 30, image: '⌚', description: 'ساعة ذكية مع مراقبة صحية متقدمة' },
        { reference: 'HEADPHONE-001', nameAr: 'سماعات بلوتوث فاخرة', price: 350, category: 'الملحقات', stock: 40, image: '🎧', description: 'سماعات صوت عالي الجودة مع إلغاء ضوضاء' },
        { reference: 'CAMERA-001', nameAr: 'كاميرا رقمية احترافية', price: 1800, category: 'التصوير', stock: 6, image: '📷', description: 'كاميرا احترافية لتصوير الفيديو والصور' },
        { reference: 'POWER-001', nameAr: 'مشحنة بطارية محمولة', price: 120, category: 'الملحقات', stock: 50, image: '🔋', description: 'بطارية محمولة بسعة 20000 mAh' }
      ];

      for (const product of sampleProducts) {
        await db.run(
          'INSERT INTO products (reference, nameAr, name, price, category, stock, image, description) VALUES (?,?,?,?,?,?,?,?)',
          [product.reference, product.nameAr, product.nameAr, product.price, product.category, product.stock, product.image, product.description]
        );
      }
      console.log('Sample products added');
    }

    console.log('Migration finished');
    await db.close();
  })();
}

module.exports = { openDb };
