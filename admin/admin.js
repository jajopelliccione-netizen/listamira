'use strict';
const $ = (s) => document.querySelector(s);
const { el } = Core;
const STATUSES = ['nuova', 'letta', 'in programma', 'realizzata', 'archiviata'];
const TOKEN_KEY = 'mira-admin';
let cfg, token = null, qrs = [], proposals = [];

/* ---- sessione admin (Firebase Auth, solo per questa scheda) ---- */
const tokenEmail = () => { try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email || ''; } catch { return ''; } };
const saved = () => { for (const st of [localStorage, sessionStorage]) { try { const v = JSON.parse(st.getItem(TOKEN_KEY)); if (v) return v; } catch { /* ignora */ } } return null; };
// "Resta connesso" (default) = salvato su questo dispositivo; altrimenti vale solo finché la scheda resta aperta
const persist = (v) => {
  for (const st of [localStorage, sessionStorage]) { try { st.removeItem(TOKEN_KEY); } catch { /* ignora */ } }
  if (v) { try { (v.remember === false ? sessionStorage : localStorage).setItem(TOKEN_KEY, JSON.stringify(v)); } catch { /* ignora */ } }
};
const authErr = () => Object.assign(new Error('auth'), { status: 401 });
// token valido (lo rinnova da solo con il refresh token quando sta per scadere)
async function freshToken() {
  let v = saved();
  if (!v) throw authErr();
  if (v.exp < Date.now() + 60000) {
    if (!v.refresh) throw authErr();
    const d = await Core.refreshToken(cfg, v.refresh);
    v = { token: d.id_token, refresh: d.refresh_token, remember: v.remember, exp: Date.now() + (Number(d.expires_in) - 60) * 1000 };
    persist(v);
  }
  return (token = v.token);
}

async function db(fn) {
  try { return await fn(await freshToken()); }
  catch (e) {
    if (e.status === 401) { showLogin(); throw new Error('auth'); }
    if (e.status === 403) throw new Error('Permesso negato. Sei entrato come “' + (tokenEmail() || '?') + '”: nelle regole di Firestore deve esserci ESATTAMENTE questa email (tutta minuscola) alla riga request.auth.token.email == \'…\', poi premi Pubblica.');
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
    persist({ token: d.idToken, refresh: d.refreshToken, remember: $('#remember').checked, exp: Date.now() + (Number(d.expiresIn) - 60) * 1000 });
    start();
  } catch { err.textContent = 'Email o password errata.'; err.hidden = false; }
});
$('#logout').addEventListener('click', showLogin);

/* ---- tab ---- */
document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b));
  for (const t of ['qr', 'scan', 'stats', 'props']) $('#tab-' + t).hidden = t !== b.dataset.tab;
  if (b.dataset.tab !== 'scan') stopScan();
  if (b.dataset.tab === 'stats') renderStats();
}));

function flash(node, text, ok, ms = 4000) { node.textContent = text; node.className = 'msg ' + (ok ? 'ok' : 'err'); node.hidden = false; clearTimeout(node._t); if (ms) node._t = setTimeout(() => (node.hidden = true), ms); }
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
// QR in anteprima come SVG: resta nitido a qualsiasi dimensione (il PNG ridimensionato risultava sfocato)
const svgUri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
function download(name, href) { const a = el('a', { href, download: name }); document.body.append(a); a.click(); a.remove(); }
const blobUrl = (text, type) => URL.createObjectURL(new Blob([text], { type }));

/* ---- zone (gruppi di QR) ---- */
const NOGROUP = 'Senza zona';
const groupOf = (q) => (q && q.group && q.group.trim()) || NOGROUP;
const groupNames = () => [...new Set(qrs.map(groupOf))].sort((x, y) => (x === NOGROUP) - (y === NOGROUP) || x.localeCompare(y, 'it', { numeric: true }));
function refreshGroupUi() {
  const names = groupNames();
  $('#group-list').replaceChildren(...names.filter((n) => n !== NOGROUP).map((n) => el('option', { value: n })));
  const f = $('#qr-filter'), cur = f.value;
  f.replaceChildren(el('option', { value: '' }, 'Tutte le zone'), ...names.map((n) => el('option', { value: n }, n)));
  f.value = names.includes(cur) ? cur : '';
}
$('#qr-filter').addEventListener('change', renderQrs);

