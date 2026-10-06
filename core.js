'use strict';
/* Funzioni condivise: percorsi, configurazione, DOM e Firebase (REST: Firestore + Auth). */
const Core = (() => {
  const ROOT = new URL('.', document.currentScript.src).href; // radice del sito (funziona anche in /listamira/)
  let cfgPromise;
  const config = () => (cfgPromise ||= fetch(ROOT + 'config/site.json', { cache: 'no-cache' }).then((r) => r.json()));
  const configured = (c) => !!(c.firebase && c.firebase.apiKey && c.firebase.projectId);

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

  /* ---- Firestore REST ---- */
  const toValue = (v) => (typeof v === 'string' ? { stringValue: v } : typeof v === 'boolean' ? { booleanValue: v } : v instanceof Date ? { timestampValue: v.toISOString() } : { integerValue: String(v) });
  const toFields = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toValue(v)]));
  const fromValue = (v) => ('stringValue' in v ? v.stringValue : 'booleanValue' in v ? v.booleanValue : 'integerValue' in v ? Number(v.integerValue) : 'timestampValue' in v ? v.timestampValue : null);
  const fromDoc = (d) => ({ id: d.name.split('/').pop(), createTime: d.createTime, ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, fromValue(v)])) });

  async function call(url, { method = 'GET', body, token } = {}) {
    const res = await fetch(url, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error((data && data.error && data.error.message) || `Errore ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }
  const docsUrl = (c) => `https://firestore.googleapis.com/v1/projects/${c.firebase.projectId}/databases/(default)/documents`;

  const fs = {
    // legge un documento per ID (null se non esiste o non è permesso)
    async get(c, col, id, token) {
      try { return fromDoc(await call(`${docsUrl(c)}/${col}/${encodeURIComponent(id)}?key=${c.firebase.apiKey}`, { token })); }
      catch (e) { if (e.status === 404 || e.status === 403) return null; throw e; }
    },
    async create(c, col, data, { id, token } = {}) {
      const q = `?key=${c.firebase.apiKey}` + (id ? `&documentId=${encodeURIComponent(id)}` : '');
      return fromDoc(await call(`${docsUrl(c)}/${col}${q}`, { method: 'POST', body: { fields: toFields(data) }, token }));
    },
    async update(c, col, id, data, token) {
      const mask = Object.keys(data).map((k) => `updateMask.fieldPaths=${k}`).join('&');
      return call(`${docsUrl(c)}/${col}/${encodeURIComponent(id)}?${mask}&key=${c.firebase.apiKey}`, { method: 'PATCH', body: { fields: toFields(data) }, token });
    },
    remove: (c, col, id, token) => call(`${docsUrl(c)}/${col}/${encodeURIComponent(id)}?key=${c.firebase.apiKey}`, { method: 'DELETE', token }),
    async list(c, col, token) {
      let out = [], page = '';
      do {
        const d = await call(`${docsUrl(c)}/${col}?pageSize=300&key=${c.firebase.apiKey}${page}`, { token });
        out = out.concat((d.documents || []).map(fromDoc));
        page = d.nextPageToken ? `&pageToken=${encodeURIComponent(d.nextPageToken)}` : '';
      } while (page);
      return out;
    },
  };

  const signIn = (c, email, password) => call(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${c.firebase.apiKey}`, { method: 'POST', body: { email, password, returnSecureToken: true } });

  return { ROOT, config, configured, el, fs, signIn };
})();
