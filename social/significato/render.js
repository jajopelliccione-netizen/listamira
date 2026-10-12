const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
 await p.goto('file:///home/user/listamira/social/significato/sig.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(2500);
 for (let i=0;i<4;i++) await p.locator('#p'+i).screenshot({ path: '/home/user/listamira/social/significato/post-0'+(i+1)+'.png' });
 for (let i=0;i<4;i++) await p.locator('#s'+i).screenshot({ path: '/home/user/listamira/social/significato/storia-0'+(i+1)+'.png' });
 await b.close(); })();
