# Avvio e Deploy del Server Image Forge

Questa guida spiega come avviare il server in locale per lo sviluppo e come prepararlo per essere messo online (deploy) su altri server.

## 1. Avvio in Locale (Sviluppo)

Per testare il sistema sul tuo computer, hai bisogno di Node.js installato.

### Installazione delle dipendenze
La prima volta che scarichi il progetto, devi installare tutte le librerie necessarie. Apri il terminale nella cartella del progetto e digita:
```bash
npm install
```

### Configurazione
Assicurati che il file `.env` sia configurato correttamente (specialmente la parte relativa al server MinIO e alle credenziali `ADMIN_USERNAME` e `ADMIN_SECRET`).

### Avvio
Per avviare il server in modalità di sviluppo (che si riavvia automaticamente se modifichi i file di codice), usa:
```bash
npm run dev
```

Per un avvio classico, usa:
```bash
npm start
```
Il server sarà raggiungibile all'indirizzo `http://localhost:3003`.

---

## 2. Mettere il server online (Deploy)

Per pubblicare il progetto su un server remoto (es. un VPS Linux su DigitalOcean, AWS, o Aruba), segui questi passaggi generali.

### Prerequisiti sul server remoto
Il server remoto deve avere installati:
- **Node.js** (versione 18 o superiore)
- **Git** (per scaricare il codice)
- **PM2** (consigliato, per mantenere l'applicazione sempre attiva)

### Passaggi di Deploy
1. **Clona il codice**: Sul server, scarica il codice tramite Git o caricalo via FTP/SFTP.
2. **Installa dipendenze**: Entra nella cartella del progetto sul server e lancia `npm install --production`. (Il flag `--production` evita di installare tool utili solo allo sviluppo).
3. **Crea il file `.env`**: Crea il file `.env` sul server remoto inserendo le credenziali di produzione (password sicure e segreti complessi per i JWT).
4. **Avvia con PM2**: Per far sì che il server node non si fermi quando chiudi il terminale, installa PM2 globalmente:
   ```bash
   npm install -g pm2
   ```
   E poi avvia l'app tramite PM2:
   ```bash
   pm2 start server.js --name "image-forge"
   ```
5. **Salva i processi di PM2**: In modo che si riavviino se il server si spegne:
   ```bash
   pm2 save
   pm2 startup
   ```

### Reverse Proxy (Opzionale ma consigliato)
Per esporre la tua applicazione direttamente su una porta standard HTTP (80) o HTTPS (443) anziché sulla 3003, è consigliato usare **Nginx** o **Apache** come *Reverse Proxy*.
Questo permetterà di instradare il traffico da `https://api.tuosito.com` verso `http://localhost:3003` (dove gira Image Forge in background).
