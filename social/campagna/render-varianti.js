const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const D='/home/user/listamira/social/campagna/'; const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 3400 } });
 await p.goto('file://'+D+'condannati-varianti.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(1500);
 for (const [id,n] of [['a','A'],['b','B'],['c','C']]) await p.locator('#'+id).screenshot({ path: D+'condannati-var-'+n+'.png' }); await b.close(); })();
