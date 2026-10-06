'use strict';
/**
 * Server della lista Mira. Nessun framework: solo Node + "qrcode".
 *  - sito vetrina (public/) alimentato da config/site.json
 *  - /proponi: accessibile SOLO dopo aver scansionato un QR valido
 *  - /admin: pannello protetto da password (QR, proposte)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PROPOSAL_SESSION_MIN = 20; // minuti di validità dopo la scansione
const ADMIN_SESSION_H = 12;

fs.mkdirSync(DATA_DIR, { recursive: true });

/* ---------- segreti ---------- */
function readOrCreate(file, make) {
  try { return fs.readFileSync(file, 'utf8').trim(); } catch {
    const v = make();
    fs.writeFileSync(file, v + '\n', { mode: 0o600 });
    return v;
  }
}
const SECRET = process.env.SECRET || readOrCreate(path.join(DATA_DIR, '.secret'), () => crypto.randomBytes(32).toString('hex'));
let generatedPassword = false;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || readOrCreate(path.join(DATA_DIR, '.admin-password'), () => {
  generatedPassword = true;
  return crypto.randomBytes(9).toString('base64url');
});

/* ---------- database JSON (scrittura atomica) ---------- */
let db = { settings: { baseUrl: '' }, qrs: [], proposals: [] };
try { db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) }; } catch { /* primo avvio */ }
function save() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
const newId = (n = 6) => crypto.randomBytes(n).toString('base64url');

/* ---------- token firmati (cookie) ---------- */
const sign = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
};
function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const good = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}
function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
const setCookie = (res, name, value, maxAgeSec) => {
  const secure = process.env.INSECURE_COOKIES ? '' : '; Secure';
  const c = `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure}`;
  const prev = res.getHeader('Set-Cookie') || [];
  res.setHeader('Set-Cookie', [].concat(prev, c));
};

/* ---------- utilità ---------- */
const hits = new Map(); // rate-limit in memoria: nulla viene salvato su disco
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 3600e3)) hits.delete(k); }, 600e3).unref();
const clientIp = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';
const origin = (req) => {
  if (db.settings.baseUrl) return db.settings.baseUrl.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
  return `${proto}://${req.headers.host}`;
};
const json = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
};
function readBody(req, limit = 20000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('too-big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); } catch { reject(new Error('bad-json')); } });
    req.on('error', reject);
  });
}
const qrUrl = (req, qr) => `${origin(req)}/q/${qr.code}`;
const isAdmin = (req) => {
  const p = verify(cookies(req).admin);
  return !!(p && p.role === 'admin');
};

