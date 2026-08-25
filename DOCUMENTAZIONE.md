# Documentazione tecnica

## 1. Scopo del progetto

Questo progetto è una piattaforma Node.js/Express per il caricamento e il ridimensionamento automatico di immagini.

Il flusso principale consente di:

1. aprire una pagina web;
2. selezionare o trascinare un'immagine;
3. scegliere se conservare anche il file originale;
4. scegliere una o più dimensioni di output;
5. generare automaticamente le varianti mantenendo le proporzioni;
6. salvare originale e varianti in un bucket MinIO compatibile S3;
7. visualizzare nella pagina le varianti appena create.

L'idea funzionale prende spunto dall'estensione Firebase **Storage Resize Images**, ma non integra Firebase e non contiene il codice dell'estensione. Il progetto replica solamente il comportamento generale di elaborazione e archiviazione delle immagini, adattandolo a Express, Sharp e MinIO.

---

## 2. Tecnologie utilizzate

- **Node.js**: runtime JavaScript lato server.
- **Express**: server HTTP e routing API.
- **Multer**: ricezione degli upload multipart/form-data.
- **Sharp**: lettura dei metadati e ridimensionamento delle immagini.
- **AWS SDK for JavaScript**: client S3 utilizzato per comunicare con MinIO.
- **MinIO**: storage a oggetti locale compatibile con API S3.
- **Helmet**: intestazioni HTTP di sicurezza e Content Security Policy.
- **CORS**: gestione delle richieste cross-origin.
- **dotenv**: caricamento delle variabili dal file `.env`.
- **PostgreSQL, Redis e JWT**: componenti predisposti per funzionalità aggiuntive, non necessari per il flusso web principale.

Il file `public/index.php` è in realtà HTML con JavaScript e CSS incorporati. Non viene eseguito da PHP: Express lo invia come pagina HTML.

---

## 3. Struttura del progetto

```text
resize-images/
├── Controllers/
│   ├── AdminController.js
│   ├── AuthController.js
│   ├── BucketController.js
│   ├── ResizeController.js
│   └── StorageController.js
├── Models/
│   ├── Bucket.js
│   ├── EventLog.js
│   ├── File.js
│   ├── ResizeJob.js
│   └── User.js
├── Routes/
│   ├── admin.routes.js
│   ├── auth.routes.js
│   ├── bucket.routes.js
│   ├── resize.routes.js
│   └── storage.routes.js
├── config/
│   ├── ai.js
│   ├── database.js
│   ├── resize.js
│   └── storage.js
├── jobs/
│   ├── moderation.worker.js
│   └── resize.worker.js
├── middlewares/
│   ├── auth.js
│   ├── roles.js
│   ├── upload.js
│   └── validations.js
├── services/
│   ├── EventService.js
│   ├── ModerationService.js
│   ├── ResizeService.js
│   └── StorageService.js
├── utils/
│   ├── logger.js
│   └── s3Client.js
├── public/
│   └── index.php
├── saved-images/
├── data/
├── .env
├── package.json
├── package-lock.json
└── server.js
```

### 3.1 `server.js`

È il punto di ingresso dell'applicazione.

Le sue responsabilità sono:

- caricare `.env` con `dotenv`;
- creare l'applicazione Express;
- attivare Helmet;
- attivare CORS;
- abilitare il parsing JSON;
- servire la pagina principale su `/`;
- servire eventuali file locali su `/saved-images`;
- registrare le route API;
- esporre `/health`;
- ascoltare sulla porta definita da `PORT`.

La porta configurata normalmente è `3003`.

La pagina viene servita con:

```text
GET /
```

Il controllo di salute è:

```text
GET /health
```

Risposta di esempio:

```json
{
  "status": "ok",
  "timestamp": "2026-08-25T10:01:45.847Z"
}
```

---

## 4. Configurazione MinIO

Nel progetto il file `.env` è configurato per usare MinIO:

```env
STORAGE_TYPE=minio
MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=savedimages
```

È importante distinguere due porte:

- `http://127.0.0.1:62192/browser/savedimages`: Console web di MinIO, utilizzata per navigare manualmente nel bucket;
- `http://127.0.0.1:9000`: API S3, utilizzata dal backend per upload e download.

L'applicazione non usa l'URL `/browser/...` per salvare file. Quell'indirizzo è una console HTML e non un endpoint S3.

