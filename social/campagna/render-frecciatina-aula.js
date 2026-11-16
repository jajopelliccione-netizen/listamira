const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 3400 } });
 await p.goto('file:///home/user/listamira/social/campagna/storia-frecciatina-aula.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(3000);
 await p.locator('#a').screenshot({ path: '/home/user/listamira/social/campagna/storia-frecciatina-aula-1.png' });
 await p.locator('#b').screenshot({ path: '/home/user/listamira/social/campagna/storia-frecciatina-aula-2.png' });
 await b.close(); })();
