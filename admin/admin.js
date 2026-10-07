'use strict';
const $ = (s) => document.querySelector(s);
const { el } = Core;
const STATUSES = ['nuova', 'letta', 'in programma', 'realizzata', 'archiviata'];
const TOKEN_KEY = 'mira-admin';
let cfg, token = null, qrs = [], proposals = [];

/* ---- sessione admin (Firebase Auth, solo per questa scheda) ---- */
const saved = () => { try { return JSON.parse(sessionStorage.getItem(TOKEN_KEY)); } catch { return null; } };
const persist = (s) => { try { s ? sessionStorage.setItem(TOKEN_KEY, JSON.stringify(s)) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignora */ } };

async function db(fn) {
  try { return await fn(token); }
  catch (e) {
    if (e.status === 401) { showLogin(); throw new Error('auth'); }
    if (e.status === 403) throw new Error('Permesso negato: controlla che l’email in firestore.rules sia quella dell’admin e che le regole siano pubblicate.');
    throw e;
  }
}
function showLogin() { token = null; persist(null); $('#app').hidden = true; $('#login').hidden = false; $('#em').focus(); }

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#login-err'); err.hidden = true;
  try {
    const d = await Core.signIn(cfg, $('#em').value.trim(), $('#pw').value);
    $('#pw').value = '';
    persist({ token: d.idToken, exp: Date.now() + (Number(d.expiresIn) - 60) * 1000 });
    start();
  } catch { err.textContent = 'Email o password errata.'; err.hidden = false; }
});
$('#logout').addEventListener('click', showLogin);

/* ---- tab ---- */
document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b));
  for (const t of ['qr', 'props']) $('#tab-' + t).hidden = t !== b.dataset.tab;
}));

function flash(node, text, ok) { node.textContent = text; node.className = 'msg ' + (ok ? 'ok' : 'err'); node.hidden = false; setTimeout(() => (node.hidden = true), 4000); }
const fmt = (iso) => new Date(iso).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'qr';

/* ---- generazione QR (tutto nel browser) ---- */
const siteBase = () => new URL('../proponi.html', location.href).href; // indirizzo reale del sito, anche su GitHub Pages
const qrLink = (q) => `${siteBase()}?c=${q.id}`;
const newCode = () => [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
function qrMatrix(text) { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q; }
function qrPng(text, size = 1024) {
  const q = qrMatrix(text), n = q.getModuleCount(), quiet = 4, cell = Math.floor(size / (n + quiet * 2));
  const px = cell * (n + quiet * 2);
  const c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, px, px); g.fillStyle = '#2e1065';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + quiet) * cell, (r + quiet) * cell, cell, cell);
  return c.toDataURL('image/png');
}
function qrSvg(text) {
  const q = qrMatrix(text), n = q.getModuleCount(), quiet = 4, s = n + quiet * 2;
  let d = '';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) d += `M${k + quiet},${r + quiet}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges"><rect width="${s}" height="${s}" fill="#fff"/><path d="${d}" fill="#2e1065"/></svg>`;
}
function download(name, href) { const a = el('a', { href, download: name }); document.body.append(a); a.click(); a.remove(); }
const blobUrl = (text, type) => URL.createObjectURL(new Blob([text], { type }));

/* ---- QR ---- */
async function loadQrs() { qrs = (await db((t) => Core.fs.list(cfg, 'qr_codes', t))).sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || '')); renderQrs(); }
function renderQrs() {
  $('#qr-total').textContent = `(${qrs.length})`;
  $('#qr-base').textContent = `I QR puntano a: ${siteBase()}`;
  const list = $('#qr-list');
  if (!qrs.length) { list.replaceChildren(el('div', { class: 'empty' }, 'Nessun QR ancora. Creane uno qui sopra, poi stampalo e appendilo a scuola.')); return; }
  list.replaceChildren(...qrs.map((q) => {
    const count = proposals.filter((p) => p.qr === q.id).length;
    return el('article', { class: 'qr-card' + (q.active ? '' : ' revoked') },
      el('img', { src: qrPng(qrLink(q), 512), alt: `QR code: ${q.label}`, width: 220, height: 220 }),
      el('h3', {}, q.label),
      el('span', { class: 'status-pill' }, q.active ? 'Attivo' : 'Disattivato'),
      el('div', { class: 'meta' }, el('span', {}, `👁 ${q.scans} scansioni`), el('span', {}, `💡 ${count} proposte`)),
      el('div', { class: 'actions' },
        el('button', { class: 'mini', onclick: () => download(`qr-${slug(q.label)}.png`, qrPng(qrLink(q))) }, 'PNG'),
        el('button', { class: 'mini', onclick: () => download(`qr-${slug(q.label)}.svg`, blobUrl(qrSvg(qrLink(q)), 'image/svg+xml')) }, 'SVG'),
        el('button', { class: 'mini', onclick: () => printQrs([q]) }, 'Stampa'),
        el('button', { class: 'mini', onclick: () => toggleQr(q) }, q.active ? 'Disattiva' : 'Riattiva'),
        el('button', { class: 'mini danger', onclick: () => delQr(q) }, 'Elimina')));
  }));
}
$('#qr-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await db((t) => Core.fs.create(cfg, 'qr_codes', { label: $('#qr-label').value.trim().slice(0, 60), active: true, scans: 0, createdAt: new Date() }, { id: newCode(), token: t })); $('#qr-label').value = ''; await loadQrs(); }
  catch (ex) { if (ex.message !== 'auth') flash($('#qr-err'), 'Non sono riuscito a creare il QR: ' + ex.message, false); }
});
async function toggleQr(q) { await db((t) => Core.fs.update(cfg, 'qr_codes', q.id, { active: !q.active }, t)); loadQrs(); }
async function delQr(q) {
  if (!confirm(`Eliminare il QR “${q.label}”? Se è già stampato smetterà di funzionare.`)) return;
  await db((t) => Core.fs.remove(cfg, 'qr_codes', q.id, t)); loadQrs();
}
function printQrs(list) {
  const area = $('#print-area');
  area.replaceChildren(...list.filter((q) => q.active).map((q) => el('section', { class: 'poster' },
    el('img', { class: 'p-logo', src: '../assets/logo.png', alt: '' }), el('span', { class: 'kick' }, 'Lista Mirai'),
    el('h1', {}, 'Hai un’idea per la ', el('em', {}, 'scuola?')),
    el('p', {}, 'Inquadra il QR e scrivici la tua proposta. È anonima.'),
    el('img', { src: qrPng(qrLink(q)), alt: '' }),
    el('div', { class: 'where' }, q.label), el('div', { class: 'foot' }, 'Il futuro inizia da noi.'))));
  if (!area.children.length) return alert('Nessun QR attivo da stampare.');
  setTimeout(() => window.print(), 150);
}
$('#print-all').addEventListener('click', () => printQrs(qrs));

