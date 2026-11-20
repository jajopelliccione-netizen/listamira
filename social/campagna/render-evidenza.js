const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const D='/home/user/listamira/social/campagna/'; const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 4000 } });
 await p.goto('file://'+D+'copertina-evidenza.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(1200);
 await p.locator('#a').screenshot({ path: D+'evidenza-23-novembre.png' }); await p.locator('#b').screenshot({ path: D+'evidenza-vota-mirai.png' }); await b.close(); })();
