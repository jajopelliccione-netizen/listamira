const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const D='/home/user/listamira/social/campagna/';
 const p = await b.newPage({ viewport: { width: 1080, height: 3400 } });
 await p.goto('file://'+D+'storia-sorpresa.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(2500);
 await p.locator('#a').screenshot({ path: D+'storia-sorpresa-1.png' });
 await p.locator('#b').screenshot({ path: D+'storia-sorpresa-2.png' });
 await b.close(); })();