/* ---- QR ---- */
async function loadQrs() { qrs = (await db((t) => Core.fs.list(cfg, 'qr_codes', t))).sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || '')); refreshGroupUi(); renderQrs(); }
function renderQrs() {
  $('#qr-total').textContent = `(${qrs.length})`;
  $('#qr-base').textContent = `I QR puntano a: ${siteBase()}`;
  const list = $('#qr-list');
  const only = $('#qr-filter').value;
  const shownQrs = only ? qrs.filter((q) => groupOf(q) === only) : qrs;
  if (!qrs.length) { list.replaceChildren(el('div', { class: 'empty' }, 'Nessun QR ancora. Creane uno qui sopra, poi stampalo e appendilo a scuola.')); return; }
  list.replaceChildren(...shownQrs.map((q) => {
    const count = proposals.filter((p) => p.qr === q.id).length;
    return el('article', { class: 'qr-card' + (q.active ? '' : ' revoked') },
      el('img', { class: 'qr-img', src: svgUri(qrSvg(qrLink(q))), alt: `QR code: ${q.label}`, width: 240, height: 240 }),
      el('h3', {}, q.label),
      el('div', { class: 'row-tags' }, el('span', { class: 'zone-tag' }, '📍 ' + groupOf(q)), el('span', { class: 'status-pill' }, q.active ? 'Attivo' : 'Disattivato')),
      el('div', { class: 'meta' }, el('span', {}, `👁 ${q.scans} scansioni`), el('span', {}, `💡 ${count} proposte`)),
      el('div', { class: 'actions' },
        el('button', { class: 'mini primary', onclick: (e) => run(e, () => sheetPdf([q])) }, '⬇ Foglio A4 (PDF)'),
        el('button', { class: 'mini', onclick: (e) => run(e, () => sheetPng(q)) }, 'A4 PNG'),
        el('button', { class: 'mini', onclick: () => download(`qr-${slug(q.label)}.png`, qrPng(qrLink(q))) }, 'Solo QR'),
        el('button', { class: 'mini', onclick: () => download(`qr-${slug(q.label)}.svg`, blobUrl(qrSvg(qrLink(q)), 'image/svg+xml')) }, 'SVG'),
        el('button', { class: 'mini', onclick: (e) => run(e, () => printQrs([q])) }, 'Stampa'),
        el('button', { class: 'mini', onclick: () => moveQr(q) }, 'Cambia zona'),
        el('button', { class: 'mini', onclick: () => toggleQr(q) }, q.active ? 'Disattiva' : 'Riattiva'),
        el('button', { class: 'mini danger', onclick: () => delQr(q) }, 'Elimina')));
  }));
}
$('#qr-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await db((t) => Core.fs.create(cfg, 'qr_codes', { label: $('#qr-label').value.trim().slice(0, 60), group: $('#qr-group').value.trim().slice(0, 40), active: true, scans: 0, createdAt: new Date() }, { id: newCode(), token: t })); $('#qr-label').value = ''; await loadQrs(); $('#qr-label').focus(); }
  catch (ex) { if (ex.message !== 'auth') flash($('#qr-err'), 'Non sono riuscito a creare il QR: ' + ex.message, false); }
});
async function moveQr(q) {
  const v = prompt('In che zona si trova “' + q.label + '”?\nEsempi: Piano terra, Primo piano, Secondo piano, Cortile.\nLasciando vuoto resta “' + NOGROUP + '”.', q.group || '');
  if (v === null) return;
  await db((t) => Core.fs.update(cfg, 'qr_codes', q.id, { group: v.trim().slice(0, 40) }, t)); loadQrs();
}
async function toggleQr(q) { await db((t) => Core.fs.update(cfg, 'qr_codes', q.id, { active: !q.active }, t)); loadQrs(); }
async function delQr(q) {
  if (!confirm(`Eliminare il QR “${q.label}”? Se è già stampato smetterà di funzionare.`)) return;
  await db((t) => Core.fs.remove(cfg, 'qr_codes', q.id, t)); loadQrs();
}
/* ---- foglio A4 con grafica ---- */
const sheetCanvas = (q) => Sheet.render(qrMatrix(qrLink(q)), (q.group ? q.group + ' · ' : '') + q.label, siteBase());
async function run(e, fn) { // disattiva il pulsante mentre lavora
  const b = e.currentTarget, t = b.textContent; b.disabled = true; b.textContent = '…';
  try { await fn(); } catch (ex) { alert('Non sono riuscito a creare il foglio: ' + ex.message); } finally { b.disabled = false; b.textContent = t; }
}
async function sheetPng(q) { download(`foglio-a4-${slug(q.label)}.png`, URL.createObjectURL(await Sheet.toBlob(await sheetCanvas(q)))); }
async function sheetPdf(list) {
  const act = list.filter((q) => q.active);
  if (!act.length) return alert('Nessun QR attivo da scaricare.');
  const blob = await Sheet.pdf(await Promise.all(act.map(sheetCanvas)));
  download(act.length === 1 ? `foglio-a4-${slug(act[0].label)}.pdf` : 'fogli-a4-mirai.pdf', URL.createObjectURL(blob));
}
async function printQrs(list) {
  const act = list.filter((q) => q.active);
  if (!act.length) return alert('Nessun QR attivo da stampare.');
  const urls = await Promise.all(act.map(async (q) => (await sheetCanvas(q)).toDataURL('image/jpeg', 0.92)));
  $('#print-area').replaceChildren(...urls.map((u) => el('img', { class: 'sheet', src: u, alt: '' })));
  await Promise.all([...document.querySelectorAll('#print-area img')].map((i) => i.decode().catch(() => {})));
  window.print();
}
$('#print-all').addEventListener('click', (e) => run(e, () => printQrs(qrs)));
$('#pdf-all').addEventListener('click', (e) => run(e, () => sheetPdf(qrs)));

