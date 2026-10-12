const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
 await p.goto('file:///home/user/listamira/social/copertine/cop.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(2000);
 const n=['significato','programma','cps'];
 for (let i=0;i<3;i++) await p.locator('#c'+i).screenshot({ path: '/home/user/listamira/social/copertine/copertina-'+n[i]+'.png' });
 await b.close(); })();