/* ---------- file statici ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
function serveFile(res, file, extra = {}) {
  const abs = path.resolve(file);
  if (!abs.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(abs, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Pagina non trovata'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream', ...extra });
    res.end(buf);
  });
}

/* ---------- API ---------- */
async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;

  // contenuti pubblici del sito
  if (route === 'GET /api/site') {
    const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'site.json'), 'utf8'));
    return json(res, 200, cfg);
  }

  // stato sessione proposte (serve alla pagina /proponi)
  if (route === 'GET /api/proposal-session') {
    const s = verify(cookies(req).qs);
    const qr = s && db.qrs.find((q) => q.id === s.qr && !q.revoked);
    if (!qr) return json(res, 401, { ok: false });
    return json(res, 200, { ok: true, place: qr.label, expiresAt: s.exp, categories: CATEGORIES });
  }

  // invio proposta anonima
  if (route === 'POST /api/proposals') {
    const s = verify(cookies(req).qs);
    const qr = s && db.qrs.find((q) => q.id === s.qr && !q.revoked);
    if (!qr) return json(res, 401, { error: 'Scansiona un QR code della scuola per inviare una proposta.' });
    if (limited('p:' + clientIp(req), 5, 3600e3) || limited('s:' + s.sid, 3, 600e3))
      return json(res, 429, { error: 'Hai inviato molte proposte: riprova tra un po’.' });
    let body;
    try { body = await readBody(req); } catch { return json(res, 400, { error: 'Richiesta non valida.' }); }
    if (body.website) return json(res, 200, { ok: true }); // honeypot anti-bot
    const text = String(body.text || '').trim();
    const category = CATEGORIES.includes(body.category) ? body.category : 'Altro';
    if (text.length < 10) return json(res, 400, { error: 'Scrivi almeno qualche parola in più (minimo 10 caratteri).' });
    if (text.length > 1000) return json(res, 400, { error: 'Massimo 1000 caratteri.' });
    // Anonimato: si salvano solo testo, categoria, QR di provenienza e data (arrotondata al minuto). Niente IP, user-agent o cookie.
    const stamp = new Date(Math.floor(Date.now() / 60000) * 60000).toISOString();
    db.proposals.unshift({ id: newId(), text, category, qr: qr.id, place: qr.label, createdAt: stamp, status: 'nuova' });
    save();
    return json(res, 201, { ok: true });
  }

  // ----- admin -----
  if (route === 'POST /api/admin/login') {
    if (limited('l:' + clientIp(req), 8, 15 * 60e3)) return json(res, 429, { error: 'Troppi tentativi. Riprova tra 15 minuti.' });
    let body; try { body = await readBody(req, 2000); } catch { return json(res, 400, { error: 'Richiesta non valida.' }); }
    const a = crypto.createHash('sha256').update(String(body.password || '')).digest();
    const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
    if (!crypto.timingSafeEqual(a, b)) return json(res, 401, { error: 'Password errata.' });
    setCookie(res, 'admin', sign({ role: 'admin', exp: Date.now() + ADMIN_SESSION_H * 3600e3 }), ADMIN_SESSION_H * 3600);
    return json(res, 200, { ok: true });
  }
  if (route === 'POST /api/admin/logout') {
    setCookie(res, 'admin', '', 0);
    return json(res, 200, { ok: true });
  }

  if (url.pathname.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return json(res, 401, { error: 'Non autorizzato.' });
    const parts = url.pathname.split('/').filter(Boolean); // api admin <res> [id] [action]
    const [, , resource, id, action] = parts;

    if (resource === 'me') return json(res, 200, { ok: true });

    if (resource === 'settings') {
      if (req.method === 'GET') return json(res, 200, { baseUrl: db.settings.baseUrl, detected: `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}` });
      if (req.method === 'PUT') {
        const body = await readBody(req).catch(() => null);
        if (!body) return json(res, 400, { error: 'Richiesta non valida.' });
        const v = String(body.baseUrl || '').trim();
        if (v && !/^https?:\/\/[^\s/]+/i.test(v)) return json(res, 400, { error: 'Indirizzo non valido (es. https://listamira.it).' });
        db.settings.baseUrl = v.replace(/\/$/, '');
        save();
        return json(res, 200, { ok: true });
      }
    }

    if (resource === 'qrs') {
      if (req.method === 'GET' && !id) {
        const list = db.qrs.map((q) => ({ ...q, url: qrUrl(req, q), proposals: db.proposals.filter((p) => p.qr === q.id).length }));
        return json(res, 200, list);
      }
      if (req.method === 'POST' && !id) {
        const body = await readBody(req).catch(() => null);
        const label = String((body && body.label) || '').trim().slice(0, 60);
        if (!label) return json(res, 400, { error: 'Dai un nome al posto in cui metterai il QR (es. “Atrio piano terra”).' });
        const qr = { id: newId(4), code: crypto.randomBytes(16).toString('base64url'), label, createdAt: new Date().toISOString(), scans: 0, revoked: false };
        db.qrs.push(qr); save();
        return json(res, 201, { ...qr, url: qrUrl(req, qr), proposals: 0 });
      }
      const qr = db.qrs.find((q) => q.id === id);
      if (!qr) return json(res, 404, { error: 'QR non trovato.' });
      if (req.method === 'GET' && action === 'image') {
        const fmt = url.searchParams.get('format') === 'svg' ? 'svg' : 'png';
        const opts = { errorCorrectionLevel: 'H', margin: 2, color: { dark: '#2e1065', light: '#ffffff' } };
        if (fmt === 'svg') {
          const svg = await QRCode.toString(qrUrl(req, qr), { ...opts, type: 'svg' });
          res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' });
          return res.end(svg);
        }
        const png = await QRCode.toBuffer(qrUrl(req, qr), { ...opts, width: 1024 });
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
        return res.end(png);
      }
      if (req.method === 'PATCH') {
        const body = await readBody(req).catch(() => null) || {};
        if (typeof body.revoked === 'boolean') qr.revoked = body.revoked;
        if (typeof body.label === 'string' && body.label.trim()) qr.label = body.label.trim().slice(0, 60);
        save();
        return json(res, 200, { ...qr, url: qrUrl(req, qr) });
      }
      if (req.method === 'DELETE') {
        db.qrs = db.qrs.filter((q) => q.id !== id); save();
        return json(res, 200, { ok: true });
      }
    }

    if (resource === 'proposals') {
      if (req.method === 'GET' && !id) return json(res, 200, db.proposals);
      if (id === 'export.csv' && req.method === 'GET') {
        const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
        const rows = [['data', 'categoria', 'luogo', 'stato', 'proposta'].join(',')]
          .concat(db.proposals.map((p) => [p.createdAt, p.category, p.place, p.status, p.text].map(esc).join(',')));
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="proposte-mira.csv"' });
        return res.end('﻿' + rows.join('\n'));
      }
      const p = db.proposals.find((x) => x.id === id);
      if (!p) return json(res, 404, { error: 'Proposta non trovata.' });
      if (req.method === 'PATCH') {
        const body = await readBody(req).catch(() => null) || {};
        if (STATUSES.includes(body.status)) p.status = body.status;
        save();
        return json(res, 200, p);
      }
      if (req.method === 'DELETE') {
        db.proposals = db.proposals.filter((x) => x.id !== id); save();
        return json(res, 200, { ok: true });
      }
    }
  }
  return json(res, 404, { error: 'Non trovato.' });
}

