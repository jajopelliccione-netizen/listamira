#!/usr/bin/env python3
"""Ordine delle foto per il video 'foto': 3 giri delle stesse foto, mescolati in modo che
la stessa foto non torni mai vicina (almeno MIN scatti di distanza) e non ci siano due foto uguali di fila.
Scrive seq.json. Legge foto.json per sapere quante foto ci sono."""
import json, random
N = len(json.load(open('foto.json'))['photos']); GIRI = 3; MIN = 36   # almeno 36 scatti (circa 3,5 secondi) tra due apparizioni della stessa foto
rnd = random.Random(2026)
seq = rnd.sample(range(N), N)                       # primo giro: ordine casuale
last = {i: k for k, i in enumerate(seq)}            # posizione dell'ultima apparizione di ogni foto
for g in range(1, GIRI):
    rimaste = set(range(N)); giro = []
    for k in range(N):
        pos = g * N + k
        ok = [i for i in rimaste if pos - last[i] >= MIN]   # solo foto non viste da poco
        i = rnd.choice(ok); rimaste.discard(i); giro.append(i); last[i] = pos
    seq += giro
pos = {}; mind = 10**9
for k, i in enumerate(seq):
    if i in pos: mind = min(mind, k - pos[i])
    pos[i] = k
assert all(seq[k] != seq[k + 1] for k in range(len(seq) - 1))
print('foto', N, 'scatti', len(seq), 'distanza minima tra due apparizioni della stessa foto:', mind, 'scatti')
json.dump({'seq': seq}, open('seq.json', 'w'))
