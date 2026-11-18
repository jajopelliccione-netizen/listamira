// Uso: node render.js            -> video completo (senza audio)  |  node render.js stills 1,5,12 -> solo alcuni fotogrammi
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs=require('fs'), {execSync}=require('child_process');
const D=__dirname, S='/tmp/claude-0/-home-user-listamira/379fe77e-d5c1-5f17-a32f-000b71b6874b/scratchpad/reel-frames', FPS=30;
(async()=>{
  const cfg=JSON.parse(fs.readFileSync(D+'/foto.json'));
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:1080,height:1920}});
  p.on('pageerror',e=>console.log('PAGEERROR',e.message));
  await p.addInitScript(c=>{window.CFG=c;},cfg);
  await p.goto('file://'+D+'/reel.html'); await p.waitForFunction('window.ready&&window.fontsOk',{timeout:60000}); await p.waitForTimeout(1200);
  fs.rmSync(S,{recursive:true,force:true}); fs.mkdirSync(S,{recursive:true});
  if(process.argv[2]==='stills'){ for(const t of process.argv[3].split(',')){ await p.evaluate(t=>window.draw(t),+t); await p.screenshot({path:`${S}/t${t}.jpg`,type:'jpeg',quality:88}); } await b.close(); return; }
  const dur=await p.evaluate('window.DUR'), n=Math.round(dur*FPS);
  for(let i=0;i<n;i++){ await p.evaluate(t=>window.draw(t),i/FPS); await p.screenshot({path:`${S}/f${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:90}); if(i%60===0) console.log(i+'/'+n); }
  await b.close();
  execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${S}/f%05d.jpg -c:v libx264 -pix_fmt yuv420p -crf 17 -preset medium ${D}/reel-muto.mp4`);
  console.log('video senza audio pronto, durata', dur);
})();
