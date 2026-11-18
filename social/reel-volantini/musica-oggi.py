#!/usr/bin/env python3
"""Genera la base musicale (originale, nessun diritto d'autore) a 120 BPM, allineata agli stacchi del reel.
Legge foto.json per sapere quante foto ci sono (stessi tempi di reel.html). Scrive musica-oggi.wav (video 'oggi.html', parte subito)."""
import json, wave, numpy as np
SR = 44100; BEAT = 0.5
N = len(json.load(open('foto.json'))['photos'])
import math
ND = len(json.load(open('dopo.json'))['files'])
T_BURST = 0.0; T_SPIN = T_BURST + math.ceil(N * 0.25 / 0.5) * 0.5; T_END = T_SPIN + 8.0 + ND * 1.0; DUR = T_END + 7.0   # video 'oggi': parte subito con le foto
rng = np.random.default_rng(7)
L = np.zeros(int(DUR * SR) + SR); Rr = np.zeros_like(L)          # canali
BASS = np.zeros_like(L); ARP = np.zeros_like(L)                  # sottoposti a sidechain
def add(buf, sig, t0, g=1.0, pan=0.0):
    i = int(t0 * SR); 
    if i < 0 or i >= len(buf): return
    n = min(len(sig), len(buf) - i); buf[i:i + n] += sig[:n] * g
def stereo(sig, t0, g=1.0, pan=0.0):
    add(L, sig, t0, g * (1 - max(0, pan)), 0); add(Rr, sig, t0, g * (1 + min(0, pan)), 0)
def t_(d): return np.arange(int(d * SR)) / SR
def kick(t0, g=1.0):
    t = t_(.38); f = 48 + 130 * np.exp(-t * 32); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 8.5) + 0.25 * rng.standard_normal(len(t)) * np.exp(-t * 180)
    stereo(s, t0, 0.95 * g)
def clap(t0, g=1.0):
    t = t_(.22); n = rng.standard_normal(len(t)); n = np.diff(n, prepend=0)
    env = np.exp(-t * 26) * (1 + 0.8 * (np.sin(t * 2 * np.pi * 95) > 0.5) * np.exp(-t * 60))
    s = n * env * .55 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28) * .35
    stereo(s, t0, .55 * g, .1)
def hat(t0, g=1.0, op=False):
    t = t_(.28 if op else .05); n = np.diff(rng.standard_normal(len(t)), n=2, prepend=[0, 0])
    stereo(n * np.exp(-t * (14 if op else 70)), t0, .30 * g, .25 * (1 if int(t0 * 4) % 2 else -1))
def note(f, d, harm=(1, .3, .12), att=.006, dec=0):
    t = t_(d); s = sum(a * np.sin(2 * np.pi * f * (k + 1) * t) for k, a in enumerate(harm))
    e = np.minimum(t / att, 1) * np.exp(-t * dec) * np.minimum((d - t) / .03, 1).clip(0, 1)
    return s * e
def riser(t0, t1, g=1.0):
    d = t1 - t0; t = t_(d); u = t / d
    n = rng.standard_normal(len(t)); hp = np.diff(n, prepend=0); mix = n * (1 - u) * .5 + hp * u
    sweep = np.sin(2 * np.pi * np.cumsum(180 + 2400 * u ** 2) / SR)
    s = (mix * .35 + sweep * .22) * (u ** 2.2)
    stereo(s, t0, g)
def impact(t0, g=1.0):
    t = t_(1.8); sub = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 14)) * t) * np.exp(-t * 2.2)
    n = np.diff(rng.standard_normal(len(t)), prepend=0) * np.exp(-t * 3.2) * .5
    stereo(sub * .9 + n, t0, g); kick(t0, 1.1)
chords = [([55, 220, 261.63, 329.63]), ([43.65, 174.61, 220, 261.63]), ([65.41, 261.63, 329.63, 392]), ([49, 196, 246.94, 293.66])]
def bar_idx(t): return int((t - T_BURST) // 2.0) % 4
# --- apertura: riser + battito, poi il drop a 2.0 ---
# --- groove ---
t = T_BURST
while t < DUR - .01:
    beat = int(round((t - T_BURST) / BEAT)); in_end = t >= T_END
    drop_gap = (T_END - .16 <= t < T_END)
    if t == T_BURST or t == T_END: impact(t, 1.0 if t == T_BURST else 1.25)
    elif not drop_gap and not (T_SPIN - .5 <= t < T_SPIN and False): kick(t)
    if beat % 2 == 1 and not drop_gap: clap(t)
    hat(t + .25, .9)
    hat(t + .125, .28); hat(t + .375, .28)
    if beat % 4 == 3: hat(t + .25, .7, op=True)
    t += BEAT
# basso e arpeggio, per battute da 2 secondi, in La minore: Am - F - C - G
b0 = T_BURST
while b0 < DUR:
    ch = chords[bar_idx(b0)]; root = ch[0]
    for s8 in range(8):
        tt = b0 + s8 * .25
        if T_END - .16 <= tt < T_END or tt < T_BURST: continue
        f = root * (2 if s8 in (3, 6) else 1)
        add(BASS, note(f, .22, (1, .35, .12), dec=3), tt, .55)
    for s16 in range(16):
        tt = b0 + s16 * .125
        if T_END - .16 <= tt < T_END or tt < T_BURST: continue
        tones = [ch[1], ch[2], ch[3], ch[1] * 2, ch[2] * 2, ch[3] * 2]
        f = tones[[0, 1, 2, 3, 2, 1, 4, 2, 5, 3, 2, 1, 0, 2, 4, 3][s16] % 6]
        g = .20 if T_SPIN <= tt < T_END + 7 else .13
        add(ARP, note(f, .24, (1, .45, .2, .08), att=.003, dec=11), tt, g)
    b0 += 2.0
# pompaggio col kick
tt = np.arange(len(BASS)) / SR; duck = 1 - .62 * np.exp(-(((tt - T_BURST) % BEAT)) * 11); duck[tt < T_BURST] = 1
pan = .18
for sig, g in ((BASS, 1.0), (ARP, 1.0)):
    L += sig * duck * g * (1 - pan * (sig is ARP)); Rr += sig * duck * g * (1 + pan * (sig is ARP))
# --- salita e silenzio prima del finale ---
riser(T_SPIN - 2.0, T_END - .02, .9) if False else None
riser(T_END - 3.0, T_END - .02, 1.0)
for k in range(16): clap(T_END - 1.0 + k * .0625, .12 + .06 * k)
# --- master ---
mix = np.stack([L, Rr], 1)[: int(DUR * SR)]
fade = np.ones(len(mix)); f0 = int((DUR - 1.6) * SR); fade[f0:] = np.linspace(1, 0, len(mix) - f0) ** 1.5; mix *= fade[:, None]
mix = np.tanh(1.25 * mix) / np.tanh(1.25); mix *= .74 / max(1e-9, np.abs(mix).max())
with wave.open('musica-oggi.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('musica-oggi.wav', round(DUR, 1), 's', 'picco', round(float(np.abs(mix).max()), 2), 'rms', round(float(np.sqrt((mix ** 2).mean())), 3))