/* ---- proposte ---- */
async function loadProps() { proposals = (await db((t) => Core.fs.list(cfg, 'proposals', t))).sort((x, y) => y.createTime.localeCompare(x.createTime)); fillFilters(); renderProps(); if (!$('#tab-stats').hidden) renderStats(); }
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
  const rows = [['data', 'categoria', 'zona', 'luogo', 'stato', 'proposta'].join(',')].concat(proposals.map((p) => [p.createTime, p.category, groupOf(qrs.find((q) => q.id === p.qr)), p.place, p.status, p.text].map(esc).join(',')));
  download('proposte-mira.csv', blobUrl('﻿' + rows.join('\n'), 'text/csv;charset=utf-8'));
});

/* ---- statistiche ---- */
const dayKey = (iso) => { const d = new Date(iso); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function bars(rows, { max, unit = '' } = {}) {
  const m = max || Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return el('div', { class: 'empty' }, 'Ancora nessun dato.');
  return el('div', { class: 'chart' }, rows.map((r) => el('div', { class: 'bar-row' },
    el('span', { class: 'bar-l' }, r.label),
    el('span', { class: 'bar-t' }, el('i', { style: 'width:' + Math.max(r.value ? 3 : 0, (r.value / m) * 100) + '%' })),
    el('b', { class: 'bar-v' }, r.value + unit))));
}
function renderStats() {
  const days = +$('#st-range').value;
  const since = days ? Date.now() - days * 86400e3 : 0;
  const props = proposals.filter((p) => new Date(p.createTime).getTime() >= since);
  const byQr = new Map(qrs.map((q) => [q.id, q]));
  const totScans = qrs.reduce((s, q) => s + (q.scans || 0), 0);
  $('#st-kpi').replaceChildren(
    ...[['QR attivi', qrs.filter((q) => q.active).length + '/' + qrs.length], ['Scansioni (totali)', totScans], ['Proposte' + (days ? ' (periodo)' : ''), props.length],
      ['Idee ogni 100 scansioni', totScans ? Math.round((proposals.length / totScans) * 100) : 0]]
      .map(([l, v]) => el('div', { class: 'kpi-c' }, el('b', {}, String(v)), el('span', {}, l))));
  // per zona
  const groups = new Map();
  const ensure = (g) => { if (!groups.has(g)) groups.set(g, { name: g, scans: 0, props: 0, qrs: [] }); return groups.get(g); };
  for (const q of qrs) { const o = ensure(groupOf(q)); o.scans += q.scans || 0; o.qrs.push(q); }
  for (const p of props) ensure(groupOf(byQr.get(p.qr))).props++;
  const list = [...groups.values()].sort((x, y) => y.props - x.props || y.scans - x.scans);
  const mProps = Math.max(1, ...list.map((g) => g.props));
  const per = (q) => props.filter((p) => p.qr === q.id).length;
  $('#st-groups').replaceChildren(...(list.length ? list.map((g) => el('details', { class: 'grp' },
    el('summary', {}, el('span', { class: 'g-name' }, '📍 ' + g.name), el('span', { class: 'g-n' }, '👁 ' + g.scans), el('span', { class: 'g-n' }, '💡 ' + g.props),
      el('span', { class: 'g-n muted' }, g.scans ? Math.round((g.props / g.scans) * 100) + '%' : '–')),
    bars(g.qrs.slice().sort((x, y) => per(y) - per(x)).map((q) => ({ label: q.label + (q.active ? '' : ' (off)'), value: per(q) })), { max: mProps, unit: ' idee' }),
    el('div', { class: 'sub-list' }, g.qrs.map((q) => el('span', {}, q.label + ': ' + (q.scans || 0) + ' scansioni')))))
    : [el('div', { class: 'empty' }, 'Crea dei QR per vedere le statistiche.')]));
  // per categoria
  const cats = new Map(); props.forEach((p) => cats.set(p.category, (cats.get(p.category) || 0) + 1));
  $('#st-cats').replaceChildren(bars([...cats].sort((x, y) => y[1] - x[1]).map(([label, value]) => ({ label, value }))));
  // per giorno (ultimi 14 giorni, o il periodo scelto)
  const n = Math.min(days || 14, 14), rows = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 86400e3); rows.push({ key: dayKey(d), label: d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }), value: 0 }); }
  proposals.forEach((p) => { const r = rows.find((x) => x.key === dayKey(p.createTime)); if (r) r.value++; });
  $('#st-days').replaceChildren(bars(rows));
}
$('#st-range').addEventListener('change', renderStats);

