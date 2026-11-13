const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 3400 } });
 await p.goto('file:///home/user/listamira/social/campagna/sito-qr.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(3000);
 for (let i=1;i<=6;i++) await p.locator("#p"+i).screenshot({ path: `/home/user/listamira/social/campagna/sito-post-0${i}.png` });
 for (let i=1;i<=5;i++) await p.locator("#s"+i).screenshot({ path: `/home/user/listamira/social/campagna/sito-storia-0${i}.png` });
 await b.close(); })();
