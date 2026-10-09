const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
 await p.goto('file:///home/user/listamira/social/collab/collab.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(1200);
 for (let i=0;i<5;i++) await p.locator('#s'+i).screenshot({ path: '/home/user/listamira/social/collab/storia-0'+(i+1)+'.png' }); await b.close(); })();