/* ---- azzera le scansioni (con conferma scritta, per non farlo per sbaglio) ---- */
$('#reset-stats').addEventListener('click', async (e) => {
  const btn = e.currentTarget, msg = $('#reset-msg');
  const tot = qrs.reduce((n, q) => n + (q.scans || 0), 0);
  if (!tot) return flash(msg, 'Le scansioni sono già a zero.', true);
  const v = prompt(`Stai per azzerare le scansioni di tutti i QR (${tot} in totale, su ${qrs.length} QR).\nLe proposte NON vengono toccate e i QR restano attivi.\nNon si può annullare.\n\nPer confermare scrivi AZZERA:`);
  if (v === null) return;
  if (v.trim().toUpperCase() !== 'AZZERA') return flash(msg, 'Non ho azzerato niente: non hai scritto AZZERA.', false, 8000);
  btn.disabled = true;
  try {
    for (const q of qrs.filter((x) => x.scans)) await db((t) => Core.fs.update(cfg, 'qr_codes', q.id, { scans: 0 }, t));
    await loadQrs(); renderStats();
    flash(msg, 'Fatto: scansioni azzerate.', true, 6000);
  } catch (ex) { if (ex.message !== 'auth') { await loadQrs().catch(() => {}); renderStats(); flash(msg, 'Non sono riuscito ad azzerare tutto: ' + ex.message, false, 0); } }
  finally { btn.disabled = false; }
});


