const { chromium } = require(process.argv[2]); const fs = require('fs');
const specs = [['flyer-progetti', 640, 900, 4.5], ['flyer-instagram', 640, 900, 4.5], ['sticker', 400, 400, 4.5]];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  for (const [n, w, h, s] of specs) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: s });
    await p.goto('file:///home/user/listamira/stampa/' + n + '.html'); await p.waitForTimeout(2500); await p.evaluate(() => document.fonts.ready);
    await p.locator('#p').screenshot({ path: '/tmp/claude-0/hires-' + n + '.png' }); await p.close();
  }
  await b.close();
})();
