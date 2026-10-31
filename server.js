// AssignHub — full stack assignment & project help website
// Backend: Node.js + Express + Postgres (Neon) in production, SQLite locally

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

// ---------- Config (.env is optional) ----------
loadEnvFile(path.join(__dirname, '.env'));

const config = {
  port: Number(process.env.PORT) || 3000,
  adminPassword: process.env.ADMIN_PASSWORD || '', // set in .env locally / host env vars in production
  whatsappNumber: process.env.WHATSAPP_NUMBER || '923107577751',
  whatsappDisplay: process.env.WHATSAPP_DISPLAY || '0310-7577751',
  ownerName: process.env.OWNER_NAME || 'Hafsa Ali',
  brandName: process.env.BRAND_NAME || 'AssignHub',
};

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

// ---------- Database ----------
const db = require('./db');

const SERVICES = [
  'Programming Assignment', 'AI / Machine Learning Project', 'Web Development',
  'Mobile App', 'Database / SQL', 'PPT Slides / Presentation', 'Report / Documentation',
  'Final Year Project', 'Data Analysis / Excel', 'Other',
];
const STATUSES = ['New', 'In Progress', 'Completed', 'Cancelled'];
// Codes handed out by the "Spin the Wheel" game on the homepage
const PROMOS = { CODE5: 5, CODE10: 10, CODE15: 15, BUGHUNTER: 20, FREEREV: 0, FREEPPT: 0 };

// ---------- App ----------
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Simple in-memory rate limiter
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) {
      return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes or message on WhatsApp.' });
    }
    list.push(now);
    hits.set(key, list);
    next();
  };
}

// Wrap async handlers so database errors return a 500 instead of crashing
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const now = () => new Date().toISOString();

async function newId() {
  // e.g. AH-7K3Q9P — easy to read out on WhatsApp
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id;
  do {
    id = 'AH-' + Array.from(crypto.randomBytes(6), (b) => alphabet[b % alphabet.length]).join('');
  } while (await db.get('SELECT 1 FROM requests WHERE id = ?', [id]));
  return id;
}

// ---------- Public API ----------
app.get('/api/config', (req, res) => {
  const { whatsappNumber, whatsappDisplay, ownerName, brandName } = config;
  res.json({ whatsappNumber, whatsappDisplay, ownerName, brandName, services: SERVICES });
});

app.get('/api/stats', h(async (req, res) => {
  const row = await db.get(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed
    FROM requests`);
  res.json({ total: Number(row.total) || 0, completed: Number(row.completed) || 0 });
}));

app.post('/api/requests', rateLimit({ windowMs: 10 * 60 * 1000, max: 5 }), h(async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true, id: 'AH-THANKS' }); // honeypot for bots

  const data = {
    name: clean(b.name, 80),
    whatsapp: clean(b.whatsapp, 25),
    email: clean(b.email, 120),
    university: clean(b.university, 120),
    field: clean(b.field, 80),
    service: clean(b.service, 60),
    title: clean(b.title, 150),
    description: clean(b.description, 4000),
    deadline: clean(b.deadline, 30),
    budget: clean(b.budget, 40),
    file_link: clean(b.fileLink, 500),
    promo: clean(b.promo, 20).toUpperCase(),
    estimate: clean(b.estimate, 60),
  };

  const errors = [];
  if (data.name.length < 2) errors.push('Please enter your name.');
  if (!/^[+0-9][0-9\s-]{9,20}$/.test(data.whatsapp)) errors.push('Please enter a valid WhatsApp number.');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Email looks invalid.');
  if (!data.field) errors.push('Please enter your field / subject.');
  if (!SERVICES.includes(data.service)) errors.push('Please choose a service.');
  if (data.title.length < 3) errors.push('Please give your task a short title.');
  if (data.description.length < 10) errors.push('Please describe the task (at least 10 characters).');
  if (!data.deadline || Number.isNaN(Date.parse(data.deadline))) errors.push('Please choose a deadline.');
  if (data.file_link && !/^https?:\/\//i.test(data.file_link)) errors.push('File link must start with http:// or https://');
  if (data.promo && !(data.promo in PROMOS)) data.promo = '';
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const id = await newId();
  const ts = now();
  await db.run(`
    INSERT INTO requests (id, name, whatsapp, email, university, field, service, title, description,
      deadline, budget, file_link, promo, estimate, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    id, data.name, data.whatsapp, data.email, data.university, data.field, data.service, data.title,
    data.description, data.deadline, data.budget, data.file_link, data.promo, data.estimate, ts, ts,
  ]);
  console.log(`[new request] ${id} — ${data.name} — ${data.service}`);
  res.status(201).json({ ok: true, id, promoApplied: data.promo || null });
}));

