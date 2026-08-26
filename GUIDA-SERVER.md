## Prerequisiti

| Requisito | Versione minima | Note |
|---|---|---|
| Node.js | 18 LTS | Usare nvm o il pacchetto ufficiale |
| npm | 9+ | Incluso con Node.js |
| MinIO | ultima stabile | Binario standalone o container Docker |
| Git | qualsiasi | Per clonare il repository |

---

## 1. Preparazione del server

### 1.1 Aggiornamento sistema (Ubuntu/Debian)

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Installazione Node.js (via nvm — raccomandato)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v   # deve mostrare v20.x.x
```

In alternativa, tramite il repository ufficiale NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 2. Clonare il repository

```bash
git clone https://github.com/TUO_UTENTE/resize-images.git
cd resize-images
```

Se il repository è privato, usa un token di accesso o una deploy key SSH.

---

## 3. Installazione dipendenze

```bash
npm install --omit=dev
```

L'opzione `--omit=dev` installa solo le dipendenze di produzione, escludendo eventuali tool di sviluppo.

---

## 4. Configurazione `.env`

Copia il file di esempio e modifica i valori:

```bash
cp .env.example .env
nano .env
```

Esempio di configurazione completa per produzione:

```env
# Server
PORT=3003
NODE_ENV=production
APP_SECRET=CAMBIA_CON_UN_VALORE_LUNGO_E_CASUALE

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=HASH_SHA256_DELLA_TUA_PASSWORD

# MinIO
STORAGE_TYPE=minio
MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ROOT_USER=minio_user
MINIO_ROOT_PASSWORD=PASSWORD_SICURA
MINIO_BUCKET=savedimages

# Resize
RESIZE_SIZES=200x200,400x400,680x680
KEEP_ORIGINAL=true
RESIZED_PATH=/thumbs
```

> **IMPORTANTE**: Il file `.env` non deve mai essere committato nel repository. Verificare che sia presente nel `.gitignore`.

### Generare `ADMIN_PASSWORD_HASH`

```bash
echo -n "LA_TUA_PASSWORD" | sha256sum
```

Oppure con Node.js:

```bash
node -e "const c=require('crypto'); console.log(c.createHash('sha256').update('LA_TUA_PASSWORD').digest('hex'));"
```

### Generare `APP_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 5. Avvio di MinIO

### 5.1 Metodo 1: binario standalone

Scarica il binario ufficiale:

```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/
```

Avvio:

```bash
MINIO_ROOT_USER=minio_user MINIO_ROOT_PASSWORD=PASSWORD_SICURA \
  minio server /data/minio --console-address ":9001"
```

### 5.2 Metodo 2: Docker

```bash
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minio_user \
  -e MINIO_ROOT_PASSWORD=PASSWORD_SICURA \
  -v /data/minio:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

### 5.3 Creare il bucket iniziale

Dopo aver avviato MinIO, crea il bucket `savedimages` dalla console web:

```
http://IP_SERVER:9001
```

Oppure tramite il client `mc`:

```bash
# Installazione mc
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configurazione alias
mc alias set local http://127.0.0.1:9000 minio_user PASSWORD_SICURA

# Creazione bucket
mc mb local/savedimages
```

---

## 6. Avvio dell'applicazione

### Avvio diretto (test)

```bash
npm start
```

L'applicazione sarà disponibile su `http://IP_SERVER:3003`.

### Avvio con PM2 (raccomandato per produzione)

PM2 è un process manager che mantiene l'applicazione attiva e la riavvia automaticamente in caso di crash.

```bash
# Installazione PM2
npm install -g pm2

# Avvio dell'applicazione
pm2 start server.js --name "image-resize"

# Avvio automatico al boot del server
pm2 startup
pm2 save
```

Comandi utili PM2:

```bash
pm2 status              # stato dei processi
pm2 logs image-resize   # log in tempo reale
pm2 restart image-resize
pm2 stop image-resize
pm2 delete image-resize
```

---

## 7. Reverse proxy con Nginx (opzionale ma raccomandato)

Nginx riceve le richieste sulla porta 80/443 e le inoltra all'applicazione Node.js.

### Installazione Nginx

```bash
sudo apt install -y nginx
```

### Configurazione del virtual host

```bash
sudo nano /etc/nginx/sites-available/image-resize
```

Contenuto del file:

```nginx
server {
    listen 80;
    server_name TUO_DOMINIO.com;

    client_max_body_size 110M;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Abilitazione e riavvio:

```bash
sudo ln -s /etc/nginx/sites-available/image-resize /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS con Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d TUO_DOMINIO.com
```

---

## 8. Firewall

Apri solo le porte necessarie:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

> **ATTENZIONE**: Non esporre la porta 9000 (MinIO API) o 9001 (MinIO Console) direttamente su Internet. Usa Nginx come proxy o limita l'accesso via firewall.

---

## 9. Verifica funzionamento

Controlla il health endpoint:

```bash
curl http://localhost:3003/health
```

Risposta attesa:

```json
{
  "status": "ok",
  "timestamp": "2026-08-25T10:01:45.847Z"
}
```

Test di upload con cURL:

```bash
curl -X POST \
  -H "x-api-key: imgf_TUA_API_KEY" \
  -F "file=@test.jpg" \
  -F "keepOriginal=true" \
  -F "sizes=200x200" \
  http://localhost:3003/api/files/upload-api
```

---

## 10. Log e monitoraggio

### Log PM2

```bash
pm2 logs image-resize --lines 100
```

I log sono salvati in:

```
~/.pm2/logs/image-resize-out.log   # stdout
~/.pm2/logs/image-resize-error.log # stderr
```

### Log Nginx

```
/var/log/nginx/access.log
/var/log/nginx/error.log
```

---

## 11. Aggiornamento dell'applicazione

```bash
cd resize-images
git pull origin main
npm install --omit=dev
pm2 restart image-resize
```

---

## 12. Checklist di produzione

Prima di rendere il servizio pubblico, verificare:

- [ ] `APP_SECRET` è una stringa casuale lunga almeno 64 caratteri
- [ ] `ADMIN_PASSWORD_HASH` è l'hash di una password sicura (non quella di default)
- [ ] `.env` è nel `.gitignore` e non è mai stato committato
- [ ] CORS è limitato ai domini autorizzati
- [ ] Il bucket MinIO non è pubblico (policy esplicite configurate)
- [ ] Nginx ha `client_max_body_size` adeguato (almeno 110M per video da 100 MB)
- [ ] Il firewall blocca le porte non necessarie
- [ ] HTTPS è attivo con certificato valido
- [ ] PM2 è configurato per il riavvio automatico
- [ ] I log vengono monitorati regolarmente

---

## 13. Struttura URL in produzione

| Percorso | Descrizione |
|---|---|
| `https://TUO_DOMINIO.com/` | Pagina di login |
| `https://TUO_DOMINIO.com/dashboard` | Dashboard principale |
| `https://TUO_DOMINIO.com/health` | Health check |
| `https://TUO_DOMINIO.com/api/files/upload-api` | Endpoint upload via API |
| `https://TUO_DOMINIO.com/api/files/object/<chiave>` | Recupero file da MinIO |
| `https://TUO_DOMINIO.com/api/auth/login` | Login admin |
| `https://TUO_DOMINIO.com/api/auth/api-key` | Generazione API key |
| `https://TUO_DOMINIO.com/api/auth/api-keys` | Lista API key (GET) |
