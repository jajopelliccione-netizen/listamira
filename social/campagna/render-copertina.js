const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const D='/home/user/listamira/social/campagna/';
 const p = await b.newPage({ viewport: { width: 1080, height: 3400 } });
 await p.goto('file://'+D+'copertina-comunicato.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(2500);
 await p.locator('#p').screenshot({ path: D+'comunicato-copertina-post.png' });
 await p.locator('#s').screenshot({ path: D+'comunicato-copertina-storia.png' });
 await b.close(); })();
