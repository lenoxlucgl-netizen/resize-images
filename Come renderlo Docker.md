# Setup con Docker

Ho preparato il progetto per girare in un container Docker, così ci togliamo dai piedi i soliti problemi di compatibilità e le dipendenze con Node.js e l'app funziona ovunque allo stesso modo.

## Prerequisiti

Serve solo aver installato [Docker](https://docs.docker.com/get-docker/) sulla macchina.

## 1. Build dell'immagine

Per prima cosa dobbiamo buildare l'immagine partendo dal `Dockerfile`. Dalla root del progetto lancia:

```bash
docker build -t resize-images-platform .
```

- `-t resize-images-platform`: diamo questo tag (nome) all'immagine, così la ritroviamo facilmente.
- `.`: prende il contesto dalla cartella corrente.

## 2. Avvio del container

Occhio a una cosa: siccome il container è isolato, se l'app cerca di puntare a `localhost` o `127.0.0.1` (tipo per connettersi a MinIO o MySQL sull'host), cercherà dentro al container stesso e crasherà.

Per risolvere, ho già creato il file `.env.docker` dove al posto di `localhost` c'è `host.docker.internal`. Questo è un indirizzo speciale di Docker Desktop che permette al container di vedere l'host di Windows.

Per tirare su il container:

```bash
docker run -p 3003:3003 --env-file .env.docker -d resize-images-platform
```

I parametri al volo:
- `-p 3003:3003`: mappa la porta 3003 dell'host con la 3003 del container.
- `--env-file .env.docker`: gli passiamo le variabili d'ambiente col fix per l'host.
- `-d`: lo facciamo girare in background (detached).
- `resize-images-platform`: l'immagine che abbiamo appena buildato.

## 3. Check che tutto vada

Per vedere i container attivi:
```bash
docker ps
```

Per testare se il server è su, apri `http://localhost:3003` dal browser oppure fai una curl sulla rotta di health:
```bash
curl http://localhost:3003/health
```

## 4. Log

Se ti serve debuggare o vedere i `console.log`:
```bash
docker logs <CONTAINER_ID>
```
Trovi l'ID facendo `docker ps`. Se vuoi seguire i log in tempo reale (stile tail), aggiungi `-f`:
```bash
docker logs -f <CONTAINER_ID>
```

## 5. Stop del container

Per fermarlo:
```bash
docker stop <CONTAINER_ID>
```
Se poi vuoi proprio piallarlo via, dai un `docker rm <CONTAINER_ID>`.
