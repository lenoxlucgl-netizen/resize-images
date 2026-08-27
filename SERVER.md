# Image Resize - Setup su Windows

Ecco gli step per tirare su il progetto su Windows.
Ho configurato tutto usando **Docker Compose**, così ci togliamo dai piedi i soliti problemi di compatibilità e non devi sbatterti a installare Node.js, MySQL o MinIO a mano. Con un comando parte tutto da solo e si configura in automatico pescando le variabili dal file `.env.docker`.

---

## 1. Prerequisiti

Ti serviranno solo due cose:
- **Docker Desktop** installato e aperto sulla macchina.
- Git (per clonare il progetto)

---

## 2. Clonare il repository

Scarichiamoci il codice:
```powershell
git clone https://github.com/TUO_UTENTE/resize-images.git
cd resize-images
```

---

## 3. Avviare tutti i servizi (Il metodo magico)

Su Windows ti ho preparato uno script. Ti basta fare **doppio click sul file `avvia_tutto.bat`** che trovi nella cartella.

Se preferisci il terminale, lancia:
```powershell
docker compose up -d --build
```

Questo comando legge il file `docker-compose.yml` e tira su una serie di container che parlano tra di loro:
- **L'app Node.js** (`http://localhost:3003`)
- **Il server MinIO** per salvare le immagini (`http://localhost:9001`)
- **Il database MySQL** (dietro le quinte)
- **phpMyAdmin** per guardare e gestire il DB in comodità (`http://localhost:8080`)
- **Redis** per essere pronto a gestire future code o eventi.

Nota: vedrai magicamente comparire due cartelle nel progetto (`minio_data` e `mysql_data`). Le ho impostate in modo da salvarti lì dentro i file e il database, così li hai sempre a vista e non perdi niente.

---

## 4. Credenziali e Accesso

L'ambiente si autoconfigura al primo avvio grazie al file `.env.docker`. Vengono creati da soli il database, le tabelle, l'utente admin e il bucket MinIO, così è tutto pronto all'uso.

**Dashboard Web (http://localhost:3003):**
- Username: `admin`
- Password: `0dPw16X22k2t2C.` (se è quella preimpostata nel DB)

**MinIO Console (http://localhost:9001):**
- Username: `minioadmin`
- Password: `minioadmin`

**phpMyAdmin (http://localhost:8080):**
- Entra direttamente senza chiederti nulla (le password gliele passa in automatico).

---

## 5. Test Upload veloce da terminale

Se vuoi testare al volo se carica la roba (ricordati di generare prima un'API key dalla dashboard):
```powershell
curl -X POST `
  -H "x-api-key: imgf_TUA_API_KEY" `
  -F "file=@test.jpg" `
  -F "keepOriginal=true" `
  -F "sizes=200x200" `
  http://localhost:3003/api/files/upload-api
```

---

## (Opzionale) Sviluppo Manuale senza Docker

Se per qualche motivo vuoi farti del male e sviluppare fuori da Docker, devi fare tutto a mano:

1. Avvia MySQL, Redis e MinIO sul tuo PC.
2. Crea il bucket `savedimages` e le tabelle nel database.
3. Copia il file `.env.docker` (o un `.env.example`) in un nuovo file `.env` e imposta le credenziali giuste:
   ```env
   PORT=3003
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=latuapassword
   MINIO_ENDPOINT=http://127.0.0.1:9000
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=minioadmin
   ```
4. Dai `npm install` e poi avvia con `npm run dev`.
