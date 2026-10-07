// Genera storie.html a partire dall'elenco; render.js le trasforma in PNG 1080x1920.
const fs = require('fs');
const N = 'neutre', P = 'provocatorie';
// lines: [testo, colore] colore: w bianco, g oro, o contorno bianco, og contorno oro
const S = [
 // ---------- NEUTRE ----------
 { k:N, id:'01-intro', kicker:'Lista Mirai · ITIS Galileo Galilei', lines:[['Il Galilei','w'],['sta per','o'],['cambiare.','g']], sub:'Una lista di studenti. Idee concrete.', fox:'br' },
 { k:N, id:'02-numeri', kicker:'I nostri progetti', lines:[['16','g',560],['idee.','w']], sub:'In 4 aree: vita scolastica, eventi, assemblee e social.', fox:'br' },
 { k:N, id:'03-snow-galilei', kicker:'Progetto · Eventi e socialità', lines:[['Snow','w'],['Galilei','g']], desc:'Tutta la scuola un giorno sulla neve, con attrezzatura e DJ set.', sticker:'Ci state? 🏂' },
 { k:N, id:'04-fashion-week', kicker:'Progetto · Eventi e socialità', lines:[['Fashion','w'],['Week','g']], desc:'Una settimana all’insegna della moda. Che classe vincerà?', sticker:'Sfida tra classi 👗' },
 { k:N, id:'05-got-talent', kicker:'Progetto · Eventi e socialità', lines:[['Galile’s','w'],['Got Talent','g']], desc:'Un vero palco per mostrare talenti, passioni e capacità.', sticker:'Tu cosa sai fare? 🎤' },
 { k:N, id:'06-settimana-studente', kicker:'Progetto · Eventi e socialità', lines:[['Settimana','w'],['dello','o'],['Studente','g']], desc:'Tornei sportivi, e-sport, cineforum, corsi e workshop. Le attività le proponete voi.', sticker:'Decidete voi 🎮' },
 { k:N, id:'07-period-box', kicker:'Progetto · Vita scolastica', lines:[['Period','w'],['Box','g']], desc:'Assorbenti e prodotti igienici essenziali a disposizione gratuitamente per le studentesse.', sticker:'Gratis, per tutte' },
 { k:N, id:'08-assemblee', kicker:'Progetto · Assemblee d’istituto', lines:[['I temi','w'],['li scegliamo','o'],['noi.','g']], desc:'Le assemblee parlano di quello che interessa a voi.' },
 { k:N, id:'09-ospiti-orientamento', kicker:'Progetto · Assemblee d’istituto', lines:[['Più','w'],['ospiti.','g']], desc:'Esperti, professionisti e persone con esperienze interessanti, e più orientamento sul dopo il liceo.' },
 { k:N, id:'10-cerca-il-qr', kicker:'100% anonimo', lines:[['Hai','w'],['un’idea?','g']], desc:'Cerca il QR in giro per la scuola, inquadralo e scrivici cosa cambieresti.', qr:true },
 { k:N, id:'11-domanda', kicker:'Domanda del giorno', lines:[['Cosa','w'],['cambieresti?','g']], card:'Rispondi qui sotto 👇', desc:'Anche in anonimo: cerca i QR a scuola.' },
 { k:N, id:'12-presto', kicker:'Novità in arrivo', lines:[['Presto','w',420]], sub:'Aggiornamenti in arrivo.', bar:true, fox:'br' },
 { k:N, id:'13-brand', kicker:'Lista Mirai', lines:[['Il futuro','w'],['inizia','o'],['da noi.','g']], logo:true },
 { k:N, id:'14-seguici', kicker:'Seguici', lines:[['Resta','w'],['connesso.','g']], desc:'Notizie, eventi e novità: tutto su @lista.mirai', sticker:'Attiva le notifiche 🔔' },
 // ---------- PROVOCATORIE ----------
 { k:P, id:'01-servivamo-noi', kicker:'Lista Mirai', lines:[['Servivamo','o'],['noi.','g',420]], sub:'per migliorare il lavoro degli altri.', sticker:'Con affetto 😘', tape:'Meno promesse • Più fatti', fox:'br' },
 { k:P, id:'02-gli-altri-promettono', kicker:'Lista Mirai', lines:[['Gli altri','w'],['promettono.','o'],['Noi','w'],['facciamo.','g']], tape:'Servivamo noi • Servivamo noi', fox:'br' },
 { k:P, id:'03-scusate-il-ritardo', kicker:'Lista Mirai', lines:[['Scusate','w'],['il ritardo.','g']], sub:'Qualcuno doveva alzare l’asticella.', sticker:'Con calma 😏' },
 { k:P, id:'04-meno-promesse', kicker:'Lista Mirai', lines:[['Meno','o'],['promesse.','w'],['Più fatti.','g']], tape:'16 progetti • 4 aree • zero scuse' },
 { k:P, id:'05-la-luna', kicker:'Lista Mirai', lines:[['Non','w'],['promettiamo','o'],['la luna.','g']], sub:'Cominciamo dalle cose che si possono fare.', sticker:'Un passo alla volta 🚀' },
 { k:P, id:'06-candidati-tanti', kicker:'Lista Mirai', lines:[['Candidati','w'],['ce ne sono','o'],['tanti.','w']], sub:'Idee concrete, meno.', sticker:'Indovina chi le ha 👀', tape:'Idee concrete • Idee concrete' },
 { k:P, id:'07-piu-di-un-volantino', kicker:'Lista Mirai', lines:[['Il Galilei','w'],['merita più di','o'],['un volantino.','g']], fox:'br' },
 { k:P, id:'08-chi-parla-chi-fa', kicker:'Lista Mirai', lines:[['Chi parla.','o'],['Chi fa.','g']], sub:'Indovina chi siamo. 😉', tape:'Chi parla • Chi fa • Chi parla • Chi fa' },
 { k:P, id:'09-non-i-migliori', kicker:'Lista Mirai', lines:[['Non diciamo','w'],['che siamo','w'],['i migliori.','o']], sub:'Lo dicono i 16 progetti.', sticker:'Fatti, non parole 💜' },
 { k:P, id:'10-due-domande', kicker:'Lista Mirai', lines:[['Fatevi','w'],['due','o'],['domande.','g']], sub:'Poi guardate i nostri 16 progetti.', tape:'Servivamo noi • Servivamo noi', fox:'br' },
];
const blobs = [
 '.b1{width:900px;height:900px;background:#7c3aed;right:-380px;top:420px;opacity:.95}.b2{width:760px;height:760px;background:#ffb020;left:-330px;bottom:-250px;opacity:.5}',
 '.b1{width:900px;height:900px;background:#7c3aed;left:-380px;top:260px;opacity:.9}.b2{width:760px;height:760px;background:#ffb020;right:-330px;bottom:-260px;opacity:.5}',
 '.b1{width:980px;height:980px;background:#6d28d9;right:-420px;top:-120px;opacity:.9}.b2{width:800px;height:800px;background:#ffb020;left:-380px;bottom:120px;opacity:.42}',
];
const esc = t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
let css = `
:root{--bg:#12062b;--gold:#ffc42e;--ink:#12062b}
*{box-sizing:border-box;margin:0}
body{background:#000;font-family:"DM Sans",sans-serif}
.story{position:relative;width:1080px;height:1920px;overflow:hidden;color:#fff;background:var(--bg);margin-bottom:20px}
.blob{position:absolute;border-radius:50%;filter:blur(100px)}
.story::after{content:"";position:absolute;inset:0;z-index:60;pointer-events:none;opacity:.16;mix-blend-mode:overlay;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.A{font-family:"Anton",Impact,sans-serif;text-transform:uppercase;line-height:.93;white-space:nowrap}
.w{color:#fff}.g{color:var(--gold)}.o{color:transparent;-webkit-text-stroke:4px #fff}.og{color:transparent;-webkit-text-stroke:4px var(--gold)}
.brand{position:absolute;left:70px;top:236px;display:flex;align-items:center;gap:14px;z-index:10;font:800 26px "DM Sans";letter-spacing:.16em;text-transform:uppercase}
.brand img{height:52px}
.safe{position:absolute;left:70px;right:70px;top:330px;bottom:400px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:22px;z-index:8}
.kick{display:inline-block;background:var(--gold);color:var(--ink);font:800 28px "DM Sans";letter-spacing:.12em;text-transform:uppercase;padding:12px 28px;border-radius:99px}
.h{display:flex;flex-direction:column;gap:2px}
.sub{font:800 58px/1.1 "DM Sans";max-width:900px}
.desc{font:500 50px/1.22 "DM Sans";max-width:900px;color:rgba(255,255,255,.93)}
.sticker{display:inline-block;background:#fff;color:var(--ink);font:800 42px "DM Sans";letter-spacing:.04em;text-transform:uppercase;padding:18px 36px;border-radius:99px;transform:rotate(-5deg);box-shadow:0 18px 40px -12px rgba(0,0,0,.6);margin-top:10px}
.tape{position:absolute;left:-80px;width:1240px;height:104px;background:var(--gold);color:var(--ink);transform:rotate(-5deg);z-index:30;display:flex;align-items:center;white-space:nowrap;overflow:hidden;font:400 62px/1 "Anton";text-transform:uppercase;letter-spacing:.04em;box-shadow:0 22px 44px -14px rgba(0,0,0,.6)}
.tape span{padding-right:34px}
.fox{position:absolute;right:34px;top:196px;width:215px;z-index:5;transform:rotate(7deg);filter:drop-shadow(0 30px 40px rgba(0,0,0,.55))}
.hastape .safe{bottom:430px}
.handle{position:absolute;left:70px;right:70px;bottom:296px;z-index:20;display:flex;justify-content:space-between;font:800 30px "DM Sans";color:rgba(255,255,255,.9)}
.handle b{color:var(--gold);font-weight:800}
.logo{width:340px;height:340px;border-radius:50%;box-shadow:0 30px 70px -20px rgba(0,0,0,.65);margin-bottom:10px}
.qrb{width:300px;height:300px;border-radius:64px;background:#fff;display:grid;place-items:center;transform:rotate(7deg);box-shadow:0 30px 60px -20px rgba(0,0,0,.6);margin-top:10px}
.qrb svg{width:200px;height:200px}
.card{width:100%;background:#fff;color:var(--ink);border-radius:56px;padding:60px 56px;font:800 54px/1.15 "DM Sans";box-shadow:0 30px 60px -22px rgba(0,0,0,.6);margin-top:14px}
.card small{display:block;font:700 30px "DM Sans";color:#6b6585;margin-top:14px;letter-spacing:.04em}
.bar{width:100%}.bar .lb{display:flex;justify-content:space-between;font:800 30px "DM Sans";letter-spacing:.14em;text-transform:uppercase;margin-bottom:16px}.bar .lb b{color:var(--gold)}
.track{height:64px;border-radius:99px;background:rgba(255,255,255,.12);border:3px solid rgba(255,255,255,.3);padding:6px}
.fill{width:87%;height:100%;border-radius:99px;background:repeating-linear-gradient(115deg,#ffc42e 0 28px,#ffb020 28px 56px);box-shadow:0 0 40px rgba(255,196,46,.6)}
`;
blobs.forEach((b, i) => css += b.replace(/\.b1/g, `.v${i} .b1`).replace(/\.b2/g, `.v${i} .b2`));
const qrSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#4c1d95" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/></svg>';
let body = '';
S.forEach((s, i) => {
  const lines = s.lines.map(([t, c, max]) => `<div class="A fit ${c === 'o' ? 'o' : c === 'og' ? 'og' : c}" data-max="${max || 250}">${esc(t)}</div>`).join('');
  const tapeText = s.tape ? Array(4).fill(s.tape).map(t => `<span>${esc(t)}</span><span>•</span>`).join('') : '';
  const tapeTop = 1490;
  body += `<section class="story v${i % 3}${s.tape ? ' hastape' : ''}" id="s${i}" data-name="${s.k}/${s.id}">
 <div class="blob b1"></div><div class="blob b2"></div>
 <div class="brand"><img src="../../assets/fox-96.png" alt="">Mirai</div>
 <div class="safe">
  ${s.logo ? '<img class="logo" src="../../assets/logo.png" alt="">' : ''}
  ${s.kicker ? `<span class="kick">${esc(s.kicker)}</span>` : ''}
  <div class="h">${lines}</div>
  ${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ''}
  ${s.desc ? `<div class="desc">${esc(s.desc)}</div>` : ''}
  ${s.card ? `<div class="card">${esc(s.card)}<small>Scrivi la tua idea</small></div>` : ''}
  ${s.bar ? '<div class="bar"><div class="lb"><span>Caricamento…</span><b>87%</b></div><div class="track"><div class="fill"></div></div></div>' : ''}
  ${s.qr ? `<div class="qrb">${qrSvg}</div>` : ''}
  ${s.sticker ? `<span class="sticker">${esc(s.sticker)}</span>` : ''}
 </div>
 ${s.fox ? '<img class="fox" src="../../assets/fox.png" alt="">' : ''}
 ${s.tape ? `<div class="tape" style="top:${tapeTop}px">${tapeText}</div>` : ''}
 ${s.tape ? '' : '<div class="handle"><span>@lista.mirai</span><b>Il futuro inizia da noi.</b></div>'}
</section>`;
});
const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@500;700;800&display=swap"><style>${css}</style></head><body>${body}
<script>
document.fonts.ready.then(()=>{document.querySelectorAll('.fit').forEach(e=>{const max=+e.dataset.max;let s=max;e.style.fontSize=s+'px';const w=e.scrollWidth;const box=940;if(w>box){s=Math.floor(s*box/w);e.style.fontSize=s+'px'}});document.body.dataset.ready=1});
</script></body></html>`;
fs.writeFileSync('storie.html', html);
fs.writeFileSync('storie.json', JSON.stringify(S.map((s, i) => ({ i, name: `${s.k}/${s.id}` })), null, 1));
console.log(S.length, 'storie');
