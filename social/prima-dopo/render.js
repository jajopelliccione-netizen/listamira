const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
(async () => { const D = __dirname + '/', ids = JSON.parse(fs.readFileSync(D + 'slide-ids.json'));
 const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 3400 } });
 await p.goto('file://' + D + 'post.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(2500);
 for (let i = 0; i < ids.length; i++) await p.locator('#' + ids[i]).screenshot({ path: D + 'slide-' + String(i + 1).padStart(2, '0') + '.png' });
 await b.close(); console.log(ids.length, 'slide create'); })();
