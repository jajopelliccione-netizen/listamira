function drawQR(el, text, dark) {
  const q = qrcode(0, 'Q'); q.addData(text); q.make();
  const n = q.getModuleCount(), quiet = 2, s = n + quiet * 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + quiet},${r + quiet}h1v1h-1z`;
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges"><rect width="${s}" height="${s}" fill="#fff"/><path d="${d}" fill="${dark || '#3b1670'}"/></svg>`;
}
