'use strict';
const view = document.getElementById('view');
const LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const QR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; }

function locked(expired) {
  const bad = new URLSearchParams(location.search).get('errore') === 'qr';
  view.replaceChildren(h(`
    <div class="center">
      <div class="big-icon">${QR}</div>
      <h1>${expired ? 'Sessione scaduta' : 'Area riservata'}</h1>
      <p class="sub">${bad ? 'Questo QR code non è più valido.' : 'Per proporre un’idea devi scansionare uno dei QR code sparsi per la scuola.'} Inquadra un QR con la fotocamera del telefono e torni qui.</p>
      <a class="btn btn-violet" href="/">Torna al sito</a>
    </div>`));
}

function form(info) {
  const opts = info.categories.map((c) => `<option>${c}</option>`).join('');
  const frag = h(`
    <span class="chip">${QR.replace('<svg', '<svg width="16" height="16"')} <span id="place"></span></span>
    <h1>Qual è la tua idea?</h1>
    <p class="sub">Dicci cosa cambieresti per rendere la scuola migliore. Nessun nome, nessuna email.</p>
    <form id="f" novalidate>
      <label for="cat">Di cosa parla?</label>
      <select id="cat" name="category">${opts}</select>
      <label for="txt">La tua proposta</label>
      <textarea id="txt" name="text" maxlength="1000" placeholder="Es. Mettere dei distributori d’acqua al secondo piano…" required></textarea>
      <div class="counter"><span id="n">0</span>/1000</div>
      <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="privacy">${LOCK}<span><b>Anonimo davvero.</b> Non salviamo IP, dispositivo o dati personali: solo il testo e il QR da cui arrivi.</span></div>
      <button class="btn btn-primary" style="width:100%" type="submit">Invia la proposta</button>
      <div id="err" class="msg err" role="alert" hidden></div>
    </form>
    <p class="timer" id="timer"></p>`);
  view.replaceChildren(frag);
  document.getElementById('place').textContent = info.place;
  const txt = document.getElementById('txt'), n = document.getElementById('n'), err = document.getElementById('err'), f = document.getElementById('f');
  txt.addEventListener('input', () => (n.textContent = txt.value.length));

  const tick = () => {
    const left = Math.max(0, info.expiresAt - Date.now());
    document.getElementById('timer').textContent = `Accesso valido ancora ${Math.ceil(left / 60000)} min`;
    if (!left) locked(true);
  };
  tick(); const iv = setInterval(() => { if (!document.getElementById('timer')) return clearInterval(iv); tick(); }, 20000);

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    if (txt.value.trim().length < 10) { err.textContent = 'Scrivi almeno 10 caratteri.'; err.hidden = false; txt.focus(); return; }
    const btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Invio…';
    try {
      const r = await fetch('/api/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(f))) });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) return locked(true);
      if (!r.ok) throw new Error(d.error || 'Qualcosa è andato storto.');
      done();
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false; btn.disabled = false; btn.textContent = 'Invia la proposta';
    }
  });
}

function done() {
  view.replaceChildren(h(`
    <div class="center">
      <div class="big-icon ok">${CHECK}</div>
      <h1>Grazie!</h1>
      <p class="sub">La tua idea è arrivata alla lista Mira. Ne parleremo e ti risponderemo sui nostri canali.</p>
      <button class="btn btn-violet" id="again">Scrivine un’altra</button>
      <p style="margin-top:16px"><a href="/">Torna al sito</a></p>
    </div>`));
  document.getElementById('again').addEventListener('click', init);
}

function init() {
  fetch('/api/proposal-session').then((r) => (r.ok ? r.json() : null)).then((i) => (i ? form(i) : locked(false))).catch(() => locked(false));
}
init();
