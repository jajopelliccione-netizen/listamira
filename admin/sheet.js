'use strict';
/* Foglio A4 della lista Mirai: grafica con logo, spiegazione e QR (canvas 300 dpi) + PDF. */
const Sheet = (() => {
  const W = 2480, H = 3508; // A4 a 300 dpi
  const C = { v950: '#2b0f57', v900: '#3b1670', v700: '#4c1d95', v600: '#6d28d9', gold: '#fbb829', gold2: '#fcd57a', ink: '#1b0a00' };
  const DISPLAY = '"Bricolage Grotesque", "DM Sans", system-ui, sans-serif';
  const BODY = '"DM Sans", system-ui, sans-serif';
  let logoPromise;

  function loadLogo() {
    return (logoPromise ||= new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = '../assets/logo.png';
    }));
  }
  async function loadFonts() {
    try {
      await Promise.all([`800 100px ${DISPLAY}`, `700 100px ${BODY}`, `500 100px ${BODY}`].map((f) => document.fonts.load(f)));
    } catch { /* si usano i font di sistema */ }
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function wrap(g, text, maxW) {
    const words = text.split(' '); const lines = []; let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }
  function fitText(g, text, font, weight, size, maxW) { // riduce il corpo finché sta nella larghezza
    let s = size;
    do { g.font = `${weight} ${s}px ${font}`; s -= 4; } while (g.measureText(text).width > maxW && s > 40);
  }

  /** Disegna il foglio per un QR. `qr` è l'oggetto di qrcode-generator già costruito (make() fatto). */
  async function render(qr, placeLabel, siteUrl) {
    const [logo] = await Promise.all([loadLogo(), loadFonts()]);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';

    // sfondo viola con chevron tenui (come la locandina)
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, C.v900); bg.addColorStop(1, C.v950);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(124, 58, 237, .22)'; g.lineWidth = 120; g.lineJoin = 'miter';
    for (const off of [0, 330, 660]) {
      g.beginPath(); g.moveTo(-100, 620 + off); g.lineTo(W / 2, 20 + off); g.lineTo(W + 100, 620 + off); g.stroke();
    }
    // cornice oro
    g.strokeStyle = C.gold; g.lineWidth = 12; g.strokeRect(70, 70, W - 140, H - 140);
    g.lineWidth = 4; g.strokeStyle = 'rgba(251,184,41,.55)'; g.strokeRect(100, 100, W - 200, H - 200);

    // logo
    const LR = 255, LX = W / 2, LY = 440;
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 60; g.shadowOffsetY = 20;
    g.beginPath(); g.arc(LX, LY, LR, 0, Math.PI * 2); g.fillStyle = C.v950; g.fill(); g.restore();
    g.drawImage(logo, LX - LR, LY - LR, LR * 2, LR * 2);

    // titolo
    g.fillStyle = '#fff'; fitText(g, 'HAI UN’IDEA', DISPLAY, 800, 250, W - 520); g.fillText('HAI UN’IDEA', W / 2, 890);
    g.fillStyle = C.gold; fitText(g, 'PER LA SCUOLA?', DISPLAY, 800, 250, W - 520); g.fillText('PER LA SCUOLA?', W / 2, 1130);
    g.fillStyle = 'rgba(255,255,255,.92)'; g.font = `500 82px ${BODY}`;
    g.fillText('Inquadra il QR e scrivici la tua proposta.', W / 2, 1262);
    g.fillStyle = C.gold2; g.font = `700 82px ${BODY}`;
    g.fillText('È completamente anonima.', W / 2, 1362);

    // carta con QR
    const CS = 1120, CX = (W - CS) / 2, CY = 1510;
    g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 70; g.shadowOffsetY = 25;
    roundRect(g, CX, CY, CS, CS, 70); g.fillStyle = '#fff'; g.fill(); g.restore();
    // angoli oro
    g.strokeStyle = C.gold; g.lineWidth = 26; g.lineCap = 'round'; g.lineJoin = 'round';
    const m = 40, L = 150;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const px = sx < 0 ? CX - m : CX + CS + m, py = sy < 0 ? CY - m : CY + CS + m;
      g.beginPath(); g.moveTo(px + (-sx) * L, py); g.lineTo(px, py); g.lineTo(px, py + (-sy) * L); g.stroke();
    }
    // QR
    const n = qr.getModuleCount(), quiet = 2, PAD = 70, area = CS - PAD * 2;
    const cell = Math.floor(area / (n + quiet * 2)), qs = cell * (n + quiet * 2), qx = CX + (CS - qs) / 2, qy = CY + (CS - qs) / 2;
    g.fillStyle = C.v900;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect(qx + (c + quiet) * cell, qy + (r + quiet) * cell, cell, cell);
    // etichetta "scansiona"
    const tag = 'SCANSIONA ME'; g.font = `800 66px ${DISPLAY}`; const tw = g.measureText(tag).width + 150;
    roundRect(g, W / 2 - tw / 2, CY - 62, tw, 124, 62); g.fillStyle = C.gold; g.fill();
    g.fillStyle = C.ink; g.fillText(tag, W / 2, CY + 24);

    // tre passaggi
    const steps = [
      ['1', 'Inquadra', 'Apri la fotocamera del telefono e punta il QR code.'],
      ['2', 'Scrivi', 'Racconta la tua idea. Niente nome, niente email.'],
      ['3', 'Invia', 'La leggiamo insieme e ti rispondiamo sui nostri canali.'],
    ];
    const SW = 640, GAP = 60, SX = (W - (SW * 3 + GAP * 2)) / 2, SY = 2765, SH = 410;
    steps.forEach(([num, title, text], i) => {
      const x = SX + i * (SW + GAP);
      roundRect(g, x, SY, SW, SH, 50); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill();
      g.lineWidth = 3; g.strokeStyle = 'rgba(251,184,41,.45)'; g.stroke();
      g.beginPath(); g.arc(x + 85, SY + 85, 52, 0, Math.PI * 2); g.fillStyle = C.gold; g.fill();
      g.fillStyle = C.ink; g.font = `800 62px ${DISPLAY}`; g.textAlign = 'center'; g.fillText(num, x + 85, SY + 106);
      g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = `800 64px ${DISPLAY}`; g.fillText(title, x + 165, SY + 106);
      g.fillStyle = 'rgba(255,255,255,.88)'; g.font = `500 46px ${BODY}`;
      wrap(g, text, SW - 100).forEach((ln, k) => g.fillText(ln, x + 50, SY + 215 + k * 62));
    });
    g.textAlign = 'center';

    // piede (tutto dentro la cornice)
    g.fillStyle = C.gold2; g.font = `700 50px ${BODY}`;
    g.fillText('100% anonimo · L’accesso resta aperto 20 minuti dopo la scansione', W / 2, 3250);
    const b1 = 'LISTA MIRAI', b2 = 'Il futuro inizia da noi', gap = 50;
    g.font = `800 66px ${DISPLAY}`; const w1 = g.measureText(b1).width;
    g.font = `700 54px ${BODY}`; const w2 = g.measureText(b2).width;
    const bx = (W - (w1 + gap + w2)) / 2; g.textAlign = 'left';
    g.fillStyle = '#fff'; g.font = `800 66px ${DISPLAY}`; g.fillText(b1, bx, 3335);
    g.fillStyle = C.gold; g.font = `700 54px ${BODY}`; g.fillText(b2, bx + w1 + gap, 3335);
    g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.4)'; g.font = `500 30px ${BODY}`;
    g.fillText(`${placeLabel}  ·  ${siteUrl.replace(/^https?:\/\//, '')}`, W / 2, 3385);
    return cv;
  }

  const toBlob = (cv, type = 'image/png', q) => new Promise((res) => cv.toBlob(res, type, q));

  /** PDF A4 con una pagina per foglio (immagini JPEG a tutta pagina). */
  async function pdf(canvases) {
    const enc = new TextEncoder(); const parts = []; let len = 0; const offsets = [];
    const push = (u8) => { parts.push(u8); len += u8.length; };
    const str = (s) => push(enc.encode(s));
    const jpgs = [];
    for (const cv of canvases) jpgs.push(new Uint8Array(await (await toBlob(cv, 'image/jpeg', 0.92)).arrayBuffer()));
    const N = canvases.length;
    // oggetti: 1 catalogo, 2 pagine, poi per ogni pagina: page, contenuto, immagine
    const pageId = (i) => 3 + i * 3, contId = (i) => 4 + i * 3, imgId = (i) => 5 + i * 3;
    str('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const obj = (id, body) => { offsets[id] = len; str(`${id} 0 obj\n${body}\nendobj\n`); };
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, `<< /Type /Pages /Count ${N} /Kids [${canvases.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] >>`);
    for (let i = 0; i < N; i++) {
      obj(pageId(i), `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${imgId(i)} 0 R >> >> /Contents ${contId(i)} 0 R >>`);
      const content = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
      obj(contId(i), `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      offsets[imgId(i)] = len;
      str(`${imgId(i)} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpgs[i].length} >>\nstream\n`);
      push(jpgs[i]); str('\nendstream\nendobj\n');
    }
    const total = 3 * N + 3, xref = len;
    str(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let id = 1; id < total; id++) str(String(offsets[id]).padStart(10, '0') + ' 00000 n \n');
    str(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const out = new Uint8Array(len); let p = 0; for (const u of parts) { out.set(u, p); p += u.length; }
    return new Blob([out], { type: 'application/pdf' });
  }

  return { render, pdf, toBlob, W, H };
})();