/* ---- trova zona: scansione continua di tanti QR, uno dopo l'altro ---- */
const scan = { stream: null, raf: 0, last: 0, detector: null, busy: false, lastCode: null, lastAt: 0, hist: [], audio: null };
function parseCode(text) {
  const t = String(text || '').trim();
  try { const c = new URL(t).searchParams.get('c'); if (c) return c.trim(); } catch { /* non è un link */ }
  return /^[0-9a-f]{32}$/i.test(t) ? t.toLowerCase() : null;
}
function beep(ok) {
  try {
    if (navigator.vibrate) navigator.vibrate(ok ? 70 : [70, 60, 70]);
    const ctx = scan.audio || (scan.audio = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination);
    o.frequency.value = ok ? 880 : 240; g.gain.value = 0.08; o.start(); o.stop(ctx.currentTime + (ok ? 0.09 : 0.25));
  } catch { /* audio non disponibile */ }
}
function stopScan() {
  cancelAnimationFrame(scan.raf);
  if (scan.stream) scan.stream.getTracks().forEach((t) => t.stop());
  scan.stream = null; $('#scan-video').srcObject = null;
  $('#scan-box').hidden = true; $('#scan-start').hidden = false; $('#scan-stop').hidden = true;
}
async function startScan() {
  stopScan(); $('#scan-err').hidden = true;
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return flash($('#scan-err'), 'Questo browser non permette di usare la fotocamera. Apri l’admin da Safari o Chrome sul telefono, oppure incolla qui sotto il link del QR.', false);
  try { scan.audio = scan.audio || new (window.AudioContext || window.webkitAudioContext)(); if (scan.audio.resume) scan.audio.resume(); } catch { /* ok senza suoni */ }
  $('#scan-start').disabled = true; $('#scan-start').textContent = 'Carico i dati…';
  try { await loadProps(); await loadQrs(); } catch (ex) { $('#scan-start').disabled = false; $('#scan-start').textContent = '📷 Apri la fotocamera'; if (ex.message !== 'auth') flash($('#scan-err'), 'Non riesco a leggere i dati: ' + ex.message, false); return; }
  $('#scan-start').disabled = false; $('#scan-start').textContent = '📷 Apri la fotocamera';
  try { scan.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false }); }
  catch { return flash($('#scan-err'), 'Non riesco ad aprire la fotocamera: consenti l’accesso alla fotocamera per questo sito e riprova.', false); }
  const v = $('#scan-video'); v.srcObject = scan.stream;
  $('#scan-box').hidden = false; $('#scan-start').hidden = true; $('#scan-stop').hidden = false;
  scan.lastCode = null; scan.lastAt = 0;
  try { await v.play(); } catch { /* parte da sola */ }
  scan.detector = null;
  if ('BarcodeDetector' in window) { try { scan.detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch { scan.detector = null; } }
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  const tick = async (ts) => {
    if (!scan.stream) return;
    scan.raf = requestAnimationFrame(tick);
    if (ts - scan.last < 110 || scan.busy || v.readyState < 2 || !v.videoWidth) return;
    scan.last = ts; scan.busy = true;
    try {
      let text = null;
      if (scan.detector) { try { const r = await scan.detector.detect(v); if (r[0]) text = r[0].rawValue; } catch { scan.detector = null; } }
      if (!text && !scan.detector) {
        const k = Math.min(1, 640 / v.videoWidth); cv.width = Math.round(v.videoWidth * k); cv.height = Math.round(v.videoHeight * k);
        cx.drawImage(v, 0, 0, cv.width, cv.height);
        const r = jsQR(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, { inversionAttempts: 'dontInvert' });
        if (r) text = r.data;
      }
      if (text) quickScan(text); // la fotocamera resta accesa: si passa subito al QR successivo
    } catch { /* frame illeggibile: riprova */ } finally { scan.busy = false; }
  };
  scan.raf = requestAnimationFrame(tick);
}
$('#scan-start').addEventListener('click', startScan);
$('#scan-stop').addEventListener('click', stopScan);
$('#scan-manual').addEventListener('submit', (e) => { e.preventDefault(); const t = $('#scan-text').value; $('#scan-text').value = ''; quickScan(t, true); });