app.get('/api/track/:id', rateLimit({ windowMs: 60 * 1000, max: 20 }), h(async (req, res) => {
  const row = await db.get(`
    SELECT id, name, service, title, deadline, status, price, client_note, created_at, updated_at
    FROM requests WHERE id = ?`, [clean(req.params.id, 20).toUpperCase()]);
  if (!row) return res.status(404).json({ error: 'No request found with that tracking ID.' });
  row.name = row.name.split(' ')[0]; // only first name is shown publicly
  res.json(row);
}));

// ---------- Admin auth (single password, token sessions) ----------
const sessions = new Map(); // token -> expiry
const SESSION_MS = 12 * 60 * 60 * 1000;

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const exp = sessions.get(token);
  if (!token || !exp || exp < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

app.post('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), (req, res) => {
  if (!config.adminPassword) {
    return res.status(503).json({ error: 'Admin password is not set. Add ADMIN_PASSWORD to .env or the host settings.' });
  }
  if (!safeEqual((req.body || {}).password || '', config.adminPassword)) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_MS);
  res.json({ token });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  sessions.delete((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  res.json({ ok: true });
});

app.get('/api/admin/requests', requireAdmin, h(async (req, res) => {
  const rows = await db.all('SELECT * FROM requests ORDER BY created_at DESC');
  res.json({ requests: rows, statuses: STATUSES });
}));

app.patch('/api/admin/requests/:id', requireAdmin, h(async (req, res) => {
  const row = await db.get('SELECT * FROM requests WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {};
  const status = STATUSES.includes(b.status) ? b.status : row.status;
  const price = b.price === '' || b.price === null ? null
    : b.price !== undefined ? Math.max(0, Math.round(Number(b.price)) || 0) : row.price;
  const clientNote = b.clientNote !== undefined ? clean(b.clientNote, 1000) : row.client_note;
  const adminNotes = b.adminNotes !== undefined ? clean(b.adminNotes, 4000) : row.admin_notes;
  await db.run(`UPDATE requests SET status = ?, price = ?, client_note = ?, admin_notes = ?, updated_at = ? WHERE id = ?`,
    [status, price, clientNote, adminNotes, now(), row.id]);
  res.json(await db.get('SELECT * FROM requests WHERE id = ?', [row.id]));
}));

app.delete('/api/admin/requests/:id', requireAdmin, h(async (req, res) => {
  const result = await db.run('DELETE FROM requests WHERE id = ?', [req.params.id]);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
}));

app.get('/api/admin/export.csv', requireAdmin, h(async (req, res) => {
  const rows = await db.all('SELECT * FROM requests ORDER BY created_at DESC');
  const cols = ['id', 'created_at', 'status', 'name', 'whatsapp', 'email', 'university', 'field', 'service',
    'title', 'description', 'deadline', 'budget', 'estimate', 'price', 'promo', 'file_link', 'client_note', 'admin_notes'];
  const esc = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // guard against spreadsheet formula injection
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="assignhub-requests-${now().slice(0, 10)}.csv"`);
  res.send('﻿' + csv);
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Server error — please try again or message on WhatsApp.' });
});

db.init().then(() => {
  app.listen(config.port, () => {
    console.log(`\n  ${config.brandName} is running → http://localhost:${config.port}  (database: ${db.kind})`);
    console.log(`  Admin dashboard      → http://localhost:${config.port}/admin`);
    if (!config.adminPassword) {
      console.log('  ⚠  ADMIN_PASSWORD is not set — admin login is disabled until you add it to .env or the host settings.\n');
    }
  });
}).catch((err) => {
  console.error('Could not connect to the database:', err.message);
  process.exit(1);
});
