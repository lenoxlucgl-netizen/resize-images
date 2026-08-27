# API Reference - Image Resize

Ecco tutta la documentazione delle API REST del server per il resize.

## Base URL

In locale, il server gira qui:
```text
http://localhost:3003
```
In produzione, andrà ovviamente sul tuo dominio.

---

# Autenticazione

Ho impostato due modi per autenticarsi:

## 1. Token Admin

Questo serve solo per la gestione, tipo loggarsi, creare o piallare le API Key, e vedere cosa c'è nel bucket MinIO da pannello admin.

Header da mandare:
```http
Authorization: Bearer <TOKEN_ADMIN>
```

Il token lo prendi facendo una chimata di login a `/api/auth/login`.

## 2. API Key

Questa è quella che serve per l'upload vero e proprio dei file.
La puoi mandare in due modi, a preferenza:

Come header custom:
```http
x-api-key: imgf_xxxxxxxxxxxxxxxxx
```
Oppure nel Bearer classico:
```http
Authorization: Bearer imgf_xxxxxxxxxxxxxxxxx
```

---

# Health Check

Se vuoi solo controllare se il server è vivo:

## GET /health

Nessuna auth richiesta.

```powershell
curl http://localhost:3003/health
```

Ti risponde così se è tutto ok:
```json
{
  "status": "ok",
  "timestamp": "2026-08-26T08:00:00.000Z"
}
```

---

# Login Admin

## POST /api/auth/login

Ti fai dare il token.

Header:
```http
Content-Type: application/json
```

Body:
```json
{
  "username": "admin",
  "password": "0dPw16X22k2t2C."
}
```

Se va bene (200), ti torna:
```json
{
  "token": "a3f8c1..."
}
```
Altrimenti (401) becchi un errore sulle credenziali.

---

# Gestione API Keys

## POST /api/auth/api-key

Sei loggato da admin e vuoi creare una nuova chiave per un progetto? Usa questa rotta.
Ricorda di mandare il `TOKEN_ADMIN` nell'header.

Body:
```json
{
  "name": "Progetto X",
  "bucket": "savedimages"
}
```
*Nota: se salti il parametro `bucket` o passi `*`, la chiave che ti sputa fuori non avrà limiti e potrà scrivere in qualsiasi bucket.*

Risposta (201):
```json
{
  "apiKey": "imgf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "uploadEndpoint": "/api/files/upload-api"
}
```
> **Occhio**: te la mostro in chiaro solo in questo momento. Lato DB mi salvo solo l'hash SHA-256, quindi se la perdi devi rifarla.

## GET /api/auth/api-keys
Lista di tutte le chiavi (ovviamente serve auth da admin).
Ti torna un array con le varie info (quando l'ho creata, che bucket usa, l'hash ecc.).

## DELETE /api/auth/api-key/{hash}
Pialla una chiave. Manda l'hash e fine (auth da admin).

---

# Upload File 🚀

La parte succosa. Qui carichiamo le immagini, i video o quello che ci pare.

## POST /api/files/upload-api

Usa la tua API key in header e imposta:
```http
Content-Type: multipart/form-data
```

Questi sono i parametri che gestisco:

| Campo | Obbligatorio? | Che roba è? |
|----------|----------|----------|
| file | Sì | Il file fisico da caricare |
| sizes | Dipende | Le misure. Obbligatorio per le foto a meno che non metti keepOriginal='only' |
| keepOriginal | No | Vuoi tenere l'originale? ('true', 'false', 'only') |
| path | No | Dove lo salvo (percorso originale) |
| resizedPath | No | Dove piazzo le varianti (se mandi stringa vuota, vanno nella root) |
| bucket | No | Il bucket (sennò usa quello legato all'API Key) |

### Come gestisco i file
Accetto di tutto. Poi internamente il backend fa questo:
- **Immagini**: fa il resize se richiesto.
- **Video**: non li tocca, li salva sotto `videos/` o nel path che hai chiesto.
- **Altro**: lo salva in `files/` o nel tuo path senza farci nulla.

### Limiti e Duplicati
- Non ci sono limiti di peso imposti a codice. Vai sereno.
- Se carichi un file (o viene generata una variante) con un nome che esiste già nel bucket... **viene sovrascritto** brutalmente, senza errori. L'ho fatto apposta per rimpiazzare vecchie versioni al volo.

### Esempio di upload bello massiccio (PowerShell)
```powershell
curl.exe -X POST `
  -H "x-api-key: imgf_TUA_CHIAVE" `
  -F "file=@foto.jpg" `
  -F "keepOriginal=true" `
  -F "sizes=200x200" `
  -F "sizes=800x600" `
  -F "path=mie_foto/originali" `
  -F "resizedPath=mie_foto/ridimensionate" `
  http://localhost:3003/api/files/upload-api
```

La risposta in questo caso (con originale tenuto):
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

# Leggere/Piallare File da MinIO (sempre via API)

## GET /api/files/list/{bucket}
Ti fai dare la lista dei file dentro al bucket (usando un'API key autorizzata per quel bucket).

## DELETE /api/files/object/{bucket}/{chiave}
Cestina fisicamente un file da MinIO.

## GET /api/files/object/{chiave}
Usa questa per leggere i file direttamente (le immagini generate). Nessuna auth richiesta, perfetta per i tag `<img src="...">`.

Esempio:
```text
http://localhost:3003/api/files/object/thumbs/foto_200x200.jpg?bucket=savedimages
```

---

# Integrazione: come la chiamo dal codice?

### Node.js (Axios)
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('foto.jpg'));
form.append('keepOriginal', 'true');
form.append('sizes', '200x200');

const res = await axios.post('http://localhost:3003/api/files/upload-api', form, {
  headers: { ...form.getHeaders(), 'x-api-key': 'imgf_TUA_CHIAVE' }
});
console.log(res.data);
```

### Python (Requests)
```python
import requests

with open("foto.jpg", "rb") as file:
    res = requests.post(
        "http://localhost:3003/api/files/upload-api",
        headers={"x-api-key": "imgf_TUA_CHIAVE"},
        files={"file": file},
        data={"keepOriginal": "true", "sizes": ["200x200"]}
    )
print(res.json())
```

---

# Varie ed eventuali

## Come passo le dimensioni?
Mettici sempre `LxA`, es. `200x200`. Il backend usa l'opzione "inside", quindi mantiene le proporzioni senza deformarti l'immagine.

## Naming dei file salvati
- Le varianti le chiamo `thumbs/NomeFile_200x200.jpg`.
- L'originale rimane col suo nome `NomeFile.jpg`.
- I video vanno tipo in `videos/NomeVideo.mp4`.

## Security 101
- Non sparare l'API key sul frontend.
- Tieni il `.env` fuori dal repo.
- Il DB per le API keys e l'admin usa password sicure e solo SHA-256 (no cleartext!).