# API Reference - Image Resize (Windows + MinIO)

Documentazione completa delle API REST esposte dal server Image Resize.

## Base URL

### Ambiente locale

```text
http://localhost:3003
```

### Ambiente produzione

```text
https://tuodominio.it
```

---

# Autenticazione

Il sistema utilizza due modalità di autenticazione.

## 1. Token Admin

Utilizzato esclusivamente per:

- Login amministratore
- Creazione API Key
- Eliminazione API Key
- Visualizzazione API Key
- Lettura bucket MinIO

Header richiesto:

```http
Authorization: Bearer <TOKEN_ADMIN>
```

Il token viene ottenuto tramite:

```http
POST /api/auth/login
```

---

## 2. API Key

Utilizzata per il caricamento dei file.

Può essere inviata in uno dei due modi:

```http
x-api-key: imgf_xxxxxxxxxxxxxxxxx
```

oppure

```http
Authorization: Bearer imgf_xxxxxxxxxxxxxxxxx
```

---

# Health Check

## GET /health

Verifica che il server sia operativo.

### Autenticazione

Nessuna.

### Esempio

```powershell
curl http://localhost:3003/health
```

### Risposta

```json
{
  "status": "ok",
  "timestamp": "2026-08-26T08:00:00.000Z"
}
```

---

# Login Admin

## POST /api/auth/login

Effettua l'accesso come amministratore e restituisce il token di autenticazione.

### Header

```http
Content-Type: application/json
```

### Body

```json
{
  "username": "admin",
  "password": "LA_TUA_PASSWORD"
}
```

### Risposta 200

```json
{
  "token": "a3f8c1..."
}
```

### Risposta 401

```json
{
  "error": "Credenziali non valide"
}
```

### Esempio PowerShell

```powershell
curl.exe -X POST http://localhost:3003/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"LA_TUA_PASSWORD\"}"
```

---

# API Keys

## POST /api/auth/api-key

Genera una nuova API Key.

### Autenticazione

```http
Authorization: Bearer <TOKEN_ADMIN>
```

### Body

```json
{
  "name": "Progetto X",
  "bucket": "savedimages"
}
```

### Risposta 201

```json
{
  "apiKey": "imgf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "uploadEndpoint": "/api/files/upload-api"
}
```

> La chiave viene mostrata una sola volta. Successivamente sarà salvato solo il suo hash SHA256.

### Esempio PowerShell

```powershell
curl.exe -X POST http://localhost:3003/api/auth/api-key `
  -H "Authorization: Bearer TOKEN_ADMIN" `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"Progetto X\",\"bucket\":\"savedimages\"}"
```

---

## GET /api/auth/api-keys

Restituisce tutte le API Key registrate.

### Autenticazione

```http
Authorization: Bearer <TOKEN_ADMIN>
```

### Esempio

```powershell
curl.exe http://localhost:3003/api/auth/api-keys `
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### Risposta

```json
{
  "keys": [
    {
      "hash": "a3f8c1...",
      "name": "Progetto X",
      "bucket": "savedimages",
      "createdAt": "2026-08-25T10:00:00.000Z"
    }
  ]
}
```

---

## DELETE /api/auth/api-key/{hash}

Elimina una API Key.

### Autenticazione

```http
Authorization: Bearer <TOKEN_ADMIN>
```

### Esempio

```powershell
curl.exe -X DELETE http://localhost:3003/api/auth/api-key/a3f8c1... `
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### Risposta

```json
{
  "message": "Chiave eliminata"
}
```

---

# Bucket MinIO

## GET /api/files/buckets

Restituisce la lista dei bucket disponibili.

### Autenticazione

```http
Authorization: Bearer <TOKEN_ADMIN>
```

### Esempio

```powershell
curl.exe http://localhost:3003/api/files/buckets `
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### Risposta

```json
{
  "buckets": [
    "savedimages"
  ]
}
```

---

# Upload File

## POST /api/files/upload-api

Carica immagini, video o qualsiasi altro tipo di file su MinIO.

### Autenticazione

```http
x-api-key: imgf_xxxxxxxxxxx
```

oppure

```http
Authorization: Bearer imgf_xxxxxxxxxxx
```

### Content-Type

```http
multipart/form-data
```

---

## Parametri

| Campo | Obbligatorio | Descrizione |
|----------|----------|----------|
| file | Sì | File da caricare |
| sizes | Sì per immagini (se keepOriginal != 'only') | Dimensioni generate |
| keepOriginal | No | Conserva originale (valori ammessi: 'true', 'false', 'only') |
| path | No | Percorso originale |
| resizedPath | No | Percorso varianti |
| bucket | No | Bucket destinazione (default: bucket della API Key) |

---

## Formati supportati

Tutti i formati di file sono supportati. Il server categorizza automaticamente:
- **Immagini** (vengono ridimensionate se specificato)
- **Video** (salvati nella cartella `videos/` o nel percorso personalizzato)
- **Tutti gli altri file** (salvati nella cartella `files/` o nel percorso personalizzato)

---

## Limiti

