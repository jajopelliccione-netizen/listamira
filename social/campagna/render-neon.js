const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 3400 } });
 await p.goto('file:///home/user/listamira/social/campagna/neon.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(3000);
 for (let i=0;i<4;i++) await p.locator('#n'+i).screenshot({ path: '/home/user/listamira/social/campagna/neon-0'+(i+1)+'.png' });
 await b.close(); })();
