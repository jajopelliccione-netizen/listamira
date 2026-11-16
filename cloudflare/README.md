# Notifiche push di Mirai (Cloudflare Worker)

Il Worker riceve dal sito "QR scansionato" / "nuova proposta", controlla che il QR esista ed sia attivo, e manda una notifica push all'app **Mirai** (admin) installata sul telefono. È gratuito (piano Free di Cloudflare, senza carta).

## Setup (una volta sola)
1. Cloudflare → **Workers & Pages → Create → Worker**, nome `mirai-push`, **Deploy**, poi **Edit code**: sostituisci tutto con il contenuto di `cloudflare/worker.js` e **Deploy**.
2. **Storage & Databases → KV → Create namespace**: nome `mirai-kv`.
3. Worker `mirai-push` → **Settings → Bindings → Add → KV namespace**: nome variabile **`MIRAI`**, namespace `mirai-kv` → **Deploy**.
4. Copia l'indirizzo del Worker (`https://mirai-push.<tuo-nome>.workers.dev`) in `config/site.json`:
   ```json
   "notify": { "workerUrl": "https://mirai-push.<tuo-nome>.workers.dev", "ntfyTopic": "..." }
   ```
   (Con `workerUrl` vuoto il sito usa ntfy come ripiego.)
5. Verifica: aprendo `<indirizzo>/vapid` deve comparire `{"publicKey":"..."}`.

## Sul telefono
Apri `https://listamirai.com/admin/` in **Safari** → Condividi → **Aggiungi alla schermata Home** (nome *Mirai*). Apri Mirai dalla Home, accedi, premi **Attiva le notifiche**, poi **Invia una prova**. (iOS 16.4 o successivo.)

## Sicurezza
- Le chiavi VAPID si creano da sole al primo uso e restano nel KV: nessun segreto nel repo.
- `/subscribe` e `/test` funzionano solo con il login admin (il Worker verifica il token con Firestore: solo l'admin può elencare i QR).
- `/event` accetta solo QR esistenti e attivi, al massimo una notifica ogni 3 secondi per QR, e non riceve mai il testo delle proposte.
