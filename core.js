'use strict';
/* Funzioni condivise: percorsi, configurazione, DOM e chiamate a Supabase (REST). */
const Core = (() => {
  const ROOT = new URL('.', document.currentScript.src).href; // cartella radice del sito (funziona anche in /listamira/)
  let cfgPromise;
  const config = () => (cfgPromise ||= fetch(ROOT + 'config/site.json', { cache: 'no-cache' }).then((r) => r.json()));

  function el(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v; // solo per SVG interni, mai per dati utente
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    kids.flat().forEach((c) => e.append(c));
    return e;
  }

  const configured = (c) => !!(c.supabase && c.supabase.url && c.supabase.anonKey);

  async function request(c, path, { method = 'GET', body, token, headers = {} } = {}) {
    const res = await fetch(`${c.supabase.url.replace(/\/$/, '')}${path}`, {
      method,
      headers: { apikey: c.supabase.anonKey, Authorization: `Bearer ${token || c.supabase.anonKey}`, 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const err = new Error((data && (data.message || data.msg || data.error_description)) || `Errore ${res.status}`);
      err.status = res.status; err.data = data;
      throw err;
    }
    return data;
  }
  const rpc = (c, fn, args, token) => request(c, `/rest/v1/rpc/${fn}`, { method: 'POST', body: args, token });

  return { ROOT, config, el, configured, request, rpc };
})();