Il bucket deve esistere prima dell'upload. Il codice invia gli oggetti a `savedimages`, ma non crea automaticamente il bucket.

Il client viene costruito in `config/storage.js` tramite `S3Client`:

- regione: `us-east-1`;
- endpoint: `MINIO_ENDPOINT`;
- credenziali: `MINIO_ROOT_USER` e `MINIO_ROOT_PASSWORD`;
- `forcePathStyle: true` per compatibilità con MinIO.

---

## 5. Interfaccia web

La UI è definita in `public/index.php`.

Offre:

- selezione file dal browser;
- drag-and-drop;
- filtro dei formati immagine accettati;
- limite visivo di 15 MB;
- scelta tra conservare o non conservare l'originale;
- tre dimensioni predefinite: `200x200`, `400x400`, `680x680`;
- massimo due campi aggiuntivi per dimensioni personalizzate;
- messaggi di avanzamento o errore;
- galleria delle varianti prodotte.

I tre preset possono essere selezionati tramite checkbox. Il pulsante `+ Aggiungi dimensione personalizzata` crea un campo nel formato:

```text
larghezza x altezza
```

Esempi validi:

```text
120x120
1024x768
1920x1080
```

Il browser costruisce un `FormData` con i seguenti campi:

```text
file          file binario
keepOriginal  true oppure false
sizes         uno o più valori, ad esempio 200x200
```

Dopo la risposta del server, per ogni variante viene costruita un'immagine collegata a:

```text
GET /api/files/object/<chiave-oggetto>
```

In questo modo il browser non legge la cartella del progetto: il backend recupera l'oggetto da MinIO e lo restituisce in streaming.

---

## 6. Upload: flusso completo

### 6.1 Ricezione della richiesta

La route principale è:

```text
POST /api/files/upload
```

La richiesta deve essere `multipart/form-data` e deve contenere il campo `file`.

Multer usa `memoryStorage()`, quindi il file viene tenuto in memoria durante l'elaborazione. Non viene scritto prima in una cartella temporanea.

### 6.2 Formati accettati

La route accetta questi MIME type:

- `image/jpeg`;
- `image/png`;
- `image/webp`;
- `image/gif`;
- `image/avif`;
- `image/tiff`.

La dimensione massima della richiesta è 15 MB.

Il filtro MIME è un primo controllo pratico, ma non sostituisce una verifica completa del contenuto binario dell'immagine.

### 6.3 Validazione delle dimensioni

Il controller legge tutti i campi `sizes` ricevuti.

Le regole sono:

- almeno una dimensione;
- massimo cinque dimensioni totali;
- massimo due personalizzate, considerando i tre preset presenti nella UI;
- nessun duplicato;
- formato obbligatorio `numero x numero`;
- larghezza e altezza composte da massimo cinque cifre;
- larghezza e altezza diverse da zero.

Esempio valido:

```text
sizes=200x200
sizes=500x300
sizes=1200x800
```

Esempio rifiutato perché contiene sei dimensioni:

```text
sizes=100x100
sizes=200x200
sizes=300x300
sizes=400x400
sizes=500x500
sizes=600x600
```

In caso di errore il server restituisce HTTP `400`:

```json
{
  "error": "Seleziona almeno una dimensione valida"
}
```

### 6.4 Sanitizzazione del nome

Il nome originale viene sanitizzato sostituendo ogni carattere non appartenente a questo insieme:

```text
A-Z a-z 0-9 . _ -
```

Esempio:

```text
foto vacanza (1).jpg
```

diventa:

```text
foto-vacanza--1-.jpg
```

Il nome non contiene UUID o prefissi casuali.

### 6.5 Generazione delle varianti

Il controller passa il buffer e le dimensioni al `ResizeService`.

Il servizio:

1. crea un'immagine Sharp dal buffer;
2. legge i metadati dell'immagine;
3. esegue un ciclo sulle dimensioni richieste;
4. crea una copia dell'immagine con `clone()`;
5. applica `resize(width, height, { fit: 'inside' })`;
6. converte il risultato in un nuovo buffer;
7. carica il buffer su MinIO.

L'opzione `fit: 'inside'` è importante perché riduce l'immagine dentro il rettangolo indicato senza deformarla e senza effettuare un crop obbligatorio.

Per esempio, se l'immagine originale è `480x640` e si chiede `200x100`, il risultato mantiene il rapporto e può essere più piccolo di uno dei due limiti.

