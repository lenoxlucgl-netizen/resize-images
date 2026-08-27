# Come eseguire il progetto con Docker

Questo progetto è predisposto per essere eseguito all'interno di un container Docker. Questo garantisce che l'applicazione funzioni nello stesso modo indipendentemente dall'ambiente in cui viene eseguita, isolando le dipendenze (come Node.js) ed evitando problemi di compatibilità.

## Prerequisiti

Assicurati di aver installato:
- [Docker](https://docs.docker.com/get-docker/) sul tuo sistema.

## 1. Costruire l'immagine Docker

Prima di poter avviare il container, devi costruire l'immagine Docker dell'applicazione basata sul `Dockerfile` fornito.
Apri il terminale nella directory radice del progetto e lancia il seguente comando:

```bash
docker build -t resize-images-platform .
```

- `-t resize-images-platform`: Assegna un nome (tag) all'immagine che stiamo creando. In questo caso la chiamiamo `resize-images-platform`.
- `.`: Indica a Docker che il `Dockerfile` e il contesto della build si trovano nella directory corrente.

## 2. Avviare il container

Poiché il container Docker è isolato dal tuo computer, se l'applicazione cerca di collegarsi a `localhost` o `127.0.0.1` (ad esempio per MinIO o MySQL), cercherà questi servizi *all'interno del container stesso*, e fallirà.

Per risolvere questo problema, è stato preparato un file `.env.docker` in cui gli indirizzi `localhost` e `127.0.0.1` sono stati sostituiti con `host.docker.internal`, che è un indirizzo speciale fornito da Docker Desktop per permettere al container di comunicare con il tuo sistema host Windows.

Una volta creata l'immagine, puoi avviare il container con il seguente comando:

```bash
docker run -p 3003:3003 --env-file .env.docker -d resize-images-platform
```

### Spiegazione dei parametri:
- `-p 3003:3003`: Mappa la porta 3003 del tuo computer alla porta 3003 all'interno del container. Il primo numero è la porta host (quella da cui accederai all'app), il secondo è la porta del container (dove gira l'app internamente).
- `--env-file .env.docker`: Indica a Docker di leggere le variabili d'ambiente dal file `.env.docker` che contiene l'host corretto (`host.docker.internal`) per i servizi esterni.
- `-d`: Avvia il container in modalità "detached", ovvero in background. Il terminale rimarrà libero.
- `resize-images-platform`: È il nome dell'immagine che abbiamo costruito nel passaggio precedente.

## 3. Verificare che l'applicazione sia in esecuzione

Puoi visualizzare l'elenco dei container attualmente in esecuzione con il comando:
```bash
docker ps
```

Per testare se il server risponde correttamente, puoi usare il browser all'indirizzo `http://localhost:3003` oppure chiamare la rotta di health da terminale:
```bash
curl http://localhost:3003/health
```

## 4. Visualizzare i log del container

Se hai bisogno di vedere i log dell'applicazione (utile per il debugging o per vedere le stampe di `console.log`), usa il comando:
```bash
docker logs <ID_DEL_CONTAINER>
```
Sostituisci `<ID_DEL_CONTAINER>` con l'ID reale del container ottenuto eseguendo `docker ps` (basta indicare i primi caratteri dell'ID o il nome generato automaticamente).
Per seguire i log in tempo reale aggiungi `-f` (follow):
```bash
docker logs -f <ID_DEL_CONTAINER>
```

## 5. Fermare il container

Per fermare l'esecuzione del container:
```bash
docker stop <ID_DEL_CONTAINER>
```
Questo comando invia un segnale di arresto al container. Per rimuovere completamente il container dopo averlo fermato, puoi usare `docker rm <ID_DEL_CONTAINER>`.
