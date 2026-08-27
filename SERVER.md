# Image Resize - Setup su Windows

Ecco gli step per tirare su il progetto su Windows.

## 1. Prerequisiti

Ti serviranno:
- Node.js 20 LTS
- Git
- MinIO per Windows

Fai un check veloce per vedere se hai tutto:
```powershell
node -v
npm -v
git --version
```

---

## 2. Clonare il repository

Scarichiamoci il codice:
```powershell
git clone https://github.com/TUO_UTENTE/resize-images.git
cd resize-images
```

---

## 3. Installazione dipendenze

Se ci devi sviluppare sopra (Ambiente di sviluppo):
```powershell
npm install
```

Se invece lo devi mandare in produzione:
```powershell
npm install --omit=dev
```

---

## 4. Configurazione del file .env

Copia il file di esempio e aprilo:
```powershell
copy .env.example .env
notepad .env
```

Io di solito lo configuro così:
```env
PORT=3003
NODE_ENV=development

APP_SECRET=STRINGA_CASUALE

# Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=resize_image
DB_USER=root
DB_PASSWORD=tua_password_mysql

STORAGE_TYPE=minio

MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

MINIO_BUCKET=savedimages

RESIZE_SIZES=200x200,400x400,680x680
KEEP_ORIGINAL=true
RESIZED_PATH=/thumbs # Lascia vuoto per salvare le varianti direttamente nella root
```

---

## 5. Generare APP_SECRET

Ti serve un secret per la sessione/auth, puoi generarlo al volo così:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia la stringa che esce e buttala nel parametro del `.env`:
```env
APP_SECRET=il_tuo_secret_generato
```

---

## 6. Configurazione MySQL (Auth e API Keys)

Il sistema usa MySQL per le credenziali di amministrazione e le API Key. Assicurati di creare il database e le tabelle, magari da phpMyAdmin o console.

### Database
Nome: `resize_image`

### Tabella `admin`
```sql
CREATE TABLE `admin` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  PRIMARY KEY (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

Quando inserisci l'utente `admin`, ricordati di salvare la password **solo** come hash `SHA-256`. Non metterla in chiaro, sennò il login fallisce.

### Tabella `token`
```sql
CREATE TABLE `token` (
  `api_keys` text NOT NULL,
  `name` text NOT NULL,
  `bucket` text NOT NULL,
  `createdAT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

---

## 7. Avvio di MinIO

### Avvio base
```powershell
.\minio.windows-amd64.RELEASE.2025-09-07T16-13-09Z.exe server data
```

### Avvio con credenziali personalizzate (se vuoi evitare quelle di default)
```powershell
$env:MINIO_ROOT_USER="minioadmin"
$env:MINIO_ROOT_PASSWORD="PasswordMoltoSicura"

.\minio.windows-amd64.RELEASE.2025-09-07T16-13-09Z.exe server data
```

### Endpoint che avrai a disposizione
**API S3**: `http://localhost:9000`
**Console Web**: `http://localhost:9001`

---

## 8. Creazione del bucket

Apri il browser su: `http://localhost:9001`
Loggati con:
- Username: `minioadmin` (o quello che hai scelto)
- Password: `PasswordMoltoSicura`

Crea un bucket e chiamalo `savedimages` (o come lo hai definito nel `.env`).

---

## 9. Avviare l'applicazione

Se stai sviluppando:
```powershell
npm run dev
```

In produzione:
```powershell
npm start
```

Ora l'app gira su `http://localhost:3003`.

---

## 10. Verifica Health Check

Vedi se è tutto vivo aprendo `http://localhost:3003/health` dal browser oppure:
```powershell
curl http://localhost:3003/health
```

Dovrebbe risponderti una cosa del tipo:
```json
{
  "status": "ok",
  "timestamp": "2026-08-26T08:00:00.000Z"
}
```

---

## 11. Test Upload veloce da terminale

Se vuoi testare al volo se carica la roba:
```powershell
curl -X POST `
  -H "x-api-key: imgf_TUA_API_KEY" `
  -F "file=@test.jpg" `
  -F "keepOriginal=true" `
  -F "sizes=200x200" `
  http://localhost:3003/api/files/upload-api
```

---

## 12. Gestire il processo con PM2 (Opzionale, utile per produzione)

Se non vuoi tenere il terminale aperto o vuoi che si riavvii se crasha:

Installazione:
```powershell
npm install -g pm2
```

Avvio:
```powershell
pm2 start npm --name image-resize -- run dev
```
*(Usa `start` invece di `run dev` in produzione).*

Altri comandi utili di PM2:
```powershell
pm2 status
pm2 logs image-resize
pm2 restart image-resize
```

---

## 13. Il setup che ti consiglio per sviluppare (2 terminali)

Assicurati che nel `.env` ci sia:
```env
STORAGE_TYPE=minio
MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=savedimages
```

Poi apri **due** finestre di PowerShell:

**Finestra 1 (MinIO):**
```powershell
.\minio.windows-amd64.RELEASE.2025-09-07T16-13-09Z.exe server data
```

**Finestra 2 (Node):**
```powershell
cd resize-images
npm run dev
```

Finito. Da qui in poi hai:
- L'app su `http://localhost:3003`
- L'health check su `http://localhost:3003/health`
- La UI di MinIO su `http://localhost:9001`