### 6.6 Salvataggio originale

Le varianti vengono generate prima dell'originale.

Se il campo è:

```text
keepOriginal=false
```

vengono salvate solo le varianti.

Se il campo è:

```text
keepOriginal=true
```

dopo la generazione delle varianti viene salvato anche l'originale.

Questa sequenza evita di conservare l'originale quando l'utente ha scelto esplicitamente di non farlo, ma significa anche che, se il salvataggio dell'originale fallisce dopo che le varianti sono state caricate, alcune varianti possono rimanere nel bucket prima della risposta `500`.

---

## 7. Naming e struttura degli oggetti

Il formato attuale è:

```text
thumbs/NomeOriginale_Dimensione.estensione
```

Esempio con `paesaggio.jpg`:

```text
thumbs/paesaggio_200x200.jpg
thumbs/paesaggio_800x600.jpg
```

Se viene conservato anche l'originale:

```text
paesaggio.jpg
```

La directory `thumbs` deriva dalla configurazione:

```env
RESIZED_PATH=/thumbs
```

Il servizio rimuove gli slash iniziali e finali per ottenere una chiave S3 coerente:

```text
thumbs/
```

La struttura del bucket è quindi:

```text
savedimages/
├── foto.jpg
└── thumbs/
    ├── foto_200x200.jpg
    └── foto_800x600.jpg
```

### Collisioni

Il nome originale non include un UUID. Di conseguenza, due upload con lo stesso nome nella stessa posizione possono sovrascrivere l'oggetto precedente, in base al comportamento di `PutObject` di MinIO/S3.

Questa scelta segue la richiesta di naming leggibile, ma in produzione sarebbe opportuno aggiungere una strategia anti-collisione, per esempio:

- una directory per utente;
- una directory per upload;
- una versione numerica;
- un identificatore nel percorso, lasciando comunque leggibile il nome del file.

---

## 8. Risposta dell'API

In caso di successo `POST /api/files/upload` restituisce HTTP `201`.

Esempio:

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

Quando l'originale non deve essere conservato:

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

### Esempio con cURL

Conservare originale e creare due varianti:

```powershell
curl.exe -s `
  -F "file=@foto.jpg" `
  -F "keepOriginal=true" `
  -F "sizes=200x200" `
  -F "sizes=800x600" `
  http://localhost:3003/api/files/upload
```

Creare solo una variante senza originale:

```powershell
curl.exe -s `
  -F "file=@foto.jpg" `
  -F "keepOriginal=false" `
  -F "sizes=1200x800" `
  http://localhost:3003/api/files/upload
