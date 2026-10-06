# Lista Mira

Sito di presentazione della lista (ITIS Galileo Galilei, Roma) + area proposte anonime accessibile **solo scansionando i QR della scuola**.
È un sito statico (funziona su GitHub Pages); proposte, QR e login admin usano **Supabase** (database gratuito).

## Setup (una volta sola, ~10 minuti)
1. Crea un progetto gratuito su <https://supabase.com> (regione Europa).
2. **SQL Editor** → apri `supabase/schema.sql`, sostituisci `LA-TUA-EMAIL-ADMIN@esempio.it` con la tua email admin, incolla tutto e premi **Run**.
3. **Authentication → Users → Add user**: la stessa email + una password robusta (spunta "Auto confirm").
4. **Authentication → Sign In / Providers**: disattiva **Allow new users to sign up** (e "Confirm email" non serve).
5. **Project Settings → API**: copia *Project URL* e la chiave *anon public* e incollale in `config/site.json`:
   ```json
   "supabase": { "url": "https://xxxx.supabase.co", "anonKey": "eyJ..." }
   ```
   (la chiave anon è pubblica per design: la sicurezza è nelle regole del database.)
6. Fai commit/push: GitHub Pages ripubblica da solo.

## Uso
- **/admin/** → login con l'email/password creata al punto 3. Crea i QR (uno per ogni posto), scarica PNG/SVG o stampa i cartelli A4, disattiva i QR, leggi le proposte e cambia stato, esporta CSV.
- Il QR apre `proponi.html?c=<codice>`: il codice viene verificato **nel database**; la sessione dura 20 minuti. Senza QR valido non si può inviare nulla (anche chiamando il database a mano).
- Testi del sito (nome, programma, candidati, FAQ, contatti): `config/site.json`.

## Anonimato
Si salvano solo testo, categoria, QR di provenienza e orario al minuto. Nessun IP/dispositivo/cookie di tracciamento viene salvato dal sito (l'infrastruttura Supabase tiene i suoi log tecnici standard).
