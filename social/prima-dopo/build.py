#!/usr/bin/env python3
"""Post 'Ci chiamano fascisti' + coppie PRIMA/DOPO dei volantini.
Uso:  python3 build.py          (legge coppie.json: {"coppie":[{"prima":"foto1.jpg","dopo":"foto2.jpg","blur_prima":[[x0,y0,x1,y1]]}, ...]} (blur_* opzionale: sfoca persone sullo sfondo))
Poi:  node render.js            (crea slide-01.png, slide-02.png, ...)"""
import json, re
from PIL import Image
c = json.load(open('coppie.json'))['coppie']
from PIL import ImageFilter
def crop(src, dst, w=480, h=960, f=2, blur=()):
    im = Image.open(src).convert('RGB'); W, H = im.size
    for (x0, y0, x1, y1) in blur:                      # sfoca le persone sullo sfondo (riquadri in pixel della foto originale)
        box = (x0, y0, x1, y1); im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(34)), box)
    sc = max(w * f / W, h * f / H)
    im = im.resize((round(W * sc), round(H * sc)), Image.LANCZOS); L = (im.width - w * f) // 2; T = (im.height - h * f) // 2
    im.crop((L, T, L + w * f, T + h * f)).save(dst, quality=88)
head = open('../campagna/sito-qr.html', encoding='utf-8').read()
pre = head[:head.index('<section')]; post = head[head.rindex('</section>') + 10:]
def sec(id, i, n, flip, inner, foot='Il futuro inizia da noi.'):
    return (f'<section class="s" id="{id}"><div class="beam"{" style=\"transform:scaleX(-1)\"" if flip else ""}></div><div class="glow" style="width:800px;height:800px;background:#ff3cbe;left:-300px;top:30%;opacity:.5"></div><div class="glow" style="width:700px;height:700px;background:#ff8a3c;right:-300px;bottom:-100px;opacity:.5"></div>'
            f'<div class="brand" style="top:62px"><img src="../../assets/fox-96.png" alt="">Mirai</div><div class="n" style="top:70px">{i:02d}/{n:02d}</div>{inner}<div class="foot" style="bottom:60px"><span>@lista.mirai</span><b>{foot}</b></div></section>')
total = 2 + len(c) + 1
s1 = sec('s1', 1, total, False, '<div class="ctr" style="top:140px;bottom:140px"><span class="pill">In questi giorni</span><div class="A" style="display:flex;flex-direction:column;align-items:center;gap:8px"><div class="w" data-max="190" data-box="940">Per qualcuno</div><div class="pk" data-max="260" data-box="940">siamo fascisti</div></div><div class="sub" style="font-size:50px;max-width:860px">Vediamo se è <span style="color:#ffc42e">vero</span>.</div></div>', 'Scorri →')
card = lambda t, d, col: f'<div style="display:flex;gap:22px;align-items:center;text-align:left;width:900px"><div style="flex:none;width:18px;height:90px;border-radius:9px;background:{col}"></div><div><div style="font:800 40px/1.1 \'DM Sans\'">{t}</div><div style="font:500 30px/1.25 \'DM Sans\';opacity:.92;margin-top:4px">{d}</div></div></div>'
s2 = sec('s2', 2, total, True, '<div class="ctr" style="top:130px;bottom:130px;gap:26px"><span class="pill">Cosa vuol dire davvero</span><div class="A pk" data-max="200" data-box="940">Fascista</div>'
         + card('Storico', 'Il regime di Mussolini in Italia, finito con la guerra.', '#ff3cbe') + card('Politico', 'Nazionalismo estremo, autoritarismo, repressione dell’opposizione, rifiuto della democrazia.', '#ff8a3c')
         + card('Figurato', 'Si usa per atteggiamenti autoritari, prepotenti o repressivi.', '#3cf0ff') + '<div class="sub" style="font-size:36px;max-width:860px;margin-top:6px"><span style="color:#ffc42e">Noi?</span> Chiediamo il voto e le vostre idee, anche anonime.</div></div>')
slides = [s1, s2]
for k, p in enumerate(c, 1):
    crop(p['prima'], f'foto/p{k:02d}-prima.jpg', blur=p.get('blur_prima', ())); crop(p['dopo'], f'foto/p{k:02d}-dopo.jpg', blur=p.get('blur_dopo', ()))
    panel = lambda x, lab, col, tc, f: (f'<div style="position:absolute;left:{x}px;top:195px;width:480px;height:960px;border-radius:26px;overflow:hidden;border:5px solid #fff;box-shadow:0 0 50px rgba(255,60,190,.45),0 30px 60px -20px rgba(0,0,0,.8)"><img src="{f}" style="width:480px;height:960px;display:block"></div>'
                                       f'<div style="position:absolute;left:{x}px;width:480px;top:140px;text-align:center"><span style="display:inline-block;background:{col};color:{tc};font:800 36px \'DM Sans\';letter-spacing:.12em;padding:10px 34px;border-radius:99px;box-shadow:0 0 30px {col}">{lab}</span></div>')
    slides.append(sec(f'p{k}', 2 + k, total, k % 2 == 0, panel(50, 'PRIMA', '#ffc42e', '#12062b', f'foto/p{k:02d}-prima.jpg') + panel(550, 'DOPO', '#ff3c5f', '#fff', f'foto/p{k:02d}-dopo.jpg')))
slides.append(sec('sf', total, total, True, '<div class="ctr" style="top:140px;bottom:140px"><span class="pill">Lo lasciamo dire a voi</span><div class="A" style="display:flex;flex-direction:column;align-items:center;gap:8px"><div class="w" data-max="190" data-box="940">Noi</div><div class="or" data-max="300" data-box="940">continuiamo</div></div><div class="sub" style="font-size:46px;max-width:860px">A testa alta, con le nostre idee<br>e <span style="color:#ffc42e">senza paura di nessuno</span>.</div></div>'))
open('post.html', 'w', encoding='utf-8').write(pre + '\n'.join(slides) + '\n' + post)
open('slide-ids.json', 'w').write(json.dumps([re.search(r'id="(\w+)"', s).group(1) for s in slides])); print(len(slides), 'slide')
