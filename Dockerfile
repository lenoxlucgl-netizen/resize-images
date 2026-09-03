# Usa un'immagine ufficiale di Node.js (versione 20 per supportare @aws-sdk e altre dipendenze)
FROM node:20-alpine

# Crea e imposta la directory di lavoro all'interno del container
WORKDIR /usr/src/app

# Copia i file package.json e package-lock.json prima del resto del codice
# Questo ottimizza il caching dei layer di Docker per le dipendenze
COPY package*.json ./

# Installa le dipendenze dell'applicazione
RUN npm install --omit=dev

# Copia il codice sorgente dell'applicazione nel container
COPY . .

# Espone la porta su cui l'app sarà in ascolto
EXPOSE 3003

# Comando per avviare l'applicazione
CMD [ "npm", "start" ]
    