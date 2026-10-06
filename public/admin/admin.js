'use strict';
const $ = (s) => document.querySelector(s);
const STATUSES = ['nuova', 'letta', 'in programma', 'realizzata', 'archiviata'];
let qrs = [], proposals = [];

async function api(path, opts = {}) {
  const r = await fetch('/api/admin/' + path, { ...opts, headers: { 'Content-Type': 'application/json' }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  if (r.status === 401) { showLogin(); throw new Error('auth'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Errore');
  return d;
}
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
  kids.flat().forEach((c) => e.append(c));
  return e;
}
const fmt = (iso) => new Date(iso).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
function flash(node, text, ok) { node.textContent = text; node.className = 'msg ' + (ok ? 'ok' : 'err'); node.hidden = false; setTimeout(() => (node.hidden = true), 4000); }

/* ---- login ---- */
function showLogin() { $('#app').hidden = true; $('#login').hidden = false; $('#pw').focus(); }
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#login-err'); err.hidden = true;
  try {
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#pw').value }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    $('#pw').value = ''; start();
  } catch (ex) { err.textContent = ex.message || 'Errore'; err.hidden = false; }
});
$('#logout').addEventListener('click', async () => { await fetch('/api/admin/logout', { method: 'POST' }); showLogin(); });

/* ---- tab ---- */
document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b));
  for (const t of ['qr', 'props', 'settings']) $('#tab-' + t).hidden = t !== b.dataset.tab;
}));

/* ---- QR ---- */
async function loadQrs() { qrs = await api('qrs'); renderQrs(); }
function renderQrs() {
  $('#qr-total').textContent = `(${qrs.length})`;
  const list = $('#qr-list');
  if (!qrs.length) { list.replaceChildren(el('div', { class: 'empty' }, 'Nessun QR ancora. Creane uno qui sopra, poi stampalo e appendilo a scuola.')); return; }
  list.replaceChildren(...qrs.map((q) => el('article', { class: 'qr-card' + (q.revoked ? ' revoked' : '') },
    el('img', { src: `/api/admin/qrs/${q.id}/image?format=png&t=${encodeURIComponent(q.url)}`, alt: `QR code: ${q.label}`, loading: 'lazy', width: 220, height: 220 }),
    el('h3', {}, q.label),
    el('span', { class: 'status-pill' }, q.revoked ? 'Disattivato' : 'Attivo'),
    el('div', { class: 'meta' }, el('span', {}, `👁 ${q.scans} scansioni`), el('span', {}, `💡 ${q.proposals} proposte`)),
    el('div', { class: 'actions' },
      el('a', { class: 'mini', href: `/api/admin/qrs/${q.id}/image?format=png`, download: `qr-${slug(q.label)}.png` }, 'PNG'),
      el('a', { class: 'mini', href: `/api/admin/qrs/${q.id}/image?format=svg`, download: `qr-${slug(q.label)}.svg` }, 'SVG'),
      el('button', { class: 'mini', onclick: () => printQrs([q]) }, 'Stampa'),
      el('button', { class: 'mini', onclick: () => toggleQr(q) }, q.revoked ? 'Riattiva' : 'Disattiva'),
      el('button', { class: 'mini danger', onclick: () => delQr(q) }, 'Elimina')))));
}
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'qr';
$('#qr-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await api('qrs', { method: 'POST', body: { label: $('#qr-label').value } }); $('#qr-label').value = ''; await loadQrs(); }
  catch (ex) { if (ex.message !== 'auth') flash($('#qr-err'), ex.message, false); }
});
async function toggleQr(q) { await api('qrs/' + q.id, { method: 'PATCH', body: { revoked: !q.revoked } }); loadQrs(); }
async function delQr(q) {
  if (!confirm(`Eliminare il QR “${q.label}”? Se è già stampato smetterà di funzionare.`)) return;
  await api('qrs/' + q.id, { method: 'DELETE' }); loadQrs();
}
function printQrs(list) {
  const area = $('#print-area');
  area.replaceChildren(...list.filter((q) => !q.revoked).map((q) => {
    const h1 = el('h1', {}, 'Hai un’idea per la ', el('em', {}, 'scuola?'));
    return el('section', { class: 'poster' },
      el('span', { class: 'kick' }, 'Lista Mira'), h1,
      el('p', {}, 'Inquadra il QR e scrivici la tua proposta. È anonima.'),
      el('img', { src: `/api/admin/qrs/${q.id}/image?format=png`, alt: '' }),
      el('div', { class: 'where' }, q.label), el('div', { class: 'foot' }, 'Guarda oltre.'));
  }));
  if (!area.children.length) return alert('Nessun QR attivo da stampare.');
  const imgs = [...area.querySelectorAll('img')];
  Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => window.print());
}
$('#print-all').addEventListener('click', () => printQrs(qrs));

/* ---- proposte ---- */
async function loadProps() { proposals = await api('proposals'); fillFilters(); renderProps(); }
function fillFilters() {
  const cats = [...new Set(proposals.map((p) => p.category))].sort();
  const fs = $('#f-status'), fc = $('#f-cat');
  const sv = fs.value, cv = fc.value;
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
    const sel = el('select', { 'aria-label': 'Stato della proposta', onchange: async (e) => { await api('proposals/' + p.id, { method: 'PATCH', body: { status: e.target.value } }); loadProps(); } },
      ...STATUSES.map((s) => { const o = el('option', { value: s }, s); if (s === p.status) o.selected = true; return o; }));
    return el('article', { class: 'p-item s-' + p.status },
      el('div', { class: 'p-top' }, el('span', { class: 'tag' }, p.category), el('span', { class: 'tag place' }, '📍 ' + p.place), el('span', {}, fmt(p.createdAt))),
      el('p', {}, p.text),
      el('div', { class: 'p-actions' }, sel, el('button', { class: 'mini danger', onclick: async () => { if (confirm('Eliminare questa proposta?')) { await api('proposals/' + p.id, { method: 'DELETE' }); loadProps(); } } }, 'Elimina')));
  }));
}
$('#f-status').addEventListener('change', renderProps);
$('#f-cat').addEventListener('change', renderProps);

/* ---- impostazioni ---- */
async function loadSettings() {
  const s = await api('settings');
  $('#base').value = s.baseUrl;
  $('#detected').textContent = `Indirizzo rilevato ora: ${s.detected}${s.baseUrl ? '' : ' (usato finché non ne imposti uno)'}`;
}
$('#set-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await api('settings', { method: 'PUT', body: { baseUrl: $('#base').value } }); flash($('#set-msg'), 'Salvato. I QR ora usano il nuovo indirizzo.', true); loadQrs(); }
  catch (ex) { if (ex.message !== 'auth') flash($('#set-msg'), ex.message, false); }
});

async function start() {
  try { await api('me'); } catch { return; }
  $('#login').hidden = true; $('#app').hidden = false;
  await Promise.all([loadQrs(), loadProps(), loadSettings()]);
}
start();
