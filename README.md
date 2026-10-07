# Lista Mirai

Sito di presentazione della lista (ITIS Galileo Galilei, Roma) + area proposte anonime accessibile **solo scansionando i QR della scuola**.
È un sito statico (GitHub Pages); proposte, QR e login admin usano **Firebase** (piano gratuito Spark).

## Setup Firebase (una volta sola, ~10 minuti)
1. <https://console.firebase.google.com> → **Aggiungi progetto** (disattiva Google Analytics, non serve).
2. **Build → Firestore Database → Crea database** (modalità produzione, regione `europe-west`).
3. **Build → Authentication → Inizia → Email/password → Abilita**. Poi scheda **Utenti → Aggiungi utente**: l'email e la password dell'admin.
   *(Impostazioni → Azioni utente: disattiva "Abilita creazione (registrazione)".)*
4. **Firestore → Regole**: apri `firestore.rules`, sostituisci `LA-TUA-EMAIL-ADMIN@esempio.it` con l'email admin, incolla tutto e **Pubblica**.
5. **Impostazioni progetto (ingranaggio) → Generali → Le tue app → Web (`</>`)**: registra un'app web e copia `apiKey` e `projectId` in `config/site.json`:
   ```json
   "firebase": { "apiKey": "AIza...", "projectId": "il-tuo-progetto" }
   ```
   (La apiKey Firebase è pubblica per design: la sicurezza sta nelle regole. Facoltativo: in Google Cloud → Credenziali limitala al tuo dominio `jajopelliccione-netizen.github.io`.)
6. Commit/push: GitHub Pages ripubblica da solo.

## Uso
- **/admin/** → email/password dell'admin. Crea i QR (uno per posto), scarica PNG/SVG o stampa cartelli A4, disattiva i QR, leggi le proposte, cambia stato, esporta CSV.
- Il QR apre `proponi.html?c=<codice>`. Il codice è l'ID di un documento Firestore che non si può elencare: senza averlo scansionato non si può inviare nulla, e la regola di sicurezza accetta proposte solo per QR attivi. Sessione di 20 minuti.
- Testi del sito: `config/site.json`.

## Anonimato
Si salvano solo testo, categoria, QR di provenienza e data/ora d'invio. Nessun IP, dispositivo o nome. (Google tiene i suoi log tecnici standard sull'infrastruttura.)