/* risposta immediata sopra la fotocamera, senza finestre da chiudere */
function quickScan(text, force) {
  const code = parseCode(text), now = Date.now();
  const key = code || 'x:' + String(text).slice(0, 40);
  if (!force && scan.lastCode === key && now - scan.lastAt < 2500) { scan.lastAt = now; return; } // stesso QR ancora inquadrato
  scan.lastCode = key; scan.lastAt = now;
  const q = code && qrs.find((x) => x.id === code);
  const pop = $('#scan-pop');
  const rec = { code, at: now, ok: !!q, zone: q ? groupOf(q) : '', label: q ? q.label : (code ? 'QR non riconosciuto' : 'Non è un QR di Mirai'), active: q ? q.active : false };
  scan.hist.unshift(rec); scan.hist = scan.hist.slice(0, 40); renderHist();
  beep(!!q);
  const mine = q ? proposals.filter((p) => p.qr === q.id).length : 0;
  pop.className = 'scan-pop ' + (q ? (q.active ? 'good' : 'off') : 'bad');
  pop.replaceChildren(...(q
    ? [el('span', { class: 'sp-zone' }, '📍 ' + rec.zone), el('b', { class: 'sp-label' }, q.label),
       el('span', { class: 'sp-meta' }, `👁 ${q.scans || 0} scansioni · 💡 ${mine} proposte` + (q.active ? '' : ' · DISATTIVATO'))]
    : [el('b', { class: 'sp-label' }, rec.label), el('span', { class: 'sp-meta' }, code ? 'Eliminato o di un altro database' : String(text).slice(0, 60))]));
  pop.classList.remove('flash'); void pop.offsetWidth; pop.classList.add('flash');
  if (force && code) showScan(code); // dal campo manuale mostra subito anche la scheda completa
}
const hhmm = (t) => new Date(t).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
function renderHist() {
  const box = $('#scan-hist');
  $('#scan-count').textContent = scan.hist.length ? `(${scan.hist.length})` : '';
  box.replaceChildren(...scan.hist.map((r) => el('button', { type: 'button', class: 'hist-row' + (r.ok ? (r.active ? '' : ' off') : ' bad'), onclick: () => r.code && showScan(r.code) },
    el('span', { class: 'h-z' }, r.ok ? r.zone : '⚠'), el('b', { class: 'h-l' }, r.label), el('span', { class: 'h-t' }, hhmm(r.at)))));
  $('#scan-hist-wrap').hidden = !scan.hist.length;
}
$('#scan-clear').addEventListener('click', () => { scan.hist = []; renderHist(); $('#scan-pop').className = 'scan-pop'; $('#scan-pop').replaceChildren(el('span', { class: 'sp-meta' }, 'Inquadra un QR…')); });

