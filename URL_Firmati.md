# Guida agli URL Firmati (Signed URLs)

Gli URL firmati sono un meccanismo di sicurezza fondamentale per proteggere l'accesso ai file (come immagini private o documenti sensibili). 
Invece di rendere un file pubblico a chiunque conosca il link, l'URL firmato richiede un "pass crittografico" (la *signature*) e una "data di scadenza" (*expires*).

## Come Funziona la Logica

1. **Il client** richiede un link temporaneo per accedere a un file.
2. **Il server** prende il percorso del file e unisce l'URL (o l'UUID) a un timestamp di scadenza (es. `expires=1790000000`).
3. **Il server** genera una firma crittografica sicura in formato HMAC_SHA256 usando una `SECRET_KEY` (configurata nel `.env` come `URL_SIGN_SECRET`).
4. **Il server** restituisce al client il link finale completo, che somiglierà a questo:
   `http://.../private-signed/008334b8-c021-44c0-8081-088aeb072ce0?expires=1790000000&signature=fc9d18...`
5. Quando qualcuno prova ad aprire quel link nel browser, il server esegue tre controlli:
   - Verifica che l'URL non sia scaduto.
   - Ricalcola la firma usando la stessa `SECRET_KEY` invisibile all'utente.
   - Confronta la firma calcolata con quella passata nel link. Se coincidono, fornisce il file. Altrimenti (se la firma non coincide o il link è scaduto), restituisce un errore `403 Forbidden`.

---

## 1. Come firmare un URL "Esterno" (Firma Generica)

Questa rotta è utile se vuoi firmare un URL arbitrario slegato dal database (es. un link su un server S3, Cloudflare, Bookizon Storage, ecc.).

**Endpoint:** `GET` o `POST` `/api/files/signature`

### Esempio di Comando (PowerShell)
Se vuoi firmare un file ospitato su un tuo dominio di storage. Apri PowerShell e lancia:

```powershell
curl.exe -X POST "http://localhost:3003/api/files/signature?url=https://storage.miosito.it/files/documento.pdf&expiresIn=3600" `
  -H "x-api-key: imgf_INSERISCI_LA_TUA_CHIAVE"
```

**Risposta del Server:**
```json
{
  "url": "https://storage.miosito.it/files/documento.pdf",
  "expires": 1788275000,
  "signature": "9d2e8a7c...",
  "signedUrl": "https://storage.miosito.it/files/documento.pdf?expires=1788275000&signature=9d2e8a7c..."
}
```
Basta prendere `signedUrl` e usarlo nel tuo frontend o app.

---

## 2. Come ricalcolare la Firma di un File "Interno" (Tramite UUID)

Se il tuo utente carica un file tramite la piattaforma di Image Resize (che gestisce internamente MinIO e MySQL), ricevi un UUID privato. 
Quando questo link scade, o hai bisogno del link completo pronto all'uso partendo da un link base, usi questa rotta.

**Endpoint:** `GET` o `POST` `/api/files/get-signature`

### Esempio di Comando (PowerShell)
Se hai un URL base privato generato dal server (che include l'UUID) e vuoi farti generare la firma corretta e il `signedUrl` finale (per esempio, valido per 2 ore = 7200 secondi):

```powershell
curl.exe -X POST "http://localhost:3003/api/files/get-signature?url=http://localhost:3003/api/files/private-signed/008334b8-c021-44c0-8081-088aeb072ce0&expiresIn=7200" `
  -H "x-api-key: imgf_INSERISCI_LA_TUA_CHIAVE"
```
*(Nota: usa sempre l'API Key del progetto con cui hai caricato il file)*

**Risposta del Server:**
```json
{
  "signature": "fc9d189952d1fff69929189833eae23da73dcae12a4e44cd80b983d6fac2a485",
  "uuid": "008334b8-c021-44c0-8081-088aeb072ce0",
  "expires": 1788279788,
  "signedUrl": "http://localhost:3003/api/files/private-signed/008334b8-c021-44c0-8081-088aeb072ce0?expires=1788279788&signature=fc9d189952d1fff69929189833eae23da73dcae12a4e44cd80b983d6fac2a485"
}
```

---

## Note Finali e Sicurezza
* **Docker:** Se modifichi la logica di questi file in locale (`AccessController.js`, `SecurityService.js`), ricorda sempre di riavviare Docker ricostruendo l'immagine con `docker-compose up -d --build app`. Altrimenti il contenitore continuerà a usare la versione precedente del codice.
* **Troubleshooting "Errore Interno":** Se navighi sul `signedUrl` che hai appena generato, la firma è corretta. Se il browser ti dà un `"error": "Errore interno"` (status 500) invece di `"Firma non valida o scaduta"` (status 403), significa che **il sistema di sicurezza ha validato l'accesso con successo**, ma il file fisico su MinIO non esiste (es. è stato cancellato dal database o dal bucket).
* **Gestione degli '&' (E Commerciale) su Windows:** Se provi a incollare il `signedUrl` in una riga di comando o in PowerShell, potresti ricevere un errore di sintassi a causa del carattere `&`. Questo vale solo per la riga di comando! Nel codice HTML, JavaScript, e nel browser l'URL funzionerà normalmente. (In PowerShell ti basta racchiudere l'intero link con le virgolette `"`).
