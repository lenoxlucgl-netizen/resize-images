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
| isPublic | No | 'true' o 'false'. Se non specificato, il sistema lo calcolerà automaticamente in base alla cartella (es. in `testapi`, la cartella `portfolio/` è privata, il resto pubblico). |
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
- **Sicurezza Pubblico/Privato**: Se non passi esplicitamente il parametro `isPublic`, il backend utilizza delle regole basate sui percorsi. Ad esempio, per il bucket `testapi`, tutto ciò che finisce dentro la cartella `portfolio` è considerato **Privato**; tutto il resto è **Pubblico**. Queste regole sono applicate a livello di storage su MinIO all'avvio del server tramite il file `rules.json`.

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
    "url": "http://localhost:3003/api/files/read/550e8400-e29b-41d4-a716-446655440000"
  },
  "keepOriginal": true,
  "variants": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "url": "http://localhost:3003/api/files/read/123e4567-e89b-12d3-a456-426614174000"
    },
    {
      "uuid": "987e6543-e21b-34d5-c678-526614174111",
      "url": "http://localhost:3003/api/files/read/987e6543-e21b-34d5-c678-526614174111"
    }
  ],
  "message": "Immagine salvata con originali"
}
```
> **Nota sui Link**: Se hai caricato il file come `isPublic=true`, l'url punterà all'endpoint libero senza firma (`/read/{uuid}`). Se invece `isPublic=false`, l'url restituito punterà al nuovo endpoint firmato (`/private-signed/`) includendo la firma (`signature=...`).

---

# Leggere/Piallare File da MinIO (sempre via API)

## GET /api/files/list/{bucket}
Ti fai dare la lista dei file dentro al bucket (usando un'API key autorizzata per quel bucket).

## DELETE /api/files/object/{bucket}/{chiave}
Cestina fisicamente un file da MinIO.

## GET /api/files/signed-url/{uuid}
Usa questa rotta per farti restituire dal server l'URL corretto per un file (libero se pubblico, firmato se privato). Devi usare la stessa API Key che ha caricato il file.
Opzionalmente puoi passare `?expiresIn=3600` (in secondi) per decidere la durata del link (di default è un'ora).

Header:
```http
x-api-key: imgf_TUA_CHIAVE
```
Risposta (200):
```json
{
  "url": "http://localhost:3003/api/files/private-signed/550e8400-e29b-41d4...?expires=1790000000&signature=..."
}
```
*(Se il file è pubblico, l'URL restituito sarà invece `http://localhost:3003/api/files/read/...` senza firma e scadenza).*

## GET /api/files/read/{uuid}
Questa è la rotta pubblica per **scaricare/visualizzare** i file che sono marcati come `isPublic=true`. Non richiede API Key e **non richiede più alcuna firma**. È un accesso diretto e libero per le risorse pubbliche.

Esempio pratico:
```text
http://localhost:3003/api/files/read/550e8400-e29b-41d4-a716-446655440000
```
(Questa è la rotta che userai dentro i tag `<img src="...">` nel tuo frontend per i file pubblici).

## GET /api/files/private-signed/{uuid}
Questa è la nuova rotta pubblica ma protetta per **scaricare/visualizzare** i file privati (cioè `isPublic=false`). Non richiede API Key in header, ma **richiede una firma valida in querystring**.
Se l'URL è manomesso, riceverai un `403 Forbidden`.

Esempio pratico:
```text
http://localhost:3003/api/files/private-signed/550e8400-e29b-41d4-a716-446655440000?expires=1790000000&signature=abc123def456
```
*(Questa è la rotta che ti restituisce `generateSignedUrl` quando interroghi un file privato).*

## GET /api/files/private/{uuid}
Usa questa per leggere file marcati come `isPublic=false` (o anche quelli pubblici, se preferisci passarci tramite backend).
Non usa Signed URL, ma **richiede l'header x-api-key** di chi ha originariamente caricato il file.

Esempio:
```http
GET /api/files/private/550e8400-e29b-41d4-a716-446655440000
```

---

# URL Firmati (Signed URLs)

Gli URL firmati sono un meccanismo di sicurezza fondamentale per proteggere l'accesso ai file (come immagini private o documenti sensibili). 
Invece di rendere un file pubblico a chiunque conosca il link, l'URL firmato richiede un "pass crittografico" (la *signature*) e una "data di scadenza" (*expires*).

### Come Funziona la Logica
1. **Il client** richiede un link temporaneo per accedere a un file.
2. **Il server** prende il percorso del file e unisce l'URL (o l'UUID) a un timestamp di scadenza (es. `expires=1790000000`).
3. **Il server** genera una firma crittografica sicura in formato HMAC_SHA256 usando una `SECRET_KEY` (configurata nel `.env` come `URL_SIGN_SECRET`).
4. **Il server** restituisce al client il link finale completo, che somiglierà a questo:
   `http://.../private-signed/008334b8-c021-44c0-8081-088aeb072ce0?expires=1790000000&signature=fc9d18...`
