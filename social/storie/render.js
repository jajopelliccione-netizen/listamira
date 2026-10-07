const { chromium } = require(process.argv[2]); const fs = require('fs');
(async () => {
  const list = JSON.parse(fs.readFileSync('storie.json'));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file:///home/user/listamira/social/storie/storie.html'); await p.waitForSelector('body[data-ready="1"]', { timeout: 20000 }); await p.waitForTimeout(800);
  for (const { i, name } of list) {
    const [k, id] = name.split('/'); fs.mkdirSync(k, { recursive: true });
    await p.locator('#s' + i).screenshot({ path: `${k}/${id}.png` });
  }
  await b.close();
})();
