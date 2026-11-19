#!/usr/bin/env python3
"""Post 'Per qualcuno siamo fascisti' + coppie PRIMA/DOPO (grafica viola e oro, come gli altri post).
Uso:  python3 build.py          (legge coppie.json: {"coppie":[{"prima":"a.jpg","dopo":"b.jpg", "blur_prima":[[x0,y0,x1,y1]], "zoom":1.5, "zoom_prima":1, "zoom_dopo":1.8, "focus_prima":[.5,.5], "focus_dopo":[.5,.5]}, ...]})
Poi:  node render.js"""
import json, re
from PIL import Image, ImageFilter
c = json.load(open('coppie.json'))['coppie']
def crop(src, dst, w=480, h=960, f=2, blur=(), zoom=1.0, focus=(0.5, 0.5)):
    im = Image.open(src).convert('RGB'); W, H = im.size
    for (x0, y0, x1, y1) in blur:                      # sfoca le persone sullo sfondo (riquadri in pixel della foto originale)
        box = (x0, y0, x1, y1); im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(34)), box)
    sc = max(w * f / W, h * f / H) * zoom
    im = im.resize((round(W * sc), round(H * sc)), Image.LANCZOS)
    L = int(min(max(focus[0] * im.width - w * f / 2, 0), im.width - w * f)); T = int(min(max(focus[1] * im.height - h * f / 2, 0), im.height - h * f))
    im.crop((L, T, L + w * f, T + h * f)).save(dst, quality=88)
CSS = open('../campagna/campagna.html', encoding='utf-8').read()
CSS = CSS[CSS.index('<style>'):CSS.index('</head>')]          # stessi stili degli altri post (viola, oro, Anton)
HEAD = '<!doctype html><html lang="it"><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@500;700;800&display=swap">' + CSS + '</head><body>'
SCRIPT = """<script>document.fonts.load('100px Anton').then(()=>document.fonts.ready).then(()=>{document.querySelectorAll('[data-max]').forEach(e=>{const m=document.createElement('span');m.style.cssText='position:absolute;left:-9999px;visibility:hidden;white-space:nowrap;text-transform:uppercase;font-family:Anton,Impact,sans-serif;line-height:1;font-size:'+e.dataset.max+'px';m.textContent=e.textContent;document.body.appendChild(m);const w=m.getBoundingClientRect().width;m.remove();e.style.fontSize=Math.min(+e.dataset.max,Math.floor(e.dataset.max*(+e.dataset.box||940)/w))+'px'});document.body.dataset.ready=1})</script></body></html>"""
def sec(id, i, n, v, inner, foot='Il futuro inizia da noi.'):
    return (f'<section class="c p v{v}" id="{id}"><div class="blob b1"></div><div class="blob b2"></div><div class="brand"><img src="../../assets/fox-96.png" alt="">Mirai</div><div class="n">{i:02d}/{n:02d}</div>{inner}'
            f'<div class="handle"><span>@lista.mirai</span><b>{foot}</b></div></section>')
total = 2 + len(c) + 2
s1 = sec('s1', 1, total, 0, '<div class="ctr"><span class="kick">In questi giorni</span><div class="h" style="display:flex;flex-direction:column;align-items:center;gap:2px"><div class="A w" data-max="230">Per qualcuno</div><div class="A o" data-max="230">siamo</div><div class="A g" data-max="260">fascisti.</div></div><div class="sub" style="font-size:50px;margin-top:10px">Vediamo se è vero.</div></div>', 'Scorri →')
card = lambda cls, t, d: f'<div class="card {cls}"><b>{t}</b><span>{d}</span></div>'
s2 = sec('s2', 2, total, 1, '<div class="ctr" style="top:130px;bottom:130px;gap:18px;justify-content:flex-start;padding-top:60px"><span class="kick">Cosa vuol dire davvero</span><div class="A g" data-max="150" style="margin:6px 0 0">Non è un insulto</div>'
         '<div style="width:100%;display:flex;flex-direction:column;gap:14px;margin-top:6px">'
         + card('gold', 'Storico: un regime', 'Un solo partito, niente voto libero, giornali censurati. Chi la pensava diversamente veniva zittito.')
         + card('vi', 'Politico: un’idea di potere', 'Comanda uno solo e l’opposizione non esiste. Si riconosce da quello che vieta: critiche, altre liste, altre idee.')
         + card('li', 'Figurato: un comportamento', 'Si dice di chi si impone con prepotenza e non ascolta. Ma serve un fatto, non basta una bandierina.')
         + '</div><div class="sub" style="font-size:38px;margin-top:10px"><span style="color:#ffc42e">Il filo comune:</span> zittire chi la pensa diversamente.</div></div>')
slides = [s1, s2]
for k, p in enumerate(c, 1):
    crop(p['prima'], f'foto/p{k:02d}-prima.jpg', blur=p.get('blur_prima', ()), zoom=p.get('zoom_prima', p.get('zoom', 1.0)), focus=p.get('focus_prima', (0.5, 0.5)))
    crop(p['dopo'], f'foto/p{k:02d}-dopo.jpg', blur=p.get('blur_dopo', ()), zoom=p.get('zoom_dopo', p.get('zoom', 1.0)), focus=p.get('focus_dopo', (0.5, 0.5)))
    panel = lambda x, lab, bg, f: (f'<div style="position:absolute;left:{x}px;top:195px;width:480px;height:960px;border-radius:30px;overflow:hidden;border:5px solid #fff;box-shadow:0 40px 70px -26px rgba(0,0,0,.8)"><img src="{f}" style="width:480px;height:960px;display:block"></div>'
                                   f'<div style="position:absolute;left:{x}px;width:480px;top:138px;text-align:center"><span class="kick" style="background:{bg};color:#12062b;font-size:34px;padding:10px 34px">{lab}</span></div>')
    slides.append(sec(f'p{k}', 2 + k, total, k % 3, panel(50, 'PRIMA', '#ffc42e', f'foto/p{k:02d}-prima.jpg') + panel(550, 'DOPO', '#fff', f'foto/p{k:02d}-dopo.jpg')))
slides.append(sec('sg', total - 1, total, 2, '<div class="ctr"><span class="kick">Facciamo chiarezza</span><div class="h" style="display:flex;flex-direction:column;align-items:center;gap:2px"><div class="A w" data-max="210">Questo sì</div><div class="A o" data-max="200">è un comportamento</div><div class="A g" data-max="250">fascista.</div></div>'
                  '<div class="desc" style="font-size:44px;max-width:900px;margin-top:8px">Censurare le idee degli altri.<br>Fare campagna contro <b style="color:#ffc42e">tutte le altre liste</b>.</div></div>'))
slides.append(sec('sf', total, total, 0, '<div class="ctr"><span class="kick">Lo lasciamo dire a voi</span><div class="h" style="display:flex;flex-direction:column;align-items:center;gap:2px"><div class="A w" data-max="210">Noi</div><div class="A g" data-max="300">continuiamo</div></div>'
                  '<div class="desc" style="font-size:46px;max-width:880px">A testa alta, con le nostre idee<br>e senza paura di nessuno.</div><span class="sticker" style="margin-top:14px">Con rispetto 💜</span></div>'))
open('post.html', 'w', encoding='utf-8').write(HEAD + '\n'.join(slides) + '\n' + SCRIPT)
open('slide-ids.json', 'w').write(json.dumps([re.search(r'id="(\w+)"', s).group(1) for s in slides])); print(len(slides), 'slide')
