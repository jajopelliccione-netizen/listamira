#!/usr/bin/env python3
"""Foto da mostrare DOPO il messaggio sulle altre liste (a tutto schermo, 1 secondo l'una, taglio netto).
Uso:  python3 prepara_dopo.py foto1.jpg foto2.jpg ...   (nell'ordine in cui devono comparire)"""
import sys, json, os
from PIL import Image
os.makedirs('dopo', exist_ok=True)
files = []
for i, p in enumerate(sys.argv[1:], 1):
    im = Image.open(p).convert('RGB'); W, H = im.size; sc = max(1080 / W, 1920 / H)
    im = im.resize((round(W * sc), round(H * sc)), Image.LANCZOS); L = (im.width - 1080) // 2; T = (im.height - 1920) // 2
    fn = f'dopo/{i:02d}.jpg'; im.crop((L, T, L + 1080, T + 1920)).save(fn, quality=86); files.append(fn)
json.dump({'files': files}, open('dopo.json', 'w'), indent=1); print(len(files), 'foto salvate')