### Dimensioni e Peso
Nessun limite. Il server e l'interfaccia accettano file di qualsiasi dimensione (peso) e permettono di generare un numero illimitato di varianti.

### Duplicati
Se un file con lo stesso nome è già presente nel bucket, il server restituirà un errore `409 Conflict`.
Per le immagini, il controllo avviene sul file originale (se keepOriginal='only') o sulla prima variante creata.

---

## Esempio Upload PowerShell

```powershell
curl.exe -X POST `
  -H "x-api-key: imgf_TUA_CHIAVE" `
  -F "file=@foto.jpg" `
  -F "keepOriginal=true" `
  -F "sizes=200x200" `
  -F "sizes=800x600" `
  http://localhost:3003/api/files/upload-api
```

---

## Risposta Immagine con Originale

```json
{
  "original": "foto.jpg",
  "keepOriginal": true,
  "variants": [
    "thumbs/foto_200x200.jpg",
    "thumbs/foto_800x600.jpg"
  ],
  "message": "Immagine salvata con originali"
}
```

---

## Risposta Solo Varianti

```json
{
  "original": null,
  "keepOriginal": false,
  "variants": [
    "thumbs/foto_200x200.jpg"
  ],
  "message": "Immagine salvata solo nelle versioni modificate"
}
```

---

## Risposta Video

```json
{
  "original": "videos/video.mp4",
  "keepOriginal": true,
  "variants": [],
  "message": "Video salvato"
}
```

---

## Errore API Key

```json
{
  "error": "API key non valida"
}
```

---

## Errore Duplicato

```json
{
  "error": "Errore: Immagine già presente" 
}
```
*(Oppure "Errore: File già presente")*

---

# Recupero File

## GET /api/files/object/{chiave}

Restituisce un file presente su MinIO.

### Autenticazione

Non richiesta.

### Esempio

```text
http://localhost:3003/api/files/object/thumbs/foto_200x200.jpg
```

### Utilizzo HTML

```html
<img
  src="http://localhost:3003/api/files/object/thumbs/foto_200x200.jpg"
  alt="Ante
{
  "error": "File non trovato"
}
```

---

# Esempio Node.js

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadImage() {
  const form = new FormData();

  form.append('file', fs.createReadStream('foto.jpg'));
  form.append('keepOriginal', 'true');
  form.append('sizes', '200x200');
  form.append('sizes', '800x600');

  const response = await axios.post(
    'http://localhost:3003/api/files/upload-api',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'x-api-key': 'imgf_TUA_CHIAVE'
      }
    }
  );

  console.log(response.data);
}

uploadImage();
```

---

# Esempio Python

```python
import requests

url = "http://localhost:3003/api/files/upload-api"

headers = {
    "x-api-key": "imgf_TUA_CHIAVE"
}

with open("foto.jpg", "rb") as file:
    response = requests.post(
        url,
        headers=headers,
        files={"file": file},
        data={
            "keepOriginal": "true",
            "sizes": ["200x200", "800x600"]
        }
    )

print(response.json())
```

---

# Esempio PHP

```php
<?php

$ch = curl_init();

$cfile = new CURLFile(
    realpath('foto.jpg'),
    'image/jpeg',
    'foto.jpg'
);

$data = [
    'file'         => $cfile,
    'keepOriginal' => 'true',
    'sizes[0]'     => '200x200',
    'sizes[1]'     => '800x600'
];

curl_setopt($ch, CURLOPT_URL, 'http://localhost:3003/api/files/upload-api');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: imgf_TUA_CHIAVE'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);

curl_close($ch);

echo $response;
```

---

# Codici HTTP

| Codice | Significato |
|----------|----------|
| 200 | Operazione completata |
| 201 | Risorsa creata |
| 400 | Parametri non validi |
| 401 | Non autorizzato |
| 404 | Risorsa non trovata |
| 500 | Errore interno server |

---

# Formato Dimensioni

Formato richiesto:

```text
LARGHEZZAxALTEZZA
```

Esempi:

```text
200x200
400x400
680x680
800x600
1024x768
1920x1080
```

L'immagine mantiene sempre le proporzioni originali e non viene deformata.

---

# Naming Oggetti

## Varianti

```text
thumbs/NomeFile_200x200.jpg
```

## Originale

```text
NomeFile.jpg
```

oppure

```text
percorso/NomeFile.jpg
```

## Video

```text
videos/NomeVideo.mp4
```

---

# Configurazione Locale Consigliata

### MinIO

```powershell
.\minio.windows-amd64.RELEASE.2025-09-07T16-13-09Z.exe server data
```

### Applicazione

```powershell
npm run dev
```

### Servizi disponibili

```text
Applicazione:
http://localhost:3003

Health Check:
http://localhost:3003/health

MinIO API:
http://localhost:9000

MinIO Console:
http://localhost:9001
```

---

# Sicurezza

- Non inserire mai le API Key nel frontend.
- Conservare le API Key solo lato server.
- Conservare il file `.env` fuori dal repository Git.
- Utilizzare password amministrative robuste.
- Limitare l'accesso ai bucket MinIO.
- Conservare soltanto hash SHA256 delle API Key.