/* scheda completa con tutte le statistiche (si apre solo se la tocchi) */
async function showScan(text) {
  const out = $('#scan-result');
  const again = el('button', { class: 'btn btn-primary', type: 'button', onclick: () => { out.replaceChildren(); $('#tab-scan').scrollIntoView({ behavior: 'smooth' }); if (!scan.stream) startScan(); } }, '📷 Torna alla scansione');
  const code = parseCode(text);
  if (!code) { out.replaceChildren(el('div', { class: 'panel scan-card bad' }, el('h3', {}, 'Questo non è un QR di Mirai'), el('p', { class: 'hint' }, 'Ho letto: ' + String(text).slice(0, 140)), again)); return; }
  out.replaceChildren(el('div', { class: 'empty' }, 'Cerco il QR…'));
  try { await loadProps(); await loadQrs(); } catch (ex) { if (ex.message !== 'auth') out.replaceChildren(el('div', { class: 'msg err' }, 'Non riesco a leggere i dati: ' + ex.message)); return; }
  const q = qrs.find((x) => x.id === code);
  if (!q) { out.replaceChildren(el('div', { class: 'panel scan-card bad' }, el('h3', {}, 'QR non riconosciuto'), el('p', { class: 'hint' }, 'È un QR di Mirai ma non è più nel database: è stato eliminato oppure appartiene a un altro progetto.'), again)); return; }

  const mine = proposals.filter((p) => p.qr === q.id); // già ordinate dalla più recente
  const zone = groupOf(q), inZone = qrs.filter((x) => groupOf(x) === zone);
  const zScans = inZone.reduce((s, x) => s + (x.scans || 0), 0), zProps = proposals.filter((p) => inZone.some((x) => x.id === p.qr)).length;
  const totScans = qrs.reduce((s, x) => s + (x.scans || 0), 0);
  const rankScans = qrs.slice().sort((a, b) => (b.scans || 0) - (a.scans || 0)).findIndex((x) => x.id === q.id) + 1;
  const rankProps = qrs.slice().sort((a, b) => proposals.filter((p) => p.qr === b.id).length - proposals.filter((p) => p.qr === a.id).length).findIndex((x) => x.id === q.id) + 1;
  const kpi = (v, l) => el('div', { class: 'kpi-c' }, el('b', {}, String(v)), el('span', {}, l));
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 86400e3); days.push({ key: dayKey(d), label: d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }), value: 0 }); }
  mine.forEach((p) => { const r = days.find((x) => x.key === dayKey(p.createTime)); if (r) r.value++; });
  const reload = async () => { await loadQrs(); showScan(q.id); };

  out.replaceChildren(
    el('div', { class: 'panel scan-card ' + (q.active ? 'good' : 'off') },
      el('div', { class: 'scan-zone' }, el('span', {}, '📍 Zona'), el('b', {}, zone)),
      el('h3', { class: 'scan-label' }, q.label),
      el('div', { class: 'row-tags' }, el('span', { class: 'status-pill' }, q.active ? 'Attivo' : 'Disattivato'), q.createdAt ? el('span', { class: 'zone-tag' }, 'Creato il ' + fmt(q.createdAt)) : ''),
      el('div', { class: 'kpi', style: 'margin-top:16px' },
        kpi(q.scans || 0, 'Scansioni'), kpi(mine.length, 'Proposte'),
        kpi(q.scans ? Math.round((mine.length / q.scans) * 100) : 0, 'Idee ogni 100 scansioni'),
        kpi(`${rankScans}°/${qrs.length}`, 'Per scansioni'), kpi(`${rankProps}°/${qrs.length}`, 'Per proposte')),
      el('p', { class: 'hint' }, mine.length ? 'Ultima proposta: ' + fmt(mine[0].createTime) : 'Nessuna proposta da questo QR, per ora.'),
      el('div', { class: 'actions' },
        el('button', { class: 'mini primary', onclick: (e) => run(e, () => sheetPdf([q])) }, '⬇ Rifai il foglio A4 col nome'),
        el('button', { class: 'mini', onclick: async () => { const v = prompt('In che zona si trova “' + q.label + '”?\nEsempi: Piano terra, Primo piano, Secondo piano, Cortile.', q.group || ''); if (v === null) return; await db((t) => Core.fs.update(cfg, 'qr_codes', q.id, { group: v.trim().slice(0, 40) }, t)); reload(); } }, 'Cambia zona'),
        el('button', { class: 'mini', onclick: async () => { await db((t) => Core.fs.update(cfg, 'qr_codes', q.id, { active: !q.active }, t)); reload(); } }, q.active ? 'Disattiva' : 'Riattiva'),
        el('button', { class: 'mini', onclick: () => { out.replaceChildren(); $('#tab-scan').scrollIntoView({ behavior: 'smooth' }); if (!scan.stream) startScan(); } }, '📷 Torna alla scansione'))),
    el('div', { class: 'panel' }, el('h2', {}, 'La zona “' + zone + '”'),
      el('div', { class: 'kpi', style: 'margin-top:12px' }, kpi(inZone.length, 'QR in zona'), kpi(zScans, 'Scansioni'), kpi(zProps, 'Proposte'), kpi(totScans ? Math.round((zScans / totScans) * 100) + '%' : '–', 'Delle scansioni totali')),
      el('div', { class: 'sub-list' }, inZone.map((x) => el('span', {}, (x.id === q.id ? '👉 ' : '') + x.label + ': ' + (x.scans || 0) + ' scansioni, ' + proposals.filter((p) => p.qr === x.id).length + ' proposte')))),
    el('div', { class: 'two' },
      el('div', { class: 'panel' }, el('h2', {}, 'Proposte negli ultimi 7 giorni'), bars(days)),
      el('div', { class: 'panel' }, el('h2', {}, 'Ultime proposte da qui'), mine.length ? el('div', { class: 'p-list' }, mine.slice(0, 5).map((p) =>
        el('article', { class: 'p-item s-' + p.status }, el('div', { class: 'p-top' }, el('span', { class: 'tag' }, p.category), el('span', {}, fmt(p.createTime)), el('span', {}, p.status)), el('p', {}, p.text.length > 220 ? p.text.slice(0, 220) + '…' : p.text)))) : el('div', { class: 'empty' }, 'Ancora nessuna proposta da questo QR.'))));
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function start() {
  try { await freshToken(); } catch { return showLogin(); }
  $('#login').hidden = true; $('#app').hidden = false;
  $('#who').textContent = tokenEmail();
  try { await loadProps(); await loadQrs(); } catch (e) { if (e.message !== 'auth') flash($('#qr-err'), 'Errore nel caricamento: ' + e.message, false); }
  if (location.hash === '#props') $('[data-tab="props"]').click();
  initPush();
}