/* ---- proposte ---- */
async function loadProps() { proposals = (await db((t) => Core.fs.list(cfg, 'proposals', t))).sort((x, y) => y.createTime.localeCompare(x.createTime)); fillFilters(); renderProps(); }
function fillFilters() {
  const cats = [...new Set(proposals.map((p) => p.category))].sort();
  const fs = $('#f-status'), fc = $('#f-cat'), sv = fs.value, cv = fc.value;
  fs.replaceChildren(el('option', { value: '' }, 'Tutti gli stati'), ...STATUSES.map((s) => el('option', { value: s }, s)));
  fc.replaceChildren(el('option', { value: '' }, 'Tutte le categorie'), ...cats.map((c) => el('option', { value: c }, c)));
  fs.value = sv; fc.value = cv;
}
function renderProps() {
  const fs = $('#f-status').value, fc = $('#f-cat').value;
  const shown = proposals.filter((p) => (!fs || p.status === fs) && (!fc || p.category === fc));
  const nuove = proposals.filter((p) => p.status === 'nuova').length;
  $('#p-total').textContent = `(${shown.length})`;
  const b = $('#new-count'); b.hidden = !nuove; b.textContent = nuove;
  const list = $('#p-list');
  if (!shown.length) { list.replaceChildren(el('div', { class: 'empty' }, proposals.length ? 'Nessuna proposta con questi filtri.' : 'Ancora nessuna proposta. Appena qualcuno scansionerà un QR e scriverà, la vedrai qui.')); return; }
  list.replaceChildren(...shown.map((p) => {
    const sel = el('select', { 'aria-label': 'Stato della proposta', onchange: async (e) => { await db((t) => Core.fs.update(cfg, 'proposals', p.id, { status: e.target.value }, t)); loadProps(); } },
      ...STATUSES.map((s) => { const o = el('option', { value: s }, s); if (s === p.status) o.selected = true; return o; }));
    return el('article', { class: 'p-item s-' + p.status },
      el('div', { class: 'p-top' }, el('span', { class: 'tag' }, p.category), el('span', { class: 'tag place' }, '📍 ' + p.place), el('span', {}, fmt(p.createTime))),
      el('p', {}, p.text),
      el('div', { class: 'p-actions' }, sel, el('button', { class: 'mini danger', onclick: async () => { if (confirm('Eliminare questa proposta?')) { await db((t) => Core.fs.remove(cfg, 'proposals', p.id, t)); loadProps(); } } }, 'Elimina')));
  }));
}
$('#f-status').addEventListener('change', renderProps);
$('#f-cat').addEventListener('change', renderProps);
$('#csv').addEventListener('click', () => {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [['data', 'categoria', 'luogo', 'stato', 'proposta'].join(',')].concat(proposals.map((p) => [p.createTime, p.category, p.place, p.status, p.text].map(esc).join(',')));
  download('proposte-mira.csv', blobUrl('﻿' + rows.join('\n'), 'text/csv;charset=utf-8'));
});

async function start() {
  const s = saved();
  if (!s || s.exp < Date.now()) return showLogin();
  token = s.token;
  $('#login').hidden = true; $('#app').hidden = false;
  try { await loadProps(); await loadQrs(); } catch (e) { if (e.message !== 'auth') flash($('#qr-err'), 'Errore nel caricamento: ' + e.message, false); }
}

(async () => {
  cfg = await Core.config();
  if (!Core.configured(cfg)) {
    $('#login').hidden = false; $('#login-form button').disabled = true;
    const s = $('#setup'); s.hidden = false;
    s.textContent = 'Il database non è ancora collegato: inserisci apiKey e projectId di Firebase in config/site.json (vedi README).';
    return;
  }
  start();
})();
