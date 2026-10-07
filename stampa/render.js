const { chromium } = require(process.argv[2]);
const [,, , name, wmm, hmm, pxw, pxh, transparent] = process.argv;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: +pxw, height: +pxh }, deviceScaleFactor: 3 });
  await p.goto('file:///home/user/listamira/stampa/' + name + '.html'); await p.waitForTimeout(2500); await p.evaluate(() => document.fonts.ready);
  await p.locator('#p').screenshot({ path: '/home/user/listamira/stampa/' + name + '.png', omitBackground: !!transparent });
  await p.pdf({ path: '/home/user/listamira/stampa/' + name + '.pdf', width: wmm + 'mm', height: hmm + 'mm', printBackground: true, pageRanges: '1', scale: 1 });
  await b.close();
})();