/* ---- aggiorna i dati quando riapri l'app (es. toccando una notifica) ---- */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !$('#app').hidden) { loadProps().catch(() => {}); loadQrs().catch(() => {}); }
});
window.addEventListener('hashchange', () => { if (location.hash === '#props' && !$('#app').hidden) $('[data-tab="props"]').click(); });

/* ---- app installabile + notifiche push (Worker Cloudflare) ---- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const workerUrl = () => ((cfg.notify && cfg.notify.workerUrl) || '').replace(/\/+$/, '');
const keyBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));

async function worker(path, method = 'GET', body, auth) {
  const headers = {};
  if (auth) headers.Authorization = 'Bearer ' + (await freshToken());
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(workerUrl() + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error((d && d.error) || 'Errore ' + r.status);
  return d;
}
const currentSub = async () => (await navigator.serviceWorker.ready).pushManager.getSubscription();

async function enablePush() {
  const box = $('#push-msg');
  try {
    if ((await Notification.requestPermission()) !== 'granted') return renderPush();
    const reg = await navigator.serviceWorker.ready;
    const { publicKey } = await worker('/vapid');
    let sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe(); // riparte pulito (evita chiavi vecchie)
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
    await worker('/subscribe', 'POST', { subscription: sub.toJSON() }, true);
    await renderPush();
    flash(box, 'Fatto! Ora premi “Invia una prova”.', true);
  } catch (e) { renderPush(); flash(box, 'Non sono riuscito ad attivarle: ' + e.message, false); }
}
async function disablePush() {
  try { const sub = await currentSub(); if (sub) { await worker('/unsubscribe', 'POST', { subscription: sub.toJSON() }, true).catch(() => {}); await sub.unsubscribe(); } } catch { /* ignora */ }
  renderPush();
}
async function testPush() {
  const box = $('#push-msg');
  try { const d = await worker('/test', 'POST', {}, true); flash(box, d.sent ? 'Prova inviata: guarda il telefono.' : 'Nessun telefono iscritto: riattiva le notifiche.', !!d.sent); }
  catch (e) { flash(box, 'Prova non riuscita: ' + e.message, false); }
}

async function renderPush() {
  const panel = $('#push-panel'), status = $('#push-status'), actions = $('#push-actions');
  actions.replaceChildren();
  panel.hidden = false;
  const say = (t, cls) => { status.textContent = t; panel.className = 'panel push-panel ' + (cls || ''); };
  if (!workerUrl()) return say('🔔 Notifiche push: non ancora collegate (manca l’indirizzo del Worker Cloudflare in config/site.json).');
  if (isIos && !standalone()) return say('🔔 Per ricevere le notifiche: tocca Condividi (quadrato con la freccia) → “Aggiungi alla schermata Home”, poi apri Mirai dalla Home e torna qui.');
  if (!pushSupported()) return say('🔔 Questo browser non supporta le notifiche push.');
  if (Notification.permission === 'denied') return say('🔔 Notifiche bloccate. Sbloccale da Impostazioni → Notifiche → Mirai (o dalle impostazioni del sito).');
  const sub = Notification.permission === 'granted' ? await currentSub() : null;
  if (!sub) {
    say('🔔 Attiva le notifiche per sapere subito quando qualcuno scansiona un QR o invia una proposta.');
    return actions.append(el('button', { class: 'btn btn-primary', type: 'button', onclick: enablePush }, 'Attiva le notifiche'));
  }
  say('✅ Notifiche attive su questo telefono.', 'on');
  actions.append(el('button', { class: 'mini', type: 'button', onclick: testPush }, 'Invia una prova'), el('button', { class: 'mini', type: 'button', onclick: disablePush }, 'Disattiva'));
}
async function initPush() {
  try {
    await renderPush();
    // già iscritto: riallinea l'iscrizione al Worker (utile se è cambiata)
    if (workerUrl() && pushSupported() && Notification.permission === 'granted') { const sub = await currentSub(); if (sub) await worker('/subscribe', 'POST', { subscription: sub.toJSON() }, true).catch(() => {}); }
  } catch { /* ignora */ }
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
