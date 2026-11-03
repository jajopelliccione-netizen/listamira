const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 3400 } });
 await p.goto('file:///home/user/listamira/social/campagna/neon.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(3000);
 const ids=['n0','n1','nOrg','nMot','n3','n2','nYear','nCta']; for (let i=0;i<ids.length;i++) await p.locator('#'+ids[i]).screenshot({ path: '/home/user/listamira/social/campagna/neon-0'+(i+1)+'.png' });
 await b.close(); })();
