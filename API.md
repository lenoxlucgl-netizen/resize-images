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

# Gestione Bucket 🪣

Ho aggiunto un paio di rotte per farti capire quali bucket puoi usare.

## GET /api/files/buckets
Se sei admin (quindi passi il `TOKEN_ADMIN` in Authorization), ti sputa fuori la lista di tutti i bucket esistenti su MinIO.

## GET /api/files/my-buckets
Passando la tua **API Key**, questa rotta ti dice in quali bucket hai il permesso di scrivere.
Se ti torna `"global": true`, significa che puoi scrivere dove ti pare, altrimenti ti torna un array con il singolo bucket a cui sei limitato.

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
| isPublic | Sì | 'true' o 'false'. Se true, il file viene salvato nella cartella `public/` ed è accessibile da chiunque (tramite Signed URL o URL diretto MinIO). Se false, va in `private/`. |
| sizes | Dipende | Le misure. Obbligatorio per le foto a meno che non metti keepOriginal='only' |
| keepOriginal | No | Vuoi tenere l'originale? ('true', 'false', 'only') |
| path | No | Dove lo salvo internamente (percorso originale, non verrà esposto) |
| resizedPath | No | Dove piazzo le varianti internamente (non verrà esposto) |
| bucket | No | Il bucket (sennò usa quello legato all'API Key) |

### Come gestisco i file
Accetto di tutto. Poi internamente il backend fa questo:
- **Immagini**: fa il resize se richiesto.
- **Video**: non li tocca, li salva sotto `videos/` o nel path che hai chiesto.
- **Altro**: lo salva in `files/` o nel tuo path senza farci nulla.
- **Sicurezza Pubblico/Privato**: A seconda del valore di `isPublic` (true o false) che passi, il sistema aggiungerà in automatico al percorso di salvataggio il prefisso `public/` o `private/`. I file salvati sotto `public/` diventano visibili (in sola lettura) anche dall'esterno interrogando direttamente MinIO, grazie alle nuove Policy autoconfiguranti.

### Limiti e Duplicati
- Non ci sono limiti di peso imposti a codice. Vai sereno.
- Se carichi un file (o viene generata una variante) con un nome che esiste già nel bucket... **viene sovrascritto** brutalmente, senza errori. L'ho fatto apposta per rimpiazzare vecchie versioni al volo.

### Esempio di upload bello massiccio (PowerShell)
```powershell
curl.exe -X POST `
  -H "x-api-key: imgf_TUA_CHIAVE" `
  -F "file=@foto.jpg" `
  -F "isPublic=true" `
  -F "keepOriginal=true" `
  -F "sizes=200x200" `
  -F "sizes=800x600" `
  http://localhost:3003/api/files/upload-api
```

La risposta in questo caso (ti restituirà gli **UUID** e i **link diretti** dei file generati):
```json
{
  "bucket": "savedimages",
  "original": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "url": "http://localhost:3003/api/files/read/550e8400-e29b-41d4-a716-446655440000?signature=..."
  },
  "keepOriginal": true,
  "variants": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "url": "http://localhost:3003/api/files/read/123e4567-e89b-12d3-a456-426614174000?signature=..."
    },
    {
      "uuid": "987e6543-e21b-34d5-c678-526614174111",
      "url": "http://localhost:3003/api/files/read/987e6543-e21b-34d5-c678-526614174111?signature=..."
    }
  ],
  "message": "Immagine salvata con originali"
}
```
> **Nota sui Link**: Se hai caricato il file come `isPublic=true`, l'url conterrà già la firma (`signature=...`) per accedervi direttamente (Signed URL). Se invece `isPublic=false`, l'url punterà all'endpoint `/private/` e dovrai sempre fornire l'header `x-api-key` per leggerlo.

---

# Leggere/Piallare File da MinIO (sempre via API)

## GET /api/files/list/{bucket}
Ti fai dare la lista dei file dentro al bucket (usando un'API key autorizzata per quel bucket).

## DELETE /api/files/object/{bucket}/{chiave}
Cestina fisicamente un file da MinIO.

## GET /api/files/signed-url/{uuid}
Usa questa rotta per generare un **Signed URL** per un file. Devi usare la stessa API Key che ha caricato il file. 
Il file **deve** essere stato marcato come `isPublic=true` in fase di upload.

Header:
```http
x-api-key: imgf_TUA_CHIAVE
```
Risposta (200):
```json
{
  "url": "http://localhost:3003/api/files/read/550e8400-e29b-41d4...?signature=..."
}
```

## GET /api/files/read/{uuid}
Questa è la rotta pubblica per **scaricare/visualizzare** i file che sono marcati come `isPublic=true`. Non richiede API Key, ma **richiede una firma valida in querystring**.
Se l'URL è manomesso, riceverai un `403 Forbidden`.

Esempio pratico:
```text
http://localhost:3003/api/files/read/550e8400-e29b-41d4-a716-446655440000?signature=abc123def456
```
(Questa è la rotta che userai dentro i tag `<img src="...">` nel tuo frontend).

## GET /api/files/private/{uuid}
Usa questa per leggere file marcati come `isPublic=false` (o anche quelli pubblici, se preferisci passarci tramite backend).
Non usa Signed URL, ma **richiede l'header x-api-key** di chi ha originariamente caricato il file.

Esempio:
```http
GET /api/files/private/550e8400-e29b-41d4-a716-446655440000
x-api-key: imgf_TUA_CHIAVE
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
form.append('isPublic', 'true');
form.append('sizes', '200x200');

const res = await axios.post('http://localhost:3003/api/files/upload-api', form, {
  headers: { ...form.getHeaders(), 'x-api-key': 'imgf_TUA_CHIAVE' }
});
console.log(res.data); // Restituirà gli UUID
```

### Python (Requests)
```python
import requests

with open("foto.jpg", "rb") as file:
    res = requests.post(
        "http://localhost:3003/api/files/upload-api",
        headers={"x-api-key": "imgf_TUA_CHIAVE"},
        files={"file": file},
        data={"keepOriginal": "true", "isPublic": "true", "sizes": ["200x200"]}
    )
print(res.json())
```

---

# Varie ed eventuali

## Come passo le dimensioni?
Mettici sempre `LxA`, es. `200x200`. Il backend usa l'opzione "inside", quindi mantiene le proporzioni senza deformarti l'immagine.

## Naming e UUID
- A differenza di prima, non puoi più ricavare il nome del file dal suo percorso originale.
- Il server ora restituisce **UUID (es. `550e8400...`)** per tutti i file creati, salvando il loro reale posizionamento interno nel Database.
- Ricordati di salvare questi UUID nel DB del tuo progetto!
- **Novità:** Ogni file che carichi viene ora associato in modo indissolubile alla tua specifica API Key nel Database. Questo significa che nessuno (tranne te) potrà leggere o cancellare i tuoi file privati, anche se avesse i permessi per lo stesso bucket!

## Security 101 & Docker
- Non sparare l'API key sul frontend.
- Nessun file può essere letto senza firma (se pubblico) o senza API Key (se privato).
- Tieni il `.env` fuori dal repo. Lì dentro ora risiede la password `URL_SIGN_SECRET` per generare le firme degli URL, essenziale per la sicurezza.
- Il DB per le API keys, i log di accesso e i file usa password sicure e gli hash in SHA-256 (no cleartext!).
- **Docker**: Ho sistemato il `.dockerignore`. Così evitiamo di portarci dietro file inutili o, peggio, database locali (`mysql-data`) ed `.env` quando buildiamo l'immagine. Tutto più pulito e sicuro.