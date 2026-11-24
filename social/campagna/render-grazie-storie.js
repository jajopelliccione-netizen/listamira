const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const D='/home/user/listamira/social/campagna/'; const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox','--allow-file-access-from-files'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 4400 } });
 await p.goto('file://'+D+'grazie-storie.html'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(1500);
 const names={s1:'01',s2:'02',s3:'03',s4:'04',s5:'05',s6:'06',s7:'07'};
 for (const [id,n] of Object.entries(names)) await p.locator('#'+id).screenshot({ path: D+'grazie-storia-'+n+'.png' }); await b.close(); })();
