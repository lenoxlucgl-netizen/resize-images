# Setup con Docker Compose

Ho preparato il progetto per far girare tutto in container Docker, così ci togliamo dai piedi i soliti problemi di compatibilità e le dipendenze con Node.js. L'app funziona ovunque allo stesso modo.

## Come funziona:

Invece di avere un singolo container gigante che fa tutto (il che è considerato sbagliatissimo su Docker), ho usato **Docker Compose** per orchestrare più servizi separati. 

Nel file `docker-compose.yml` ho definito questa struttura:
1. **Container MySQL**: Usa l'immagine ufficiale di MySQL. Al primissimo avvio, legge il file `init.sql` per creare il database e l'admin. I dati fisici vengono salvati nella cartella `mysql_data` che vedrai comparire fisicamente nel progetto.
2. **phpMyAdmin**: Ti permette di navigare e smanettare comodamente col database MySQL direttamente dal browser.
3. **Container MinIO**: È il nostro server per salvare le immagini (il sostituto di S3). Salva i dati direttamente nella cartella `minio_data` nel progetto.
4. **Container MinIO-Init**: È un container "usa e getta". Si accende solo per qualche secondo, aspetta che MinIO sia pronto, crea in automatico il bucket `savedimages` e gli dà i permessi pubblici, dopodiché si spegne da solo.
5. **Container Redis**: Acceso e pronto all'uso, per ora non lo stiamo usando attivamente nel flusso base Node, ma ce l'abbiamo pronto per eventuali worker o code di eventi future (così evitiamo di doverlo creare a mano dopo).
6. **Container App (Node.js)**: Costruisce la nostra applicazione, prende tutte le variabili dal file `.env.docker` e si collega agli altri container in modo sicuro tramite la rete interna di Docker.

---

## Prerequisiti

Serve solo aver installato [Docker](https://docs.docker.com/get-docker/) (Docker Desktop su Windows) sulla macchina.

## 1. Avvio di tutto l'ambiente

Il modo più veloce per accendere tutto è realizzare un file `avvia_tutto.bat` che si trova nella cartella del progetto (facendo doppio click).

In alternativa, da terminale, lancia:
```bash
docker compose up -d --build
```

Tutti i servizi saranno già correttamente configurati per parlarsi tra di loro!

**Accessi rapidi:**
- **App Node.js**: `http://localhost:3003` 
- **MinIO Console**: `http://localhost:9001` (user: `minioadmin`, pass: `minioadmin`)
- **phpMyAdmin**: `http://localhost:8080` (entra direttamente senza login)

## 2. Check che tutto vada

Per vedere i container attivi:
```bash
docker compose ps
```

Per testare se il server è funzionante, apri `http://localhost:3003` dal browser oppure fai una curl sulla rotta di health:
```bash
curl http://localhost:3003/health
```

## 3. Log

Se ti serve debuggare o vedere i log dell'applicazione web:
```bash
docker compose logs -f app
```

Se vuoi vedere i log di tutto mischiato (Node, MySQL, MinIO, Redis, ecc.):
```bash
docker compose logs -f
```

## 4. Stop e pulizia

Per fermare l'ambiente temporaneamente senza perdere niente:
```bash
docker compose stop
```

Se poi vuoi fermarlo e rimuovere i container (tranquillo, i dati di MySQL e MinIO verranno conservati nelle cartelle fisiche `mysql_data` e `minio_data`, così non perdi nulla al riavvio!):
```bash
docker compose down
```

Se vuoi piallare via tutto definitivamente, ti basterà cancellare a mano le cartelle `mysql_data` e `minio_data` e dare un:
```bash
docker compose down -v
```
## 5. Altra Modalità

Utilizzare l'app desktop dopo aver generato i Containers premendo il pulsante opportuno per avviare e chiudere.
