#!/usr/bin/env python3
"""Prepara le foto del reel: le porta a 1080x1920, trova il volantino e il logo.
Uso:  python3 prepara.py foto1.jpg foto2.jpg ...   (nell'ordine in cui devono comparire)
Scrive foto/NN.jpg, foto/hook.jpg (alta risoluzione, per lo zoom sul logo) e foto.json."""
import sys, json, numpy as np
from collections import deque
from PIL import Image, ImageFilter

def biggest(m):
    H, W = m.shape; seen = np.zeros_like(m, bool); best = None
    for y in range(H):
        for x in range(W):
            if m[y, x] and not seen[y, x]:
                q = deque([(y, x)]); seen[y, x] = True; pts = []
                while q:
                    cy, cx = q.popleft(); pts.append((cy, cx))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; q.append((ny, nx))
                if best is None or len(pts) > len(best): best = pts
    return best

def cover(im, w, h):
    W, H = im.size; sc = max(w / W, h / H)
    im = im.resize((round(W * sc), round(H * sc)), Image.LANCZOS)
    L = (im.width - w) // 2; T = (im.height - h) // 2
    return im.crop((L, T, L + w, T + h))

def main(paths):
    out = []
    for i, p in enumerate(paths, 1):
        src = Image.open(p).convert('RGB')
        im = cover(src, 1080, 1920); im.save(f'foto/{i:02d}.jpg', quality=86)
        a = np.asarray(im.resize((270, 480))).astype(int); R, G, B = a[..., 0], a[..., 1], a[..., 2]
        m = ((B - G >= 12) & (R - G >= 2) & (B >= 40) & ((R + G + B) / 3 < 150))
        mi = Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
        pts = biggest(np.asarray(mi) > 127)
        if not pts:
            out.append({'file': f'foto/{i:02d}.jpg', 'box': [200, 500, 880, 1420], 'logo': [540, 700]}); print(i, 'volantino non trovato: uso il centro'); continue
        ys = np.array([q[0] for q in pts]); xs = np.array([q[1] for q in pts])
        x0, x1 = np.percentile(xs, [0.3, 99.7]); y0, y1 = np.percentile(ys, [0.3, 99.7])
        s = 4.0; pw = (x1 - x0) * s; ph = (y1 - y0) * s
        bx0, by0, bx1, by1 = x0 * s - pw * .05, y0 * s - ph * .045, (x1 + 1) * s + pw * .05, (y1 + 1) * s + ph * .045
        if (by1 - by0) / (bx1 - bx0) < 1.25:            # il QR bianco ha spezzato il viola: ricostruisco l'altezza dal foglio A4
            by1 = by0 + (bx1 - bx0) * 1.38
        bx0, by0, bx1, by1 = max(0, bx0), max(0, by0), min(1080, bx1), min(1920, by1)
        # logo: il pixel dorato/arancio nella fascia alta del volantino
        big = np.asarray(im).astype(int); h = by1 - by0
        ya, yb = int(by0 + .03 * h), int(by0 + .24 * h); xa, xb = int(bx0 + .25 * (bx1 - bx0)), int(bx0 + .75 * (bx1 - bx0))
        sub = big[ya:yb, xa:xb]; g = (sub[..., 0] > 170) & (sub[..., 1] > 100) & (sub[..., 2] < 120) & (sub[..., 0] - sub[..., 2] > 90)
        yy, xx = np.where(g)
        logo = [float(xa + np.median(xx)), float(ya + np.median(yy))] if len(xx) > 60 else [(bx0 + bx1) / 2, by0 + .16 * h]
        out.append({'file': f'foto/{i:02d}.jpg', 'box': [round(v) for v in (bx0, by0, bx1, by1)], 'logo': [round(v) for v in logo]})
        print(i, p.split('/')[-1], 'box', out[-1]['box'], 'logo', out[-1]['logo'])
    # foto per l'apertura con lo zoom sul logo: quella con il volantino piu' grande, in alta risoluzione
    best = max(range(len(out)), key=lambda k: (out[k]['box'][3] - out[k]['box'][1]) * (out[k]['box'][2] - out[k]['box'][0]))
    import os
    if os.environ.get('HOOK'): best = int(os.environ['HOOK']) - 1   # HOOK=16 -> usa la 16a foto per lo zoom iniziale
    cover(Image.open(paths[best]).convert('RGB'), 1440, 2560).save('foto/hook.jpg', quality=90)
    json.dump({'photos': out, 'hook': best}, open('foto.json', 'w'), indent=1)
    print('apertura con la foto', best + 1)

if __name__ == '__main__':
    main(sys.argv[1:])