5. Quando qualcuno prova ad aprire quel link nel browser, il server esegue tre controlli:
   - Verifica che l'URL non sia scaduto.
   - Ricalcola la firma usando la stessa `SECRET_KEY` invisibile all'utente.
   - Confronta la firma calcolata con quella passata nel link. Se coincidono, fornisce il file. Altrimenti (se la firma non coincide o il link è scaduto), restituisce un errore `403 Forbidden`.

## GET o POST /api/files/signature (Firma Generica)
Questa rotta è utile se vuoi firmare un URL arbitrario slegato dal database (es. un link su un server S3, Cloudflare, Bookizon Storage, ecc.).
Passa `url` per un link completo, oppure `file` (es. `invoices/2026/fattura.pdf`) e il sistema aggiungerà in automatico un dominio base (configurabile tramite `STORAGE_BASE_URL` in `.env`, di default `https://storage.bookizon.it/`).

**Esempio di Comando (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:3003/api/files/signature?url=https://storage.miosito.it/files/documento.pdf&expiresIn=3600" -Method Post -Headers @{ "x-api-key" = "imgf_INSERISCI_LA_TUA_CHIAVE" } | Select-Object -ExpandProperty signedUrl
```
**Risposta:**
```json
{
  "url": "https://storage.miosito.it/files/documento.pdf",
  "expires": 1788275000,
  "signature": "9d2e8a7c...",
  "signedUrl": "https://storage.miosito.it/files/documento.pdf?expires=1788275000&signature=9d2e8a7c..."
}
```

## GET o POST /api/files/get-signature (Ottieni Firma da URL Esistente)

Questo endpoint serve per prendere un URL (o un percorso) di un file privato che hai già in mano e "trasformarlo" al volo in un URL firmato temporaneo e accessibile, senza dover ricostruire il link da zero nel frontend.

**Sicurezza:** Richiede autenticazione (API Key). L'API Key deve essere quella dell'utente che ha caricato originariamente il file (oppure una master API key globale).

### Come Funziona (Dietro le quinte)
1. **Estrazione Intelligente (RegEx):** L'endpoint non ti obbliga a passare solo l'UUID. Puoi passargli l'intero URL "sporco" e il server userà un'espressione regolare per scansionare e pescare automaticamente l'UUID al suo interno.
2. **Controllo Sicurezza (`FileDbService`):** Verifica sul database che il file esista e che la tua API Key corrisponda a quella del proprietario del file. Se non sei il proprietario, la richiesta viene bloccata con un `403 Forbidden`.
3. **Firma Crittografica (`crypto` / HMAC-SHA256):** Somma il tempo attuale con i secondi di validità richiesti (`expiresIn`) e genera un hash crittografico sicuro unendo l'UUID e la scadenza tramite il `URL_SIGN_SECRET`.
4. **Riscrittura URL:** Pulisce l'URL originale da vecchie querystring e fa un *replace* automatico della rotta (trasforma ad esempio `/api/files/private/` in `/api/files/private-signed/`), per poi accodare `?expires=...&signature=...`.

### Parametri della Richiesta
Puoi passarli sia in `query string` (se usi la GET) sia nel `body` (formato JSON, se usi la POST):
*   **`url`** *(Obbligatorio, stringa)*: L'URL (o il percorso) del file di cui vuoi ottenere il link firmato.
*   **`expiresIn`** *(Opzionale, numero)*: Per quanti secondi il link deve rimanere valido. Se non lo metti, il default è `3600` (1 ora).

**Esempio di Comando per PowerShell (Consigliato su Windows):**
Poiché PowerShell ha problemi storici a parsare il JSON all'interno del comando `curl.exe`, la soluzione più robusta e pulita su Windows è usare il comando nativo `Invoke-RestMethod`. 
Inoltre, aggiungendo `| Select-Object -ExpandProperty signedUrl` alla fine, il terminale ti stamperà solo il link pulito, pronto da copiare e incollare nel browser senza problemi di formattazione (e senza che i caratteri come la `&` vengano convertiti in `\u0026`).

```powershell
Invoke-RestMethod -Uri "http://localhost:3003/api/files/get-signature" -Method Post -Headers @{ "x-api-key" = "imgf_INSERISCI_LA_TUA_CHIAVE"; "Content-Type" = "application/json" } -Body '{"url": "http://localhost:3003/api/files/private/008334b8-c021-44c0-8081-088aeb072ce0", "expiresIn": 7200}' | Select-Object -ExpandProperty signedUrl
```

*(Se invece ti serve l'intero oggetto JSON in risposta, sostituisci la parte finale con `| ConvertTo-Json`)*

**Risposta di Successo (200 OK):**
```json
{
  "signature": "ab12cd34ef56...",
  "uuid": "008334b8-c021-44c0-8081-088aeb072ce0",
  "expires": 1788279788,
  "signedUrl": "http://localhost:3003/api/files/private-signed/008334b8-c021-44c0-8081-088aeb072ce0?expires=1788279788&signature=ab12cd34ef56..."
}
```

**Risposte di Errore Comuni:**
*   **`400 Bad Request`**: Manca il parametro `url` o non c'è traccia di un UUID valido all'interno dell'URL fornito.
*   **`403 Forbidden`**: L'API key fornita non ha i permessi (non è il proprietario del file).
*   **`404 Not Found`**: L'UUID estratto non esiste nel database.

---

# Gestione Policy MinIO 🛡️

Il sistema offre due modi per gestire in automatico le "regole" (policy) di MinIO, ad esempio per decidere se un'intera cartella deve essere pubblica.

## 1. File `rules.json` (Automatica all'avvio)
Nella root del progetto troverai un file chiamato `rules.json`. Puoi scrivere qui dentro le tue policy AWS S3 divise per bucket.
Ogni volta che **avvii il server Node.js**, il server legge questo file e applica automaticamente le policy su MinIO.

La regola d'oro di MinIO è: **Tutto è PRIVATO di default**. Se non scrivi una regola che permette esplicitamente la lettura, nessuno potrà scaricare i file direttamente dallo storage (es. usando `/read/`) senza autorizzazione.

Il primissimo livello del file JSON indica **il nome del bucket**. All'interno scrivi le regole in formato AWS S3.

### Spiegazione dei Campi
*   **`Effect`**: Può essere `"Allow"` (Permetti) o `"Deny"` (Nega).
*   **`Principal`**: Indica "chi" è autorizzato. Il valore `"*"` significa "chiunque su internet" (accesso anonimo).
*   **`Action`**: Quale azione è permessa. `"s3:GetObject"` significa "solo permesso di scaricare/leggere il file".
*   **`Resource`**: L'elenco dei percorsi esatti su cui applicare la regola (es. `arn:aws:s3:::bucket/cartella/*`).
*   **`NotResource`**: L'opposto di Resource. Applica la regola su TUTTO il bucket, *tranne* i percorsi elencati qui.

### Caso 1: Solo una cartella specifica PUBBLICA (il resto è privato)
Vuoi che tutto il bucket `savedimages` sia privato, ma la cartella `public/` deve essere visibile a tutti:
```json
{
  "savedimages": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": { "AWS": ["*"] },
        "Action": ["s3:GetObject"],
        "Resource": ["arn:aws:s3:::savedimages/public/*"]
      }
    ]
  }
}
```

### Caso 2: Tutto PUBBLICO, tranne una cartella PRIVATA
Vuoi che chiunque possa leggere i file dal bucket `testapi`, tranne i file dentro la cartella sensibile `portfolio/`:
```json
{
  "testapi": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": { "AWS": ["*"] },
        "Action": ["s3:GetObject"],
        "NotResource": ["arn:aws:s3:::testapi/portfolio/*"]
      }
    ]
  }
}
```

### Caso 3: Più cartelle Pubbliche
Se vuoi rendere pubbliche due cartelle diverse contemporaneamente in uno stesso bucket:
```json
{
  "nomebucket": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": { "AWS": ["*"] },
        "Action": ["s3:GetObject"],
        "Resource": [
          "arn:aws:s3:::nomebucket/loghi/*",
          "arn:aws:s3:::nomebucket/sfondi/*"
        ]
      }
    ]
  }
}
```

## 2. POST /api/files/bucket-policy (In tempo reale)
Se non vuoi riavviare il server, puoi inviare una policy in tempo reale usando le API. **Richiede Token Admin**.

Header:
```http
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json
```

Body:
```json
{
  "bucket": "savedimages",
  "policy": { ... } // Oggetto JSON con la tua policy
}
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
- Nessun file privato può essere letto senza firma (tramite `/private-signed/`) o senza API Key (tramite `/private/`). I file pubblici invece sono ad accesso libero su `/read/`.
- Tieni il `.env` fuori dal repo. Lì dentro ora risiede la password `URL_SIGN_SECRET` per generare le firme degli URL, essenziale per la sicurezza.
- Il DB per le API keys, i log di accesso e i file usa password sicure e gli hash in SHA-256 (no cleartext!).
- **Docker**: Ho sistemato il `.dockerignore`. Così evitiamo di portarci dietro file inutili o, peggio, database locali (`mysql-data`) ed `.env` quando buildiamo l'immagine. Tutto più pulito e sicuro. Se modifichi la logica dei file in locale (es. `AccessController.js`, `SecurityService.js`), ricorda sempre di riavviare Docker ricostruendo l'immagine con `docker-compose up -d --build app`.
- **Troubleshooting "Errore Interno" su Signed URL:** Se navighi su un `signedUrl` che hai appena generato (quindi con firma sicuramente corretta) ma ricevi `"error": "Errore interno"` (status 500) invece di `"Firma non valida o scaduta"` (status 403), significa che **il sistema ha validato l'accesso con successo**, ma il file fisico su MinIO non esiste (es. è stato cancellato).
- **Gestione degli '&' (E Commerciale) su Windows:** Se provi a incollare un `signedUrl` nel prompt di comando o in PowerShell, potresti ricevere un errore a causa del carattere `&`. Questo vale solo per la riga di comando (in PowerShell racchiudi il link tra virgolette `"`). Nel codice o nel browser funziona normalmente.