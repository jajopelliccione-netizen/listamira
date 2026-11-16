'use strict';
/*
 * Mirai — Worker Cloudflare per le notifiche push (Web Push, nessuna libreria).
 *
 * Cosa fa:
 *   GET  /vapid         → chiave pubblica per iscrivere un telefono (le chiavi si creano da sole la prima volta)
 *   POST /subscribe     → salva il telefono dell'admin (serve il login admin dell'app)
 *   POST /unsubscribe   → toglie il telefono
 *   POST /test          → manda una notifica di prova (serve il login admin)
 *   POST /event         → il sito dice "QR scansionato" / "nuova proposta": il Worker controlla che il QR
 *                         esista ed sia attivo, poi manda la push a tutti i telefoni iscritti.
 *
 * Serve solo un KV chiamato MIRAI (Settings → Bindings → KV namespace, nome variabile: MIRAI).
 */
const DEFAULTS = {
  FIREBASE_API_KEY: 'AIzaSyBvz6d5x7v3cuydmv5PICWnfQOBRYfaAfs', // pubblica, la stessa di config/site.json
  FIREBASE_PROJECT_ID: 'mira-903be',
  SITE: 'https://listamirai.com',
  ALLOWED_ORIGINS: 'https://listamirai.com,https://www.listamirai.com,https://jajopelliccione-netizen.github.io',
};

const enc = new TextEncoder();
const b64u = (buf) => { let s = ''; for (const x of new Uint8Array(buf)) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); s += '='.repeat((4 - (s.length % 4)) % 4); return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); };
const concat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
const cfg = (env, k) => env[k] || DEFAULTS[k];