const CATEGORIES = ['Aule e spazi', 'Didattica', 'Eventi e feste', 'Sport', 'Tecnologia', 'Ambiente', 'Servizi (mensa, bar, bagni)', 'Altro'];
const STATUSES = ['nuova', 'letta', 'in programma', 'realizzata', 'archiviata'];

/* ---------- server ---------- */
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; frame-ancestors 'none'");
  try {
    const url = new URL(req.url, 'http://x');
    const p = decodeURIComponent(url.pathname);

    if (p.startsWith('/api/')) return await api(req, res, url);

    // Ingresso dal QR: valida, apre la sessione proposte e porta a /proponi
    if (p.startsWith('/q/')) {
      if (limited('scan:' + clientIp(req), 60, 600e3)) { res.writeHead(429); return res.end('Troppe richieste'); }
      const qr = db.qrs.find((q) => q.code === p.slice(3));
      if (!qr || qr.revoked) {
        res.writeHead(302, { Location: '/proponi?errore=qr', 'Cache-Control': 'no-store' });
        return res.end();
      }
      qr.scans++; save();
      setCookie(res, 'qs', sign({ qr: qr.id, sid: newId(8), exp: Date.now() + PROPOSAL_SESSION_MIN * 60e3 }), PROPOSAL_SESSION_MIN * 60);
      res.writeHead(302, { Location: '/proponi', 'Cache-Control': 'no-store' });
      return res.end();
    }

    if (p === '/proponi') return serveFile(res, path.join(PUBLIC_DIR, 'proponi.html'), { 'Cache-Control': 'no-store' });
    if (p === '/admin' || p === '/admin/') return serveFile(res, path.join(PUBLIC_DIR, 'admin', 'index.html'), { 'Cache-Control': 'no-store' });
    if (p === '/') return serveFile(res, path.join(PUBLIC_DIR, 'index.html'));
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    return serveFile(res, path.join(PUBLIC_DIR, p), { 'Cache-Control': 'public, max-age=300' });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: 'Errore del server.' });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Lista Mira online su http://localhost:${PORT}`);
  console.log(`  Pannello admin:     http://localhost:${PORT}/admin`);
  if (generatedPassword) console.log(`  Password admin generata: ${ADMIN_PASSWORD}   (salvata in data/.admin-password)`);
  else console.log('  Password admin: quella in ADMIN_PASSWORD / data/.admin-password');
  console.log();
});
