// Post (1080x1350) e storie (1080x1920) "Levante": ironia sul vento, mai attacchi personali.
const fs = require('fs');
const P = 'post', S = 'storia';
const D = [
 // ---------- POST ----------
 { t:P, id:'01-il-vento-passa', kicker:'Per Levante, con simpatia 🌬️', lines:[['Il vento','o'],['sta cambiando…','w'],['le idee','g'],['restano.','g']], sticker:'Con simpatia 😉', tape:'Il vento passa • Le idee restano', wind:1 },
 { t:P, id:'02-meno-vento', kicker:'Il vento sta cambiando…', lines:[['Meno','o'],['vento.','w'],['Più idee.','g']], sub:'16 progetti. Zero aria fritta.', sticker:'Con affetto 😘', fox:1, wind:1 },
 { t:P, id:'03-verso-dove', kicker:'Per Levante 🌬️', lines:[['Il vento','w'],['cambia.','o'],['Ma verso','w'],['dove?','g']], sub:'Noi la direzione ce l’abbiamo.', sticker:'Chiedetelo a chi vota 🧭', wind:1 },
 // ---------- STORIE ----------
 { t:S, id:'01-abbiamo-letto-lo-slogan', kicker:'Per Levante 🌬️', lines:[['Abbiamo letto','w'],['il vostro','o'],['slogan.','g']], sub:'Bello. Noi però abbiamo i progetti.', sticker:'Con simpatia 😉', wind:1 },
 { t:S, id:'02-il-vento-passa', kicker:'Il vento sta cambiando…', lines:[['Il vento','o'],['passa.','w'],['Le idee','g'],['restano.','g']], tape:'Il vento passa • Le idee restano', wind:1 },
 { t:S, id:'03-meno-vento', kicker:'Per Levante 🌬️', lines:[['Meno','o'],['vento.','w'],['Più idee.','g']], sub:'16 progetti. Zero aria fritta.', fox:1, wind:1 },
 { t:S, id:'04-verso-dove', kicker:'Il vento sta cambiando…', lines:[['Ma verso','w'],['dove?','g',360]], sub:'Noi la direzione ce l’abbiamo.', sticker:'Bussola inclusa 🧭', wind:1 },
 { t:S, id:'05-porta-via-le-parole', kicker:'Per Levante 🌬️', lines:[['Il vento','o'],['porta via','w'],['le parole.','w'],['Noi lasciamo','g'],['16 progetti.','g']], wind:1 },
 { t:S, id:'06-quando-il-vento-cala', kicker:'Il vento sta cambiando…', lines:[['Quando','w'],['il vento','o'],['cala,','w'],['servono','g'],['i fatti.','g']], tape:'Servono i fatti • Servono i fatti', wind:1 },
 { t:S, id:'07-non-inseguiamo-il-vento', kicker:'Lista Mirai', lines:[['Non','w'],['inseguiamo','o'],['il vento.','w'],['Costruiamo.','g']], fox:1, wind:1 },
 { t:S, id:'08-quanti-ne-avete', kicker:'Per Levante 🌬️', lines:[['Noi','w'],['16 progetti.','g'],['Voi','w'],['quanti?','o']], sticker:'Si chiede per curiosità 👀', wind:1 },
 { t:S, id:'09-sfida-aperta', kicker:'Il vento sta cambiando…', lines:[['Sfida','o'],['aperta.','g']], sub:'Confrontiamo le idee, non gli slogan.', sticker:'Quando volete 🤝', tape:'Idee contro slogan • Idee contro slogan', wind:1 },
 { t:S, id:'10-che-vinca-la-scuola', kicker:'Fair play', lines:[['Che vinca','w'],['la scuola.','g']], desc:'Rispetto per tutte le liste. Poi però votateci. 😉', wind:1 },
];
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const css = `
:root{--bg:#12062b;--gold:#ffc42e;--ink:#12062b}
*{box-sizing:border-box;margin:0}
body{background:#000;font-family:"DM Sans",sans-serif}
.card{position:relative;width:1080px;height:1920px;overflow:hidden;color:#fff;background:var(--bg);margin-bottom:20px}
.card.post{height:1350px}
.blob{position:absolute;border-radius:50%;filter:blur(100px)}
.v0 .b1{width:900px;height:900px;background:#7c3aed;right:-380px;top:420px;opacity:.95}.v0 .b2{width:760px;height:760px;background:#ffb020;left:-330px;bottom:-250px;opacity:.5}
.v1 .b1{width:900px;height:900px;background:#7c3aed;left:-380px;top:260px;opacity:.9}.v1 .b2{width:760px;height:760px;background:#ffb020;right:-330px;bottom:-260px;opacity:.5}
.v2 .b1{width:980px;height:980px;background:#6d28d9;right:-420px;top:-120px;opacity:.9}.v2 .b2{width:800px;height:800px;background:#ffb020;left:-380px;bottom:120px;opacity:.42}
.card::after{content:"";position:absolute;inset:0;z-index:60;pointer-events:none;opacity:.16;mix-blend-mode:overlay;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.wind{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}
.A{font-family:"Anton",Impact,sans-serif;text-transform:uppercase;line-height:.93;white-space:nowrap}
.w{color:#fff}.g{color:var(--gold)}.o{color:transparent;-webkit-text-stroke:4px #fff}
.brand{position:absolute;left:70px;top:236px;display:flex;align-items:center;gap:14px;z-index:10;font:800 26px "DM Sans";letter-spacing:.16em;text-transform:uppercase}
.post .brand{top:62px}.brand img{height:52px}
.safe{position:absolute;left:70px;right:70px;top:330px;bottom:400px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:22px;z-index:8}
.post .safe{top:150px;bottom:170px}
.hastape .safe{bottom:430px}.post.hastape .safe{bottom:330px}
.kick{display:inline-block;background:var(--gold);color:var(--ink);font:800 28px "DM Sans";letter-spacing:.1em;text-transform:uppercase;padding:12px 28px;border-radius:99px}
.h{display:flex;flex-direction:column;gap:2px}
.sub{font:800 58px/1.1 "DM Sans";max-width:900px}
.desc{font:500 50px/1.22 "DM Sans";max-width:900px;color:rgba(255,255,255,.93)}
.sticker{display:inline-block;background:#fff;color:var(--ink);font:800 42px "DM Sans";letter-spacing:.04em;text-transform:uppercase;padding:18px 36px;border-radius:99px;transform:rotate(-5deg);box-shadow:0 18px 40px -12px rgba(0,0,0,.6);margin-top:10px}
.tape{position:absolute;left:-80px;width:1240px;height:104px;background:var(--gold);color:var(--ink);transform:rotate(-5deg);z-index:30;display:flex;align-items:center;white-space:nowrap;overflow:hidden;font:400 62px/1 "Anton";text-transform:uppercase;letter-spacing:.04em;box-shadow:0 22px 44px -14px rgba(0,0,0,.6)}
.tape span{padding-right:34px}
.fox{position:absolute;right:34px;top:196px;width:215px;z-index:5;transform:rotate(7deg);filter:drop-shadow(0 30px 40px rgba(0,0,0,.55))}
.post .fox{top:44px;bottom:auto;right:34px;width:200px}
.handle{position:absolute;left:70px;right:70px;bottom:296px;z-index:20;display:flex;justify-content:space-between;font:800 30px "DM Sans";color:rgba(255,255,255,.9)}
.post .handle{bottom:64px}.handle b{color:var(--gold)}
`;
const wind = `<svg class="wind" viewBox="0 0 1080 1920" preserveAspectRatio="none" fill="none" stroke-linecap="round">
 <g stroke="#fff" stroke-opacity=".16" stroke-width="5"><path d="M-40 360 C 200 300, 380 440, 620 380 S 940 300, 1130 380"/><path d="M-40 470 C 240 400, 420 560, 700 470 S 980 400, 1130 460" stroke-opacity=".1"/></g>
 <g stroke="#ffc42e" stroke-opacity=".3" stroke-width="6"><path d="M-40 1180 C 180 1120, 360 1260, 600 1200 S 940 1120, 1130 1200"/><path d="M-40 1290 C 220 1230, 400 1370, 680 1290 S 960 1230, 1130 1280" stroke-opacity=".2"/></g>
</svg>`;
let body = '';
D.forEach((s, i) => {
  const lines = s.lines.map(([t, c, max]) => `<div class="A fit ${c}" data-max="${max || (s.t === P ? (s.lines.length >= 4 ? 160 : s.lines.length === 3 ? 215 : 230) : (s.lines.length >= 5 ? (s.tape ? 150 : 185) : s.lines.length === 4 ? 235 : 250))}">${esc(t)}</div>`).join('');
  const tapeText = s.tape ? Array(4).fill(s.tape).map(t => `<span>${esc(t)}</span><span>•</span>`).join('') : '';
  const tapeTop = s.t === P ? 1140 : 1490;
  body += `<section class="card ${s.t === P ? 'post' : 'story'} v${i % 3}${s.tape ? ' hastape' : ''}" id="c${i}" data-name="${s.t === P ? 'post' : 'storie'}/${s.id}">
 <div class="blob b1"></div><div class="blob b2"></div>${s.wind ? wind : ''}
 <div class="brand"><img src="../../assets/fox-96.png" alt="">Mirai</div>
 <div class="safe">
  ${s.kicker ? `<span class="kick">${esc(s.kicker)}</span>` : ''}
  <div class="h">${lines}</div>
  ${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ''}
  ${s.desc ? `<div class="desc">${esc(s.desc)}</div>` : ''}
  ${s.sticker ? `<span class="sticker">${esc(s.sticker)}</span>` : ''}
 </div>
 ${s.fox ? '<img class="fox" src="../../assets/fox.png" alt="">' : ''}
 ${s.tape ? `<div class="tape" style="top:${tapeTop}px">${tapeText}</div>` : ''}
 ${s.tape ? '' : '<div class="handle"><span>@lista.mirai</span><b>Il futuro inizia da noi.</b></div>'}
</section>`;
});
fs.writeFileSync('levante.html', `<!doctype html><html lang="it"><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@500;700;800&display=swap"><style>${css}</style></head><body>${body}
<script>document.fonts.ready.then(()=>{document.querySelectorAll('.fit').forEach(e=>{const max=+e.dataset.max;let s=max;e.style.fontSize=s+'px';const w=e.scrollWidth;if(w>940){s=Math.floor(s*940/w);e.style.fontSize=s+'px'}});document.body.dataset.ready=1});</script></body></html>`);
fs.writeFileSync('lista.json', JSON.stringify(D.map((s, i) => ({ i, name: `${s.t === P ? 'post' : 'storie'}/${s.id}` }))));
console.log(D.length);
