# Resize Images - Guida Installazione Windows

## 1. Prerequisiti Windows

Installare:

- Node.js 20 LTS
- Git
- MinIO per Windows

Verifica installazioni:

powershell
node -v
npm -v
git --version


---

## 2. Clonare il repository

powershell
git clone https://github.com/TUO_UTENTE/resize-images.git
cd resize-images


---

## 3. Installazione dipendenze

### Ambiente di sviluppo

powershell
npm install


### Ambiente di produzione

powershell
npm install --omit=dev


---

## 4. Configurazione del file .env

Creare il file:

powershell
copy .env.example .env
notepad .env


Configurazione esempio:

env
PORT=3003
NODE_ENV=development

APP_SECRET=STRINGA_CASUALE

ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=HASH_SHA256

STORAGE_TYPE=minio

MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

MINIO_BUCKET=savedimages

RESIZE_SIZES=200x200,400x400,680x680
KEEP_ORIGINAL=true
RESIZED_PATH=/thumbs


---

## 5. Generare APP_SECRET

powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"


Copiare il valore generato nel parametro:

env
APP_SECRET=


---

## 6. Generare ADMIN_PASSWORD_HASH

Password di esempio:

text
Password123!


Generazione hash:

powershell
node -e "const c=require('crypto'); console.log(c.createHash('sha256').update('Password123!').digest('hex'));"


Copiare il risultato nel parametro:

env
ADMIN_PASSWORD_HASH=


---

## 7. Avvio di MinIO

### Avvio standard

powershell
.\minio.windows-amd64.RELEASE.2025-09-07T16-13-09Z.exe server data


### Avvio con credenziali personalizzate

powershell
$env:MINIO_ROOT_USER="minioadmin"
$env:MINIO_ROOT_PASSWORD="PasswordMoltoSicura"

.\minio.windows-amd64.RELEASE.2025-09-07T16-13-09Z.exe server data


### Endpoint disponibili

**API S3**

text
http://localhost:9000


**Console Web**

text
http://localhost:9001


---

## 8. Creazione del bucket

Aprire:

text
http://localhost:9001


Accedere con:

text
Username: minioadmin
Password: PasswordMoltoSicura


Creare il bucket:

text
savedimages


---

## 9. Avviare l'applicazione

### Ambiente di sviluppo

powershell
npm run dev


### Ambiente di produzione

powershell
npm start


Applicazione disponibile su:

text
http://localhost:3003


---

## 10. Verifica Health Check

### Browser

text
http://localhost:3003/health


### PowerShell

powershell
curl http://localhost:3003/health


Risposta attesa:

json
{
  "status": "ok",
  "timestamp": "2026-08-26T08:00:00.000Z"
}


---

## 11. Test Upload

powershell
curl -X POST `
  -H "x-api-key: imgf_TUA_API_KEY" `
  -F "file=@test.jpg" `
  -F "keepOriginal=true" `
  -F "sizes=200x200" `
  http://localhost:3003/api/files/upload-api


---

## 12. PM2 su Windows (Opzionale)

### Installazione

powershell
npm install -g pm2


### Avvio

powershell
pm2 start npm --name image-resize -- run dev


### Stato

powershell
pm2 status


### Log

powershell
pm2 logs image-resize


### Riavvio

powershell
pm2 restart image-resize


---

## 13. Configurazione consigliata con il tuo comando MinIO

### File .env

env
STORAGE_TYPE=minio

MINIO_ENDPOINT=http://127.0.0.1:9000

MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

MINIO_BUCKET=savedimages


### Finestra PowerShell 1

powershell
.\minio.windows-amd64.RELEASE.2025-09-07T16-13-09Z.exe server data


### Finestra PowerShell 2

powershell
cd resize-images
npm run dev


---

## Verifica finale

Dovrebbero essere raggiungibili:

text
http://localhost:3003


text
http://localhost:3003/health


text
http://localhost:9001


---

## Architettura finale

text
┌──────────────────────┐
│      Browser         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Node.js (Port 3003) │
│     npm run dev      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   MinIO (Port 9000)  │
│      savedimages     │
└──────────────────────┘

Console MinIO:
http://localhost:9001
