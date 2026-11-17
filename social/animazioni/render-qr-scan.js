const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs=require('fs'),{execSync}=require('child_process');
const FPS=30, S='/tmp/claude-0/-home-user-listamira/379fe77e-d5c1-5f17-a32f-000b71b6874b/scratchpad/qrscan';
const mode=process.argv[2]||'story', only=process.argv[3]; const H=mode==='post'?1350:1920;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--allow-file-access-from-files']});
 const p=await b.newPage({viewport:{width:1080,height:H}});
 await p.goto('file:///home/user/listamira/social/animazioni/qr-scan.html?m='+mode);await p.waitForFunction('window.ready&&window.fontsOk');await p.waitForTimeout(1500);
 fs.rmSync(S,{recursive:true,force:true});fs.mkdirSync(S,{recursive:true});
 if(only){for(const t of only.split(',')){await p.evaluate(t=>window.draw(t),+t);await p.screenshot({path:`${S}/t${t}.jpg`,type:'jpeg',quality:88})}await b.close();return}
 const dur=await p.evaluate('window.DUR');const N=Math.round(dur*FPS);
 for(let i=0;i<N;i++){await p.evaluate(t=>window.draw(t),i/FPS);await p.screenshot({path:`${S}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92})}
 await b.close();
 execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${S}/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart /home/user/listamira/social/animazioni/video/qr-scan-${mode==='post'?'post':'storia'}.mp4`);
 console.log('ok',N);})();