/* ---------- chiavi VAPID (create la prima volta e salvate nel KV) ---------- */
let vapidCache;
async function getVapid(env) {
  if (vapidCache) return vapidCache;
  let v = await env.MIRAI.get('vapid', 'json');
  if (!v) {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    v = { priv: await crypto.subtle.exportKey('jwk', kp.privateKey), pub: b64u(await crypto.subtle.exportKey('raw', kp.publicKey)) };
    await env.MIRAI.put('vapid', JSON.stringify(v));
  }
  return (vapidCache = v);
}
async function vapidHeader(env, endpoint) {
  const { priv, pub } = await getVapid(env);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: cfg(env, 'SITE') })));
  const key = await crypto.subtle.importKey('jwk', priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${pub}`;
}

/* ---------- cifratura del messaggio (RFC 8291, aes128gcm) ---------- */
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}
async function encryptPayload(sub, text) {
  const uaPub = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const secret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, kp.privateKey, 256));
  const prk = await hkdf(auth, secret, concat(enc.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, prk, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, prk, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(enc.encode(text), new Uint8Array([2]))));
  return concat(salt, new Uint8Array([0, 0, 0x10, 0]), new Uint8Array([asPub.length]), asPub, ct);
}

async function sendPush(env, sub, payload) {
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: { Authorization: await vapidHeader(env, sub.endpoint), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'high' },
    body: await encryptPayload(sub, JSON.stringify(payload)),
  });
  return res.status;
}

async function subKey(endpoint) { return 'sub:' + b64u(await crypto.subtle.digest('SHA-256', enc.encode(endpoint))); }
const validSub = (s) => s && typeof s.endpoint === 'string' && s.endpoint.startsWith('https://') && s.keys && typeof s.keys.p256dh === 'string' && typeof s.keys.auth === 'string';

async function sendAll(env, payload) {
  const { keys } = await env.MIRAI.list({ prefix: 'sub:' });
  let sent = 0;
  await Promise.all(keys.map(async ({ name }) => {
    const sub = await env.MIRAI.get(name, 'json');
    if (!sub) return;
    try {
      const st = await sendPush(env, sub, payload);
      if (st === 404 || st === 410) await env.MIRAI.delete(name); // telefono non più valido
      else if (st >= 200 && st < 300) sent++;
    } catch { /* ignora: un telefono in errore non blocca gli altri */ }
  }));
  return sent;
}

/* ---------- Firebase ---------- */
const docs = (env) => `https://firestore.googleapis.com/v1/projects/${cfg(env, 'FIREBASE_PROJECT_ID')}/databases/(default)/documents`;
const fbHeaders = (extra = {}) => ({ Referer: 'https://listamirai.com/', ...extra });

// admin = chi con il suo login riesce a ELENCARE i QR (le regole Firestore lo permettono solo all'admin)
async function isAdmin(env, req) {
  const m = /^Bearer (.+)$/.exec(req.headers.get('Authorization') || '');
  if (!m) return false;
  const r = await fetch(`${docs(env)}/qr_codes?pageSize=1&key=${cfg(env, 'FIREBASE_API_KEY')}`, { headers: fbHeaders({ Authorization: 'Bearer ' + m[1] }) });
  return r.ok;
}
async function getQr(env, code) {
  const r = await fetch(`${docs(env)}/qr_codes/${encodeURIComponent(code)}?key=${cfg(env, 'FIREBASE_API_KEY')}`, { headers: fbHeaders() });
  if (!r.ok) return null;
  const d = await r.json();
  const f = d.fields || {};
  return { label: (f.label && f.label.stringValue) || 'QR', active: !!(f.active && f.active.booleanValue) };
}

/* ---------- HTTP ---------- */
function corsFor(env, req) {
  const origin = req.headers.get('Origin');
  const ok = origin && (cfg(env, 'ALLOWED_ORIGINS').split(',').includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin));
  return ok ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', Vary: 'Origin' } : {};
}
const json = (data, status, cors) => new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json', ...cors } });
const readJson = async (req) => { try { return JSON.parse(await req.text()); } catch { return null; } };
const clean = (s, n) => String(s || '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);

// al massimo una notifica ogni 3 secondi per tipo+QR (anti-spam; usa la cache di Cloudflare, gratis)
async function throttled(type, code) {
  if (typeof caches === 'undefined') return false;
  const url = `https://throttle.invalid/${type}/${encodeURIComponent(code)}`;
  if (await caches.default.match(url)) return true;
  await caches.default.put(url, new Response('1', { headers: { 'Cache-Control': 'max-age=3' } }));
  return false;
}

export default {
  async fetch(req, env, ctx) {
    const cors = corsFor(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const path = new URL(req.url).pathname.replace(/\/+$/, '') || '/';
    const run = (p) => (ctx && ctx.waitUntil ? ctx.waitUntil(p) : p);
    try {
      if (req.method === 'GET' && path === '/') return json({ ok: true, name: 'mirai-push' }, 200, cors);
      if (req.method === 'GET' && path === '/vapid') return json({ publicKey: (await getVapid(env)).pub }, 200, cors);

      if (req.method === 'POST' && (path === '/subscribe' || path === '/unsubscribe' || path === '/test')) {
        if (!(await isAdmin(env, req))) return json({ error: 'non autorizzato' }, 403, cors);
        if (path === '/test') {
          const sent = await sendAll(env, { title: '🔔 Mirai', body: 'Le notifiche funzionano!', url: cfg(env, 'SITE') + '/admin/' });
          return json({ ok: true, sent }, 200, cors);
        }
        const b = await readJson(req);
        const sub = b && b.subscription;
        if (!validSub(sub)) return json({ error: 'iscrizione non valida' }, 400, cors);
        const key = await subKey(sub.endpoint);
        if (path === '/unsubscribe') await env.MIRAI.delete(key);
        else if (!(await env.MIRAI.get(key))) await env.MIRAI.put(key, JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }));
        return json({ ok: true }, 200, cors);
      }

      if (req.method === 'POST' && path === '/event') {
        const b = await readJson(req);
        if (!b || !['scan', 'proposal'].includes(b.type) || typeof b.code !== 'string' || !b.code || b.code.length > 100) return json({ error: 'richiesta non valida' }, 400, cors);
        const qr = await getQr(env, b.code);
        if (!qr || !qr.active) return json({ error: 'QR non valido' }, 403, cors);
        if (await throttled(b.type, b.code)) return json({ ok: true, skipped: true }, 200, cors);
        const url = cfg(env, 'SITE') + '/admin/#props';
        const payload = b.type === 'scan'
          ? { title: '📍 QR scansionato', body: qr.label, url }
          : { title: '💡 Nuova proposta', body: `${clean(b.category, 40) || 'Proposta'} — ${qr.label}`, url };
        run(sendAll(env, payload));
        return json({ ok: true }, 200, cors);
      }
      return json({ error: 'non trovato' }, 404, cors);
    } catch (e) {
      return json({ error: 'errore interno' }, 500, cors);
    }
  },
};
