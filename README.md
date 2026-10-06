# Lista Mira

Sito di presentazione della lista + area proposte anonime accessibile solo scansionando i QR code della scuola.

## Avvio
```bash
npm install
ADMIN_PASSWORD="scegli-una-password" npm start   # http://localhost:3000
```
Senza `ADMIN_PASSWORD` ne viene generata una e salvata in `data/.admin-password` (stampata al primo avvio).

## Come funziona
- **Sito**: `public/` — i testi (nome lista, programma, candidati, FAQ, contatti) si modificano in `config/site.json`.
- **Admin** (`/admin`): crea QR con il nome del posto, scarica PNG/SVG, stampa i cartelli A4, disattiva/elimina i QR, legge le proposte (stato, filtri, export CSV).
- **QR → proposta**: il QR apre `/q/<codice>`, che apre una sessione di 20 minuti e porta a `/proponi`. Senza QR valido (o con QR disattivato) il form e l'API sono bloccati.
- **Anonimato**: si salvano solo testo, categoria, QR di provenienza e orario al minuto. Nessun IP/user-agent su disco (il rate-limit è solo in memoria).

## Prima di stampare i QR
In **Admin → Impostazioni** imposta l'indirizzo definitivo del sito (es. `https://listamira.it`): i QR lo contengono.

## Deploy
Serve un hosting Node (Render, Railway, Fly, VPS…) con **HTTPS** e un disco persistente per `data/`. Variabili: `PORT`, `ADMIN_PASSWORD`, `SECRET` (opzionale).
