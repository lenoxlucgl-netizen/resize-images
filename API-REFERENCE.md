# API Reference — Image Resize

Documentazione di riferimento per tutte le API REST esposte dal server Image Resize.

**Base URL (locale):** `http://localhost:3003`  
**Base URL (produzione):** `https://TUO_DOMINIO.com`

---

## Autenticazione

Il sistema utilizza due meccanismi di autenticazione distinti.

### Token admin (HMAC)

Usato esclusivamente per le operazioni di amministrazione (generare e gestire API key, leggere i bucket).

Il token si ottiene dalla rotta `POST /api/auth/login` e va inviato come:

```
Authorization: Bearer <token>
```

### API Key

Usata per il caricamento di file da applicazioni esterne. Va inviata in uno dei due modi:

```
x-api-key: imgf_<chiave>
```
oppure:
```
Authorization: Bearer imgf_<chiave>
```

---

## Endpoint

---

### `GET /health`

Verifica che il server sia attivo.

**Autenticazione:** nessuna

**Risposta `200 OK`:**

```json
{
  "status": "ok",
  "timestamp": "2026-08-25T10:01:45.847Z"
}
```

---

### `POST /api/auth/login`

Esegue il login come amministratore e restituisce un token HMAC.

**Autenticazione:** nessuna

**Content-Type:** `application/json`

**Body:**

```json
{
  "username": "admin",
  "password": "LA_TUA_PASSWORD"
}
```

**Risposta `200 OK`:**

```json
{
  "token": "a3f8c1..."
}
```

**Risposta `401 Unauthorized`:**

```json
{
  "error": "Credenziali non valide"
}
```

**Esempio cURL:**

```bash
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"LA_TUA_PASSWORD"}'
```

---

### `POST /api/auth/api-key`

Genera una nuova API key associata a un bucket specifico.

**Autenticazione:** Token admin (`Authorization: Bearer <token>`)

**Content-Type:** `application/json`

**Body:**

| Campo | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|
| `name` | string | sì | Nome identificativo della chiave (es. "Progetto X") |
| `bucket` | string | sì | Bucket MinIO a cui la chiave sarà autorizzata |

**Esempio body:**

```json
{
  "name": "Progetto X",
  "bucket": "savedimages"
}
```

**Risposta `201 Created`:**

```json
{
  "apiKey": "imgf_3082ab365d1bff27dfe3b01c52d4db79eb164705ef8371299e9f92f9da504b38",
  "uploadEndpoint": "/api/files/upload-api"
}
```

> **Attenzione:** la chiave è mostrata in chiaro **una sola volta**. Non viene salvata in chiaro: nel file `api-keys.json` viene conservato solo il suo hash SHA-256.

**Risposta `400 Bad Request`:**

```json
{
  "error": "Nome e Bucket sono obbligatori"
}
```

**Risposta `401 Unauthorized`:** il token admin non è valido o assente.

**Esempio cURL:**

```bash
curl -X POST http://localhost:3003/api/auth/api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer IL_TUO_TOKEN_ADMIN" \
  -d '{"name":"Progetto X","bucket":"savedimages"}'
```

---

### `GET /api/auth/api-keys`

Restituisce la lista di tutte le API key registrate (senza mostrare le chiavi in chiaro, solo metadati).

**Autenticazione:** Token admin (`Authorization: Bearer <token>`)

**Risposta `200 OK`:**

```json
{
  "keys": [
    {
      "hash": "a3f8c1d2...",
      "name": "Progetto X",
      "bucket": "savedimages",
      "createdAt": "2026-08-25T10:00:00.000Z"
    },
    {
      "hash": "b9e2f3a1...",
      "name": "App Mobile",
      "bucket": "savedimages",
      "createdAt": "2026-08-24T08:30:00.000Z"
    }
  ]
}
```

**Esempio cURL:**

```bash
curl http://localhost:3003/api/auth/api-keys \
  -H "Authorization: Bearer IL_TUO_TOKEN_ADMIN"
```

---

### `DELETE /api/auth/api-key/:hash`

Elimina una API key esistente identificata dal suo hash SHA-256.

