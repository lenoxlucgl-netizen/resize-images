# Documentazione tecnica

## 1. Scopo del progetto

Ho creato questo progetto come piattaforma Node.js/Express per caricare e ridimensionare le immagini in automatico.

In pratica fa questo:

1. apri la pagina web (divisa nei tab **Tutti i file**, **Foto** e **Video**);
2. selezioni o trascini qualsiasi file ti pare (immagini, video, zip, ecc.);
3. se vuoi, scegli una cartella specifica e un bucket di destinazione;
4. per le immagini, puoi decidere se tenere l'originale (o salvare solo quello) e puoi generare quante dimensioni vuoi;
5. per i video e gli altri file, li salva così come sono senza toccarli;
6. butta tutto su un bucket MinIO compatibile con S3;
7. ti fa vedere il risultato e i file salvati direttamente in pagina.

L'idea mi è venuta guardando l'estensione Firebase **Storage Resize Images**, ma qui non c'è traccia di Firebase o del loro codice. Ho solo replicato il modo in cui gestiscono e archiviano le immagini, rifacendo tutto con Express, Sharp e MinIO.

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
- **PostgreSQL e Redis**: li ho già predisposti per funzionalità aggiuntive (tipo i worker o db relazionale), ma non servono per il flusso web base.

Ah, una nota: il file `public/index.php` in realtà è puro HTML con JS e CSS dentro. Non lo esegue PHP, ma lo sputa fuori direttamente Express come pagina statica.

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

Questo è l'entry point dell'app.

Cosa fa in soldoni:

- carica il `.env` tramite `dotenv`;
- tira su l'app Express;
- attiva Helmet per un po' di sicurezza base;
- abilita i CORS;
- parsa il JSON in ingresso;
- serve la pagina principale sulla route `/`;
- serve i file locali su `/saved-images` (se si usa storage locale);
- registra tutte le route delle API;
- espone l'endpoint `/health`;
- si mette in ascolto sulla porta che ho definito in `PORT`.

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

Di default ho impostato il `.env` per usare MinIO locale:

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

Offre tre tab principali: **Tutti i file**, **Foto** e **Video**.

**Tab Tutti i file**:
- permette il caricamento di qualsiasi formato di file (PDF, ZIP, documenti, ecc.);
- salva i file nel formato originale senza elaborazioni, posizionandoli nella cartella `files/` o nel percorso personalizzato.

