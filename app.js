'use strict';
const ICONS = {
  ear: '<path d="M7 9a5 5 0 1 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M11 9a1.5 1.5 0 0 1 3 0"/>',
  spark: '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  building: '<path d="M4 21V5l8-2v18M12 9h8v12M4 21h16M8 8h1M8 12h1M8 16h1M16 13h1M16 17h1"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 7h6"/>',
  party: '<path d="M4 20l4-12 8 8zM14 4v2M19 7l-1.5 1.2M20 13h-2"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19c3-5 6-8 10-10"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  insta: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
};
const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ICONS.spark}</svg>`;

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v);
  }
  kids.flat().forEach((c) => e.append(c));
  return e;
}
const $ = (s) => document.querySelector(s);

function setText(key, val) { document.querySelectorAll(`[data-bind="${key}"]`).forEach((n) => (n.textContent = val)); }

function render(c) {
  const L = c.list;
  document.title = `Lista ${L.name} — ${L.claim.replace(/\.$/, '')}`;
  setText('name', L.name); setText('year', L.year); setText('intro', L.intro); setText('school', L.school);
  // claim: l'ultima parola in arancione (costruito via DOM, niente HTML da config)
  const h1 = $('[data-bind-html="claim"]');
  const words = L.claim.trim().split(/\s+/);
  const last = words.pop();
  h1.textContent = words.join(' ') + ' ';
  h1.append(el('em', {}, last));

  $('#stats').replaceChildren(...c.stats.map((s) => el('div', { class: 'stat reveal' }, el('b', {}, s.value), el('span', {}, s.label))));
  $('#values').replaceChildren(...c.values.map((v) => el('article', { class: 'card reveal' }, el('div', { class: 'icon', html: svg(v.icon) }), el('h3', {}, v.title), el('p', {}, v.text))));
  $('#program').replaceChildren(...c.program.map((p) => el('article', { class: 'card reveal' },
    el('div', { class: 'icon', html: svg(p.icon) }), el('h3', {}, p.title), ...(p.text ? [el('p', {}, p.text)] : []),
    el('ul', {}, p.items.map((i) => el('li', {}, el('div', {}, el('strong', {}, i.title), el('span', {}, ' — ' + i.text))))))));
  $('#team-grid').replaceChildren(...c.team.map((m) => {
    const initials = m.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    const handle = String(m.instagram || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
    const ig = /^[A-Za-z0-9._]{1,30}$/.test(handle)
      ? el('a', { class: 'ig-btn', href: `https://instagram.com/${handle}`, target: '_blank', rel: 'noopener', 'aria-label': `Instagram di ${m.name}` }, el('span', { html: svg('insta') }), '@' + handle)
      : '';
    return el('article', { class: 'card team-card reveal' }, el('div', { class: 'avatar', 'aria-hidden': 'true' }, initials), el('h3', {}, m.name), ...(m.badge ? [el('span', { class: 'badge-lead' }, m.badge)] : []), el('p', {}, m.role), ig);
  }));
  $('#timeline').replaceChildren(...c.timeline.map((t) => el('li', { class: 'reveal' }, el('span', { class: 'when' }, t.when), el('h3', {}, t.title), el('p', {}, t.text))));
  $('#faq').replaceChildren(...c.faq.map((f) => el('details', {}, el('summary', {}, f.q), el('p', {}, f.a))));

  const btns = [];
  if (L.contacts.email) btns.push(el('a', { class: 'btn btn-violet', href: `mailto:${L.contacts.email}` }, L.contacts.email));
  if (L.contacts.instagram) btns.push(el('a', { class: 'btn btn-primary', href: L.contacts.instagram, target: '_blank', rel: 'noopener' }, 'Instagram ' + (L.contacts.instagramHandle || '')));
  const S = L.schoolInfo;
  if (S) {
    $('#school-box').replaceChildren(el('strong', {}, L.school), el('span', {}, ` · ${S.address}`), S.website ? el('a', { href: S.website, target: '_blank', rel: 'noopener' }, ' · Sito della scuola') : '');
  }
  $('#contact-btns').replaceChildren(...btns);
  observe();
}

function observe() {
  const els = document.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'));
  const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
}

$('#yr').textContent = new Date().getFullYear();
const mb = document.querySelector('.menu-btn'), mm = $('#mm');
mb.addEventListener('click', () => { const o = mm.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });
mm.addEventListener('click', (e) => { if (e.target.tagName === 'A') { mm.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); } });

Core.config().then(render).catch(() => { $('#main').prepend(el('p', { style: 'padding:40px;text-align:center' }, 'Impossibile caricare i contenuti. Riprova più tardi.')); });
observe();