**Autenticazione:** Token admin (`Authorization: Bearer <token>`)

**Parametro URL:** `hash` — l'hash SHA-256 della chiave da eliminare (ottenibile da `GET /api/auth/api-keys`)

**Risposta `200 OK`:**

```json
{
  "message": "Chiave eliminata"
}
```

**Risposta `404 Not Found`:**

```json
{
  "error": "Chiave non trovata"
}
```

**Esempio cURL:**

```bash
curl -X DELETE \
  http://localhost:3003/api/auth/api-key/a3f8c1d2... \
  -H "Authorization: Bearer IL_TUO_TOKEN_ADMIN"
```

---

### `GET /api/files/buckets`

Restituisce la lista dei bucket MinIO disponibili.

**Autenticazione:** Token admin (`Authorization: Bearer <token>`)

**Risposta `200 OK`:**

```json
{
  "buckets": ["savedimages", "altro-bucket"]
}
```

**Esempio cURL:**

```bash
curl http://localhost:3003/api/files/buckets \
  -H "Authorization: Bearer IL_TUO_TOKEN_ADMIN"
```

---

### `POST /api/files/upload-api`

Carica uno o più file (immagini o video) e genera le varianti ridimensionate per le immagini.

**Autenticazione:** API Key (`x-api-key: imgf_<chiave>` oppure `Authorization: Bearer imgf_<chiave>`)

**Content-Type:** `multipart/form-data`

**Campi del body:**

| Campo | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|
| `file` | file | sì | Il file da caricare |
| `sizes` | string | sì (per immagini) | Dimensione nel formato `LARGHEZZAxALTEZZA`. Può essere ripetuto più volte. Minimo 1, massimo 5. |
| `keepOriginal` | string | no | `true` per conservare anche l'originale, `false` per salvare solo le varianti. Default: `false`. |
| `path` | string | no | Percorso (prefisso) nel bucket per il file originale. |
| `resizedPath` | string | no | Percorso (prefisso) nel bucket per le varianti. Se omesso, usa lo stesso di `path`. |
| `bucket` | string | no | Bucket di destinazione. Se omesso, usa `MINIO_BUCKET` dal `.env`. |

**Formati accettati (immagini):**
`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`, `image/tiff`

**Formati accettati (video):**
`video/mp4`, `video/webm`, `video/quicktime`, `video/x-msvideo`

**Limiti:**
- Massimo 15 MB per le immagini (limite UI, il server accetta fino a 100 MB)
- Massimo 100 MB per i video
- Massimo 5 dimensioni per richiesta (di cui max 2 personalizzate)

**Risposta `201 Created` — immagine con originale conservato:**

```json
{
  "original": "paesaggio.jpg",
  "keepOriginal": true,
  "variants": [
    "thumbs/paesaggio_200x200.jpg",
    "thumbs/paesaggio_800x600.jpg"
  ],
  "message": "Immagine salvata con originali"
}
```

**Risposta `201 Created` — solo varianti:**

```json
{
  "original": null,
  "keepOriginal": false,
  "variants": [
    "thumbs/paesaggio_200x200.jpg"
  ],
  "message": "Immagine salvata solo nelle versioni modificate"
}
```

**Risposta `201 Created` — video:**

```json
{
  "original": "videos/clip.mp4",
  "keepOriginal": true,
  "variants": [],
  "message": "Video salvato"
}
```

**Risposta `400 Bad Request` — validazione fallita:**

```json
{
  "error": "Seleziona almeno una dimensione valida"
}
```

**Risposta `401 Unauthorized` — API key assente o non valida:**

```json
{
  "error": "API key non valida"
}
```

---

#### Esempi per linguaggio

**cURL / Bash:**

```bash
curl -X POST \
  -H "x-api-key: imgf_TUA_CHIAVE" \
  -F "file=@foto.jpg" \
  -F "keepOriginal=true" \
  -F "sizes=200x200" \
  -F "sizes=800x600" \
  http://localhost:3003/api/files/upload-api
```

**PowerShell:**

