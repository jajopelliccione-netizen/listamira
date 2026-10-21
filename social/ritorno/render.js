const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 3400 } });
 await p.goto('file:///home/user/listamira/social/ritorno/ritorno.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(2500);
 await p.locator('#p0').screenshot({ path: '/home/user/listamira/social/ritorno/post.png' });
 await p.locator('#s0').screenshot({ path: '/home/user/listamira/social/ritorno/storia.png' });
 await b.close(); })();
