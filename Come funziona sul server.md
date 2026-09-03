# Come funziona sul server (Produzione)

Questo documento spiega l'architettura utilizzata per mettere online la piattaforma `resize-images` su un server di produzione (come Oracle Cloud) dietro la protezione di Cloudflare.

## Architettura di Rete e Cloudflare

Il sistema utilizza un **Reverse Proxy (Nginx)** che si mette davanti all'applicazione Node.js. Invece di esporre direttamente l'app su Internet, Nginx gestisce le richieste in entrata e le smista internamente.

### Perché Nginx e l'SSL "Falso" (Self-Signed)?
Il dominio `cdn1.bookizon.it` è gestito da **Cloudflare**. Cloudflare blocca la stragrande maggioranza delle porte non standard, ed è per questo che in produzione esponiamo l'app sulle porte Web standard: **80 (HTTP)** e **443 (HTTPS)**.

Quando Cloudflare è configurato in modalità **SSL "Full" (Completo)**, si aspetta di comunicare con il server originale tramite una connessione sicura (porta 443).
Poiché il server non ha un proprio certificato SSL ufficiale (quello visibile agli utenti viene fornito da Cloudflare), abbiamo istruito Nginx (tramite il file `docker-compose.yml`) a **generare un certificato SSL "auto-firmato" (Self-Signed)** ad ogni avvio. 

In questo modo:
1. L'utente si connette in modo sicuro a Cloudflare.
2. Cloudflare vede che il server supporta l'HTTPS sulla porta 443 (grazie al nostro certificato auto-firmato).
3. Cloudflare accetta il certificato, chiude il "ponte" sicuro e inoltra la richiesta al nostro server.
4. Nginx riceve la richiesta e la passa internamente all'applicazione Node.js sulla porta `3003`.

## Porte da Aprire (Firewall)

Affinché l'infrastruttura funzioni su un server cloud protetto (come Oracle Cloud), è necessario aprire delle porte specifiche su due livelli: **nel pannello Cloud** e **nel firewall di Ubuntu (iptables)**.

Le porte pubbliche necessarie sono:
- **80 (HTTP)**: Ingresso base di Nginx.
- **443 (HTTPS)**: Ingresso sicuro di Nginx (quello usato da Cloudflare).
- **9001 (MinIO Console)**: Necessaria per accedere al pannello di amministrazione dei bucket.

*Le porte di backend come la 3306 (MySQL) e la 6379 (Redis) rimangono chiuse al pubblico per ragioni di sicurezza.*

### Comandi per sbloccare le porte su Ubuntu (iptables)
Per assicurarti che il firewall interno del server (iptables) faccia passare il traffico e che le regole scavalchino eventuali blocchi predefiniti (inserendole alla riga 1), esegui:

```bash
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 9001 -j ACCEPT
sudo netfilter-persistent save
```

## Comandi per Aggiornare il Server

Quando fai una modifica al codice sul tuo computer e la invii a GitHub, devi aggiornare il server. Ecco la sequenza esatta dei comandi da lanciare nella cartella del progetto (`~/resize-images`):

**1. Scaricare il codice aggiornato:**
```bash
git pull
```

**2. Spegnere i container in esecuzione:**
```bash
sudo docker-compose down
```
*(Questo spegne e rimuove i container attuali, ma i tuoi file e dati rimangono salvi grazie ai "volumes" di Docker).*

**3. Ricostruire e avviare i container:**
```bash
sudo docker-compose up -d --build
```
*(L'aggiunta di `--build` forza Docker a ricreare l'immagine dell'app Node.js per includere le modifiche al codice scaricate al passaggio 1. `-d` fa avviare il processo in background, permettendoti di continuare a usare il terminale).*