```powershell
curl.exe -s `
  -H "x-api-key: imgf_TUA_CHIAVE" `
  -F "file=@foto.jpg" `
  -F "keepOriginal=true" `
  -F "sizes=200x200" `
  -F "sizes=800x600" `
  http://localhost:3003/api/files/upload-api
```

**Node.js (Axios):**

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

  const response = await axios.post('http://localhost:3003/api/files/upload-api', form, {
    headers: {
      ...form.getHeaders(),
      'x-api-key': 'imgf_TUA_CHIAVE'
    }
  });
  console.log(response.data);
}
uploadImage();
```

**Python (requests):**

```python
import requests

url = "http://localhost:3003/api/files/upload-api"
headers = { "x-api-key": "imgf_TUA_CHIAVE" }

with open("foto.jpg", "rb") as f:
    files = {"file": f}
    data = {
        "keepOriginal": "true",
        "sizes": ["200x200", "800x600"]
    }
    response = requests.post(url, headers=headers, files=files, data=data)
    print(response.json())
```

**PHP (cURL):**

```php
<?php
$ch = curl_init();
$cfile = new CURLFile(realpath('foto.jpg'), 'image/jpeg', 'foto.jpg');
$data = [
    'file'         => $cfile,
    'keepOriginal' => 'true',
    'sizes[0]'     => '200x200',
    'sizes[1]'     => '800x600'
];

curl_setopt($ch, CURLOPT_URL, "http://localhost:3003/api/files/upload-api");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["x-api-key: imgf_TUA_CHIAVE"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>
```

---

### `GET /api/files/object/<chiave>`

Recupera un file dal bucket MinIO e lo restituisce in streaming. Non richiede autenticazione.

**Parametro URL:** `<chiave>` — il percorso dell'oggetto nel bucket (es. `thumbs/foto_200x200.jpg`)

**Risposta `200 OK`:** il file binario con il `Content-Type` corretto.

**Risposta `404 Not Found`:**

```json
{
  "error": "File non trovato"
}
```

**Esempio:**

```
GET http://localhost:3003/api/files/object/thumbs/foto_200x200.jpg
```

Per usarlo in un tag `<img>`:

```html
<img src="http://localhost:3003/api/files/object/thumbs/foto_200x200.jpg" alt="Variante">
```

---

## Codici di errore comuni

| Codice HTTP | Significato |
|---|---|
| `200 OK` | Richiesta riuscita |
| `201 Created` | Risorsa creata (upload, nuova API key) |
| `400 Bad Request` | Parametri mancanti o non validi |
| `401 Unauthorized` | Token admin o API key assente / non valido |
| `404 Not Found` | Risorsa non trovata |
| `500 Internal Server Error` | Errore lato server |

---

## Formato delle dimensioni

Le dimensioni si specificano nel formato:

```
LARGHEZZAxALTEZZA
```

Esempi validi:

```
200x200
400x400
1024x768
1920x1080
```

L'opzione `fit: inside` di Sharp mantiene le proporzioni originali senza deformare l'immagine. Se l'immagine originale è più piccola della dimensione richiesta, non viene ingrandita.

---

## Naming degli oggetti nel bucket

| Tipo | Percorso oggetto |
|---|---|
| Variante | `thumbs/NomeFile_LARGHEZZAxALTEZZA.ext` |
| Originale | `NomeFile_LARGHEZZAxALTEZZA.ext` (nella radice o nel percorso specificato) |
| Video | `videos/NomeFile.ext` (o nel percorso specificato) |

Il nome originale viene sanitizzato: i caratteri non alfanumerici (esclusi `.`, `_`, `-`) vengono sostituiti con `-`.

---

## Note di sicurezza

- Le API key non devono mai essere inserite in codice frontend pubblico (es. React, Vue, HTML esposto al browser): sarebbero visibili a chiunque.
- Le chiavi vanno conservate lato server in variabili d'ambiente o secret manager.
- L'endpoint `POST /api/auth/api-key` richiede autenticazione admin: gli utenti non autenticati non possono creare nuove chiavi.
- Nel file `api-keys.json` vengono conservati solo gli hash SHA-256: anche in caso di accesso al file, le chiavi originali non sono recuperabili.
