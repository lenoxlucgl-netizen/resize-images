# Setup con Docker Compose

Ho preparato il progetto per far girare tutto in container Docker, così ci togliamo dai piedi i soliti problemi di compatibilità e le dipendenze con Node.js. L'app funziona ovunque allo stesso modo.

## Come funziona la magia sotto il cofano?

Invece di avere un singolo container gigante che fa tutto (il che è considerato sbagliatissimo su Docker), ho usato **Docker Compose** per orchestrare più servizi separati. 

Nel file `docker-compose.yml` ho definito questa struttura:
1. **Container MySQL**: Usa l'immagine ufficiale di MySQL. Al primissimo avvio, legge il file `init.sql` che ho preparato nella cartella `mysql-init`. Questo script crea il database, le tabelle e inserisce in automatico l'utente admin con la password criptata.
2. **Container MinIO**: È il nostro server per salvare le immagini (il sostituto di S3).
3. **Container MinIO-Init**: È un container "usa e getta". Si accende solo per qualche secondo, aspetta che MinIO sia pronto, crea in automatico il bucket `savedimages` e gli dà i permessi pubblici, dopodiché si spegne da solo. Così non devi configurare la console di MinIO a mano!
4. **Container App (Node.js)**: Costruisce la nostra applicazione a partire dal `Dockerfile`, la collega al database e a MinIO usando una rete privata interna di Docker in modo che comunichino in sicurezza.

---

## Prerequisiti

Serve solo aver installato [Docker](https://docs.docker.com/get-docker/) (Docker Desktop su Windows) sulla macchina.

## 1. Avvio di tutto l'ambiente (Consigliato su Windows)

Il modo più veloce per accendere tutto è realizzare un file `avvia_tutto.bat` che si trova nella cartella del progetto.

In alternativa, da terminale (dalla root del progetto), lancia:
```bash
docker compose up -d --build
```

Tutti i servizi saranno già correttamente configurati per parlarsi tra di loro!

**Credenziali MinIO Console Web (su localhost:9001):**
- Username: `minioadmin`
- Password: `minioadmin`

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

Se vuoi vedere i log di tutto mischiato (Node, MySQL, MinIO):
```bash
docker compose logs -f
```

## 4. Stop e pulizia

Per fermare l'ambiente temporaneamente senza perdere niente:
```bash
docker compose stop
```

Se poi vuoi fermarlo e rimuovere i container (tranquillo, i dati di MySQL e MinIO verranno conservati nei volumi di Docker, così non perdi nulla al riavvio!):
```bash
docker compose down
```

Se vuoi piallare via tutto definitivamente, **inclusi i dati** (database e immagini caricate), aggiungi `-v`:
```bash
docker compose down -v
```
## 5. Altra Modalità

Ultilizzare l'app desktop dopo aver generato il Containers premendo il pulsante opportuno per avviare e chiudere.