**Tab Foto**:
- selezione file dal browser o drag-and-drop (con validazione per accettare solo immagini);
- nessun limite massimo di dimensione o peso;
- opzioni per specificare il *Percorso Originale* e il *Percorso Modificate* nel bucket (se il percorso modificate viene inviato vuoto `""`, salva nella root);
- scelta tra conservare l'originale, conservare modificate + originale, o **Solo originale** (ignora le dimensioni e salva il file intero);
- tre dimensioni predefinite, ma con la possibilità di aggiungere **infinite** dimensioni personalizzate;
- messaggi di avanzamento o errore (incluso errore 409 se l'immagine è già presente per evitare duplicati);
- galleria delle varianti prodotte.

**Tab Video**:
- selezione file video o drag-and-drop (con validazione per accettare solo video);
- opzione per specificare il *Percorso di salvataggio* nel bucket;
- i video vengono caricati nel loro formato originale (non vengono ridimensionati).

**Gestione API e Autenticazione**:
Nella UI è presente un campo "Sessione" in cui incollare una API Key valida per poter effettuare upload. È inoltre possibile generare nuove API Key (selezionando il Bucket desiderato) se autenticati come amministratori.

I tre preset delle immagini possono essere selezionati tramite checkbox. Il pulsante `+ Aggiungi dimensione personalizzata` crea un campo nel formato:

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

La route accetta **qualsiasi tipo di file**. 
Non è presente alcun limite al peso dei file (nessun limite di 15 MB o 100 MB).

Internamente, il sistema controlla il MIME Type del file:
- Se inizia con `image/`: lo tratta come immagine.
- Se inizia con `video/`: lo tratta come video (salvato in `videos/`).
- Tutti gli altri formati: li tratta come file generici (salvati in `files/`).

I file non-immagine (o le immagini con opzione `keepOriginal: only`) vengono salvati integralmente alla posizione indicata senza subire ridimensionamenti.

Inoltre, il sistema verifica l'esistenza di eventuali **duplicati**: se un file con il medesimo percorso e nome esiste già nel bucket, il server blocca il caricamento e restituisce un errore `409 Conflict`.

### 6.3 Validazione delle dimensioni

Il controller legge tutti i campi `sizes` ricevuti.

Le regole sono:

- almeno una dimensione (se non è selezionata l'opzione "Solo originale");
- nessun limite al numero totale di dimensioni;
- nessun duplicato;
- formato obbligatorio `numero x numero`;
- larghezza e altezza composte da massimo cinque cifre;
- larghezza e altezza maggiore di zero.

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
thumbs/NomeOriginale-Dimensione.estensione
```

Esempio con `paesaggio.jpg` (dimensione originale 2000x1500):

```text
thumbs/paesaggio-200x200.jpg
thumbs/paesaggio-800x600.jpg
```

Se viene conservato anche l'originale:

```text
paesaggio-2000x1500.jpg
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

Se un file con lo stesso nome viene caricato, il file precedente verrà **sovrascritto** senza mostrare errori. Questo comportamento (implementato di recente per facilitare caricamenti massivi in sovrascrittura) permette di aggiornare agilmente file vecchi mantenendo le chiavi S3 invariate. In produzione, se l'esigenza cambia, sarebbe opportuno aggiungere una logica anti-collisione.

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

Restituisce un token HMAC generato usando la chiave `APP_SECRET` per autenticare l'utente amministratore, previa validazione delle credenziali. JWT non viene più utilizzato, essendo stato sostituito da questo meccanismo custom e dalle API key.

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

### Amministrazione

```text
GET /api/admin/stats
```

Richiede autenticazione e ruolo `admin`.

---

## 11. Componenti predisposti ma non parte del flusso principale

### 11.1 Redis e EventService

`EventService.js` è predisposto per pubblicare eventi tramite Redis e registrarli nel database.

L'upload sincrono corrente non invoca `EventService.emit`.

### 11.2 Worker

Sono presenti:

- `jobs/resize.worker.js`;
- `jobs/moderation.worker.js`.

Non vengono avviati da `server.js` e non ci sono script npm dedicati per avviarli. Il flusso funzionante usa direttamente il `ResizeService` nella richiesta HTTP.

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
| Nome con dimensioni | `NomeOriginale-Dimensione.ext` |
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

Questo progetto lavora invece in modo sincrono (almeno per ora):

```text
browser -> Express -> Multer -> Sharp -> MinIO -> risposta HTTP
```

Questo significa che:

- il browser aspetta che finisca tutto il giro;
- non mi serve un trigger S3 esterno;
- addio dipendenza da Firebase o Cloud Functions;
- gira tutto in locale sul mio PC o server;
- se c'è un errore, lo sparo subito in faccia al client.

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

## 15. Cose da sistemare / Limiti attuali

Il grosso funziona alla grande, ma prima di metterlo in produzione vera ci sono un paio di robe da smarcare:

1. togliere credenziali e secret dai commit (ovvio);
2. aggiungere un rate limiting o quote sugli upload;
3. limitare i CORS solo ai domini che mi servono;
4. controllare i magic byte dei file, fidarsi solo del MIME type non è il massimo;
5. mettere un limite massimo ai pixel su Sharp, altrimenti mi tirano giù il server con immagini giganti;
6. il naming così com'è (senza UUID) rischia sovrascritture, magari andrebbe gestito;
7. serve un cleanup intelligente se la generazione di una variante si spacca a metà;
8. blindare il bucket con policy e permessi giusti;
9. finire la parte di login e worker prima di abilitarli;
10. scrivere due test automatici su upload, validazione e storage;
11. sistemare il middleware duplicato per l'upload (`middlewares/upload.js` contro la route);
12. fare le migrazioni su PostgreSQL se decidiamo di accendere i job persistenti.

---

## 16. Recap per farlo girare

Riassumendo, per accendere tutto:

1. tira su MinIO e fai il bucket `savedimages`;
2. controlla che il `.env` sia a posto;
3. dai un `npm install`;
4. accendi con `npm start` (o `npm run dev`);
5. vai su `http://localhost:3003`;
6. seleziona la roba da caricare, scegli le dimensioni e via;
7. controlla sulla console di MinIO se ha caricato giusto.

Il risultato principale è una serie di oggetti con questa convenzione:

```text
thumbs/NomeOriginale-Dimensione.ext
```

L'originale viene salvato alla radice del bucket solo quando è stata selezionata la relativa opzione.

---

## 17. Integrazione API ed Esempi

Ho predisposto un po' di endpoint per permettere ad altre app di chiamare il server. Le ho testate per bene, l'upload e il resize vanno senza problemi.

### 17.1 Generazione API Key

Per fare una chiave, chiama questa:

```text
POST /api/auth/api-key
```

**Occhio:** Devi essere loggato come admin. Passa il token nell'header (`Authorization: Bearer <token>`). Il token lo prendi facendo login su `POST /api/auth/login`. Nel body mettici il `name` della chiave e magari il `bucket` a cui può accedere (se salti il bucket, la chiave scrive ovunque).

La risposta (se va bene) ti fa vedere la chiave in chiaro **solo stavolta**:

```json
{
  "apiKey": "imgf_3082ab365d1bff27dfe3b01c52d4db79eb164705ef8371299e9f92f9da504b38",
  "uploadEndpoint": "/api/files/upload-api"
}
```

Lato server mi salvo solo l'hash SHA-256 nel DB MySQL, quindi non perdertela.

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
  form.append('path', 'mie_foto/originali');
  form.append('resizedPath', 'mie_foto/ridimensionate');
  form.append('bucket', 'il_mio_bucket');

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
        "sizes": ["200x200", "800x600"],
        "path": "mie_foto/originali",
        "resizedPath": "mie_foto/ridimensionate",
        "bucket": "il_mio_bucket"
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
    'sizes[1]' => '800x600',
    'path' => 'mie_foto/originali',
    'resizedPath' => 'mie_foto/ridimensionate',
    'bucket' => 'il_mio_bucket'
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

## 18. Sicurezza delle API key e Considerazioni final

Alla fine ho spostato gli hash delle API Key sulla tabella `token` in MySQL. Il file JSON locale che usavo prima era una roba troppo limitata. Adesso regge pure se lo faccio girare su più istanze e posso gestire meglio bucket e nomi. 
Mi raccomando: la chiave non va MAI messa nel frontend in chiaro (tipo in una web app React). Tienila sempre lato backend, sennò chiunque te la becca e ti riempie il bucket. Inoltre l'endpoint per generare le chiavi (`POST /api/auth/api-key`) l'ho chiuso per evitare che gente a caso si crei chiavi all'infinito.
