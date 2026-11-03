const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 3400 } });
 await p.goto('file:///home/user/listamira/social/campagna/campagna.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(3000);
 const O='/home/user/listamira/social/campagna/';
 for (let i=0;i<6;i++) await p.locator('#c'+i).screenshot({ path: O+'candidati-0'+(i+1)+'.png' });
 for (let i=0;i<6;i++) await p.locator('#g'+i).screenshot({ path: O+'programma-0'+(i+1)+'.png' });
 for (let i=0;i<6;i++) await p.locator('#w'+i).screenshot({ path: O+'storia-vento-0'+(i+1)+'.png' });
 await b.close(); })();
