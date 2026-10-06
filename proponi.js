'use strict';
const view = document.getElementById('view');
const { el } = Core;
const CATEGORIES = ['Aule e spazi', 'Didattica', 'Eventi e feste', 'Sport', 'Tecnologia', 'Ambiente', 'Servizi (mensa, bar, bagni)', 'Altro'];
const SESSION_MIN = 20;
const KEY = 'mira-qr-session';
const QR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/></svg>';
const LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const store = {
  get() { try { const s = JSON.parse(sessionStorage.getItem(KEY)); return s && s.exp > Date.now() ? s : null; } catch { return null; } },
  set(s) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignora */ } },
  clear() { try { sessionStorage.removeItem(KEY); } catch { /* ignora */ } },
};

function message({ icon, title, text, ok, actions = [] }) {
  view.replaceChildren(el('div', { class: 'center' },
    el('div', { class: 'big-icon' + (ok ? ' ok' : ''), html: icon }), el('h1', {}, title), el('p', { class: 'sub' }, text), ...actions));
}
const backBtn = () => el('a', { class: 'btn btn-violet', href: './' }, 'Torna al sito');
const locked = (expired, invalid) => message({
  icon: QR,
  title: expired ? 'Sessione scaduta' : 'Area riservata',
  text: invalid ? 'Questo QR code non è valido o è stato disattivato. Prova con un altro QR della scuola.' : 'Per proporre un’idea devi scansionare uno dei QR code sparsi per la scuola: inquadralo con la fotocamera del telefono e torni qui.',
  actions: [backBtn()],
});

function form(sess, cfg) {
  const select = el('select', { id: 'cat', name: 'category' }, CATEGORIES.map((c) => el('option', {}, c)));
  const txt = el('textarea', { id: 'txt', name: 'text', maxlength: '1000', placeholder: 'Es. Mettere dei distributori d’acqua al secondo piano…', required: '' });
  const n = el('span', {}, '0');
  const err = el('div', { class: 'msg err', role: 'alert', hidden: '' });
  const timer = el('p', { class: 'timer' });
  const btn = el('button', { class: 'btn btn-primary', style: 'width:100%', type: 'submit' }, 'Invia la proposta');
  const f = el('form', { novalidate: '' },
    el('label', { for: 'cat' }, 'Di cosa parla?'), select,
    el('label', { for: 'txt' }, 'La tua proposta'), txt,
    el('div', { class: 'counter' }, n, '/1000'),
    el('div', { class: 'privacy' }, el('span', { html: LOCK, style: 'display:contents' }), el('span', {}, el('b', {}, 'Anonimo davvero. '), 'Non ti chiediamo nome o email e non salviamo i tuoi dati: solo il testo e il posto del QR.')),
    btn, err);
  view.replaceChildren(
    el('span', { class: 'chip' }, '📍 ' + sess.label),
    el('h1', {}, 'Qual è la tua idea?'),
    el('p', { class: 'sub' }, 'Dicci cosa cambieresti per rendere la scuola migliore.'),
    f, timer);

  txt.addEventListener('input', () => (n.textContent = txt.value.length));
  const tick = () => {
    const left = sess.exp - Date.now();
    if (left <= 0) { clearInterval(iv); store.clear(); return locked(true); }
    timer.textContent = `Accesso valido ancora ${Math.ceil(left / 60000)} min`;
  };
  const iv = setInterval(tick, 15000); tick();

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    if (txt.value.trim().length < 10) { err.textContent = 'Scrivi almeno 10 caratteri.'; err.hidden = false; txt.focus(); return; }
    btn.disabled = true; btn.textContent = 'Invio…';
    try {
      await Core.rpc(cfg, 'submit_proposal', { p_code: sess.code, p_text: txt.value, p_category: select.value });
      clearInterval(iv); done(sess, cfg);
    } catch (ex) {
      btn.disabled = false; btn.textContent = 'Invia la proposta';
      const m = String(ex.message);
      if (m.includes('qr_invalid')) { clearInterval(iv); store.clear(); return locked(false, true); }
      err.textContent = m.includes('rate_limited') ? 'Troppe proposte in questo momento, riprova tra un minuto.' : m.includes('text_invalid') ? 'Il testo deve avere tra 10 e 1000 caratteri.' : 'Non sono riuscito a inviare. Controlla la connessione e riprova.';
      err.hidden = false;
    }
  });
}

function done(sess, cfg) {
  message({
    icon: CHECK, ok: true, title: 'Grazie!', text: 'La tua idea è arrivata alla lista Mira. Ne parleremo e ti risponderemo sui nostri canali.',
    actions: [el('button', { class: 'btn btn-violet', onclick: () => form(sess, cfg) }, 'Scrivine un’altra'), el('p', { style: 'margin-top:16px' }, el('a', { href: './' }, 'Torna al sito'))],
  });
}

async function init() {
  const cfg = await Core.config();
  if (!Core.configured(cfg)) {
    return message({ icon: LOCK, title: 'Quasi pronto', text: 'Il servizio proposte non è ancora collegato al database. Torna tra poco!', actions: [backBtn()] });
  }
  const url = new URL(location.href);
  const code = url.searchParams.get('c');
  if (code) {
    // ingresso da QR: verifica nel database, poi pulisci l'indirizzo
    history.replaceState(null, '', url.pathname);
    try {
      const label = await Core.rpc(cfg, 'check_qr', { p_code: code });
      if (!label) return locked(false, true);
      const sess = { code, label, exp: Date.now() + SESSION_MIN * 60000 };
      store.set(sess);
      return form(sess, cfg);
    } catch { return message({ icon: QR, title: 'Ops', text: 'Non riesco a collegarmi. Riprova tra un attimo.', actions: [backBtn()] }); }
  }
  const sess = store.get();
  return sess ? form(sess, cfg) : locked(false);
}
init();