```

Leggere un oggetto dal bucket attraverso il backend:

```text
GET http://localhost:3003/api/files/object/thumbs/foto_200x200.jpg
```

---

## 9. StorageService

`services/StorageService.js` centralizza le operazioni sullo storage.

### `uploadFile`

Riceve:

- bucket;
- chiave dell'oggetto;
- buffer;
- Content-Type.

Con `STORAGE_TYPE=minio` utilizza `PutObjectCommand` dell'AWS SDK.

Con `STORAGE_TYPE=local` usa invece la cartella locale `saved-images/`. Questa modalità è stata mantenuta come fallback tecnico per sviluppo, ma la configurazione corrente usa MinIO.

### `getFile`

Con MinIO utilizza `GetObjectCommand` e restituisce il body in streaming.

La route `GET /api/files/object/*` inoltra lo stream al browser. Questo permette di visualizzare immagini anche se il bucket non è pubblico.

### `deleteFile`

Supporta la cancellazione sia da MinIO sia dallo storage locale. Nel flusso web corrente non viene chiamata per rimuovere automaticamente l'originale: la modalità senza originale evita direttamente il suo upload.

---

## 10. Route disponibili

### Storage

```text
POST /api/files/upload
GET  /api/files/object/*
```

Il primo endpoint carica ed elabora immagini. Il secondo legge oggetti dal bucket configurato.

### Health

```text
GET /health
```

Non richiede autenticazione.

### Autenticazione

```text
POST /api/auth/login
```

La route attuale è ancora un placeholder e non usa davvero il controller JWT.

### Bucket

```text
POST /api/buckets
GET  /api/buckets
```

Richiedono il middleware di autenticazione.

### Resize job

```text
GET  /api/resize/jobs/:fileId
POST /api/resize/trigger/:fileId
```

Richiedono autenticazione. Il trigger manuale è attualmente simulato e restituisce un messaggio senza eseguire una vera elaborazione.

### Amministrazione

```text
GET /api/admin/stats
```

Richiede autenticazione e ruolo `admin`.

---

## 11. Componenti predisposti ma non parte del flusso principale

### 11.1 PostgreSQL e Models

I modelli sotto `Models/` sono predisposti per utenti, bucket, file, job di resize ed eventi.

Tuttavia il percorso attuale di upload è indipendente dal database:

- non crea un record in `File`;
- non crea un record in `ResizeJob`;
- non registra eventi in `EventLog`;
- non richiede una connessione PostgreSQL per generare le varianti.

Non sono presenti migrazioni o uno schema completo delle tabelle.

### 11.2 Redis e EventService

`EventService.js` è predisposto per pubblicare eventi tramite Redis e registrarli nel database.

L'upload sincrono corrente non invoca `EventService.emit`.

### 11.3 Worker

Sono presenti:

- `jobs/resize.worker.js`;
- `jobs/moderation.worker.js`.

Non vengono avviati da `server.js` e non ci sono script npm dedicati per avviarli. Il flusso funzionante usa direttamente il `ResizeService` nella richiesta HTTP.

### 11.4 Moderazione AI

`ModerationService.js` è predisposto per una moderazione tramite provider AI, ma le implementazioni attuali sono placeholder o non completano realmente il ciclo di sostituzione con placeholder.

La moderazione non viene eseguita automaticamente durante l'upload web corrente.

### 11.5 Autenticazione

Sono presenti middleware JWT e controller per autenticazione, ma il login esposto dalla route è ancora da implementare. L'endpoint di upload è attualmente pubblico.

---

## 12. Configurazione resize

`config/resize.js` definisce valori predefiniti:

```env
RESIZE_SIZES=200x200,400x400,680x680
KEEP_ORIGINAL=true
RESIZED_PATH=/thumbs
```

Nel flusso web attuale:

- le dimensioni vengono prese dalla richiesta;
- `keepOriginal` viene preso dalla richiesta;
- `RESIZE_SIZES` e `KEEP_ORIGINAL` servono come configurazione di default o per componenti futuri.

Il formato configurabile è una lista separata da virgole:

```text
200x200,400x400,680x680
```

---

## 13. Avvio del progetto

Prerequisiti:

- Node.js 18 o superiore;
- npm;
- MinIO avviato;
- bucket `savedimages` creato;
- credenziali MinIO coerenti con `.env`.

Installazione dipendenze:

```powershell
npm install
```

Avvio:

```powershell
npm start
```

Sito:

```text
http://localhost:3003
```

Console MinIO:

```text
http://127.0.0.1:62192/browser/savedimages
```

Se la porta `3003` è occupata, non è possibile avviare una seconda istanza sulla stessa porta. Occorre chiudere il processo esistente oppure scegliere una porta temporanea:

```powershell
$env:PORT=3010; npm start
```

---

## 14. Riferimento all'estensione Firebase

Il riferimento funzionale è:

```text
https://github.com/firebase/extensions/tree/master/storage-resize-images
```

L'estensione Firebase osserva un bucket Cloud Storage. Quando rileva un nuovo file immagine:

1. verifica che il file sia un'immagine supportata;
2. legge dimensioni e formato;
3. crea una o più versioni ridimensionate;
4. mantiene il rapporto d'aspetto;
5. aggiunge larghezza e altezza al nome della variante;
6. salva le varianti nello stesso bucket;
7. permette di conservare oppure eliminare l'originale secondo configurazione.

Questi sono i concetti ripresi nel progetto:

| Comportamento Firebase | Implementazione nel progetto |
|---|---|
| Reazione a un'immagine caricata | `POST /api/files/upload` riceve il file via Multer |
| Verifica che il file sia immagine | filtro MIME della route e lettura Sharp |
| Dimensioni multiple | checkbox preset e fino a due dimensioni custom |
| Rapporto d'aspetto | Sharp con `fit: 'inside'` |
| Nome con dimensioni | `NomeOriginale_Dimensione.ext` |
| Storage nello stesso bucket | MinIO bucket `savedimages` |
| Conservazione opzionale originale | campo multipart `keepOriginal` |
| Percorso separato varianti | prefisso `thumbs/` |
| Recupero dei risultati | endpoint streaming `GET /api/files/object/*` |

### 14.1 Cosa non è stato copiato

Non sono stati copiati:

- codice sorgente dell'estensione Firebase;
- funzioni Cloud Functions;
- trigger Firebase Storage;
- Eventarc;
- Firebase Cloud Storage;
- sistema di configurazione dell'installer Firebase;
- API interne o nomi proprietari dell'estensione.

È stata utilizzata solamente l'idea generale del comportamento osservabile e documentato.

### 14.2 Differenze rispetto a Firebase

L'estensione Firebase lavora in modo event-driven: il caricamento nel bucket genera un evento e una funzione in background esegue il resize.

Questo progetto lavora invece in modo sincrono:

```text
browser -> Express -> Multer -> Sharp -> MinIO -> risposta HTTP
```

Di conseguenza:

- il browser aspetta la fine dell'elaborazione;
- non serve un trigger esterno;
- non serve Firebase;
- non serve Cloud Functions;
- l'applicazione può essere eseguita localmente;
- un errore durante il resize viene restituito direttamente alla richiesta.

L'estensione Firebase supporta inoltre molte opzioni avanzate che qui non sono ancora implementate, tra cui:

- conversione in più formati di output;
- copia completa dei metadati;
- cache-control configurabile;
- gestione avanzata di GIF e WebP animati;
- filtri di inclusione ed esclusione per percorso;
- moderazione AI operativa;
- placeholder per immagini bloccate;
- eventi di completamento;
- backfill e gestione specifica degli oggetti già presenti.

Questo progetto implementa il nucleo richiesto: upload, resize multiplo, naming leggibile, scelta dell'originale e salvataggio su storage S3 compatibile.

---

## 15. Stato attuale e limiti tecnici

Il flusso web principale è operativo, ma prima di un uso pubblico o di produzione andrebbero affrontati questi punti:

1. le credenziali e i secret presenti in `.env` non dovrebbero essere committati;
2. l'upload dovrebbe avere autenticazione, rate limiting e quote;
3. CORS dovrebbe essere limitato ai domini autorizzati;
4. il contenuto reale del file dovrebbe essere verificato oltre al MIME dichiarato;
5. Sharp dovrebbe avere limiti sul numero totale di pixel per evitare richieste eccessive;
6. il nome senza UUID può causare sovrascritture;
7. sarebbe utile una strategia di cleanup se una variante fallisce a metà;
8. il bucket dovrebbe avere policy e permessi espliciti;
9. il login e i worker dovrebbero essere completati prima di attivare le funzioni collegate;
10. servono test automatici per upload, validazione, resize, naming e storage;
11. occorre uniformare il filtro di `middlewares/upload.js` con quello della route, oppure rimuovere il middleware duplicato;
12. servono migrazioni PostgreSQL se si vogliono usare i modelli e i job persistenti.

---

## 16. Riassunto operativo

Per usare il progetto:

1. avvia MinIO e crea il bucket `savedimages`;
2. verifica endpoint e credenziali in `.env`;
3. esegui `npm install`;
4. esegui `npm start`;
5. apri `http://localhost:3003`;
6. scegli un'immagine;
7. scegli se conservare l'originale;
8. seleziona le dimensioni preset oppure aggiungi al massimo due dimensioni personalizzate;
9. avvia l'elaborazione;
10. verifica gli oggetti nella Console MinIO alla pagina `browser/savedimages`.

Il risultato principale è una serie di oggetti con questa convenzione:

```text
thumbs/NomeOriginale_Dimensione.ext
```

L'originale viene salvato alla radice del bucket solo quando è stata selezionata la relativa opzione.

---

## 17. Integrazione API ed Esempi

Il progetto espone endpoint pensati per essere utilizzati da applicazioni esterne. Durante i test, queste API sono state completamente verificate confermando il corretto funzionamento dell'autenticazione, dell'upload (compresi validazione formati e size) e del retrieve delle varianti su MinIO.

### 17.1 Generazione API Key

Per generare una chiave, devi chiamare il seguente endpoint:

```text
POST /api/auth/api-key
```

**Nota di Sicurezza:** L'endpoint richiede l'intestazione (header) `x-admin-secret`. Questo valore deve corrispondere esattamente alla variabile `ADMIN_SECRET` definita nel tuo file `.env`. Se l'header non è fornito o è errato, il server restituisce `403 Forbidden` (`{"error":"Non autorizzato a generare API key"}`). In questo modo le API non possono generare incontrollatamente altre API!

La risposta in caso di successo (HTTP 201) contiene la chiave in chiaro **una sola volta**:

```json
{
  "apiKey": "imgf_3082ab365d1bff27dfe3b01c52d4db79eb164705ef8371299e9f92f9da504b38",
  "uploadEndpoint": "/api/files/upload-api"
}
```

Il file locale `api-keys.json` conserva gli hash SHA-256 (non le chiavi in chiaro).

### 17.2 Upload tramite API

L'endpoint protetto per il caricamento remoto è:

```text
POST /api/files/upload-api
```

Per usare l'API è possibile inviare la chiave generata in uno dei due modi:
- `x-api-key: imgf_<API_KEY>`
- `Authorization: Bearer imgf_<API_KEY>`

La risposta testata di successo (HTTP 201) quando si sceglie di mantenere l'originale (`keepOriginal: true`) e ridimensionare a `100x100` e `50x50` è:

```json
{
  "original": "test.png",
  "keepOriginal": true,
  "variants": [
    "thumbs/test_100x100.png",
    "thumbs/test_50x50.png"
  ],
  "message": "Immagine salvata con originali"
}
```

### 17.3 Esempi di Integrazione nel Codice

Di seguito esempi pratici per integrare il caricamento in altri linguaggi e framework.

#### Node.js (Axios)
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadImage() {
  const form = new FormData();
  form.append('file', fs.createReadStream('test.jpg'));
  form.append('keepOriginal', 'true');
  form.append('sizes', '200x200');
  form.append('sizes', '800x600');

  try {
    const response = await axios.post('http://localhost:3003/api/files/upload-api', form, {
      headers: {
        ...form.getHeaders(),
        'x-api-key': 'imgf_TUA_CHIAVE'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}
uploadImage();
```

#### Python (Requests)
```python
import requests

url = "http://localhost:3003/api/files/upload-api"
headers = {
    "x-api-key": "imgf_TUA_CHIAVE"
}

with open("test.jpg", "rb") as f:
    files = {"file": f}
    data = {
        "keepOriginal": "true",
        "sizes": ["200x200", "800x600"]
    }
    
    response = requests.post(url, headers=headers, files=files, data=data)
    print(response.json())
```

#### PHP (cURL)
```php
<?php
$ch = curl_init();

$cfile = new CURLFile(realpath('test.jpg'), 'image/jpeg', 'test.jpg');

$data = array(
    'file' => $cfile,
    'keepOriginal' => 'true',
    'sizes[0]' => '200x200',
    'sizes[1]' => '800x600'
);

curl_setopt($ch, CURLOPT_URL, "http://localhost:3003/api/files/upload-api");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "x-api-key: imgf_TUA_CHIAVE"
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

#### Bash / Shell / PowerShell (cURL)
```bash
curl -X POST -H "x-api-key: imgf_TUA_CHIAVE" \
  -F "file=@test.jpg" \
  -F "keepOriginal=true" \
  -F "sizes=100x100" \
  -F "sizes=50x50" \
  http://localhost:3003/api/files/upload-api
```

### 17.4 Recupero Oggetti (Retrieve)

Puoi sempre recuperare l'immagine caricata senza API Key effettuando una richiesta GET alla route che funge da proxy verso MinIO:

```text
GET http://localhost:3003/api/files/object/thumbs/test_100x100.png
```

Se il file esiste, il backend restituisce il file in stream con il corretto `Content-Type` (es. `image/png` o `image/jpeg`) e `HTTP 200 OK`. In caso contrario, restituirà un `404 Not Found`.

---

## 18. Sicurezza delle API key e Considerazioni

Il file `api-keys.json` è adatto a un ambiente locale o a un singolo server. Per un ambiente distribuito sarebbe preferibile salvare gli hash in un database con identificativo, revoca, scadenza, permessi e audit. La chiave non deve MAI essere inserita nel codice frontend di un'applicazione pubblica (come una web-app in React/Vue esposta all'utente), perché sarebbe visibile e utilizzabile da chiunque per aggirare l'interfaccia: va conservata unicamente lato server. L'endpoint di generazione `POST /api/auth/api-key` ora impedisce agli attaccanti di creare ulteriori chiavi, blindando efficacemente l'uso del servizio.
