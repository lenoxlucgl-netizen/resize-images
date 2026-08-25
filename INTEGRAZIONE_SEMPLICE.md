# Come integrare Image Forge nel tuo progetto

Image Forge è un sistema indipendente progettato per ricevere immagini o video, elaborarli (ad esempio ridimensionare le immagini) e salvarli su uno storage (come MinIO).

Per usarlo all'interno di un tuo progetto esistente, ecco i passi semplici da seguire:

## 1. Genera una API Key
Per prima cosa, devi autorizzare il tuo progetto a caricare file su Image Forge.
1. Accedi al pannello di amministrazione di Image Forge (`http://localhost:3003`).
2. Fai il login come amministratore.
3. Nella sezione **API integrabile**, inserisci un nome (es. "Il mio sito principale") e seleziona il bucket MinIO dove vuoi che i file vengano salvati.
4. Clicca su "Genera API key".
5. **Copia subito la chiave** e salvala al sicuro nel tuo progetto (es. nel file `.env` del tuo sito). Non sarà più visibile in seguito!

## 2. Invia i file dal tuo progetto

Dal tuo progetto (che sia scritto in PHP, Node.js, Python, o altro), dovrai fare una richiesta HTTP in formato `multipart/form-data` verso Image Forge.

Ecco le cose fondamentali da includere nella richiesta:
- **L'URL di destinazione**: `http://localhost:3003/api/files/upload-api` (sostituisci `localhost:3003` con l'indirizzo vero del server se è online).
- **L'intestazione (Header) Authorization o API Key**: Aggiungi l'header `x-api-key: LA_TUA_CHIAVE_COPIATA` oppure `Authorization: Bearer LA_TUA_CHIAVE_COPIATA`.
- **I campi del form (Body)**:
  - `file`: Il file fisico dell'immagine o video.
  - `sizes`: Le dimensioni che desideri (solo per le immagini). Puoi mandare questo campo più volte per formati multipli (es. `200x200` e `800x600`).
  - `keepOriginal`: Invia `true` se vuoi salvare anche il file originale, altrimenti `false`.

### Esempio pratico in cURL (Terminale)
```bash
curl -X POST http://localhost:3003/api/files/upload-api \
  -H "x-api-key: LA_TUA_CHIAVE" \
  -F "file=@/percorso/della/tua/foto.jpg" \
  -F "sizes=400x400" \
  -F "sizes=800x800" \
  -F "keepOriginal=true"
```

### Esempio pratico in JavaScript (Fetch)
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('sizes', '400x400');
formData.append('sizes', '800x800');
formData.append('keepOriginal', 'true');

fetch('http://localhost:3003/api/files/upload-api', {
    method: 'POST',
    headers: {
        'x-api-key': 'LA_TUA_CHIAVE'
    },
    body: formData
})
.then(response => response.json())
.then(data => console.log('File caricato:', data));
```

## 3. Leggi la risposta
Se l'upload va a buon fine, Image Forge ti risponderà con un JSON che contiene i nomi dei file salvati sul bucket MinIO. A quel punto, potrai salvare questi nomi nel database del tuo progetto principale, sapendo che i file fisici risiedono sicuri e ottimizzati su Image Forge!
