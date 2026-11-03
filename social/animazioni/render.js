const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'),{execSync}=require('child_process');
const [,, scene, mode] = process.argv; const FPS=30;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--allow-file-access-from-files']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto(`file:///home/user/listamira/social/animazioni/anim.html?s=${scene}&m=${mode}`);await p.waitForFunction('window.ready&&window.fontsOk');await p.waitForTimeout(800);
 const dur=await p.evaluate('window.DUR');const N=Math.round(dur*FPS);const dir=`/tmp/anim/${scene}-${mode}`;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
 for(let i=0;i<N;i++){await p.evaluate(t=>window.draw(t),i/FPS);await p.screenshot({path:`${dir}/f${String(i).padStart(4,'0')}.png`,omitBackground:mode==='alpha'})}
 await b.close();console.log(scene,mode,N,'frames');})();
