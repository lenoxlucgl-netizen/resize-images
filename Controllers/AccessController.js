const StorageService = require('../services/StorageService');
const FileDbService = require('../services/FileDbService');
const SecurityService = require('../services/SecurityService');
const VideoService = require('../services/VideoService');

class AccessController {
  
  static async generateSignedUrl(req, res) {
    try {
      const { uuid } = req.params;
      const file = await FileDbService.getFile(uuid);
      
      if (!file) {
        return res.status(404).json({ error: 'File non trovato' });
      }
      
      // Controllo che il richiedente sia il proprietario (tramite API Key hash inserito nel middleware apiKey)
      // oppure che abbia un token admin (authorizedBucket === '*')
      if (req.apiKeyHash !== file.owner_api_key && req.authorizedBucket !== '*') {
        return res.status(403).json({ error: 'Non hai i permessi per generare URL per questo file' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      let url;

      if (file.is_public) {
        // File pubblico, url libero senza firma
        url = `${baseUrl}/api/files/read/${uuid}`;
      } else {
        // File privato, url con firma
        const expiresInSeconds = req.query.expiresIn || req.body.expiresIn || 3600;
        const expires = Math.floor(Date.now() / 1000) + parseInt(expiresInSeconds);
        const signature = SecurityService.generateSignature(uuid, expires);
        url = `${baseUrl}/api/files/private-signed/${uuid}?expires=${expires}&signature=${signature}`;
      }
      
      res.json({ url });
    } catch (error) {
      res.status(500).json({ error: 'Errore interno' });
    }
  }

  static async getSignatureFromUrl(req, res) {
    try {
      const url = req.body.url || req.query.url;
      if (!url) return res.status(400).json({ error: 'Manca il parametro url (body o query string)' });

      // Cerca un UUID valido all'interno del link
      const uuidMatch = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      
      if (!uuidMatch) {
        return res.status(400).json({ error: 'Nessun UUID valido trovato nell\'URL fornito' });
      }
      
      const uuid = uuidMatch[0];
      const file = await FileDbService.getFile(uuid);
      
      if (!file) {
        return res.status(404).json({ error: 'File non trovato' });
      }
      
      if (req.apiKeyHash !== file.owner_api_key && req.authorizedBucket !== '*') {
        return res.status(403).json({ error: 'Non hai i permessi per generare la firma per questo file' });
      }

      const expiresInSeconds = req.body.expiresIn || req.query.expiresIn || 3600;
      const expires = Math.floor(Date.now() / 1000) + parseInt(expiresInSeconds);
      const signature = SecurityService.generateSignature(uuid, expires);
      
      // Costruiamo il link completo basato su quello in input
      let baseUrlOnly = url.split('?')[0];
      // Assicuriamoci che l'URL punti all'endpoint corretto per i link firmati
      baseUrlOnly = baseUrlOnly.replace(/\/api\/files\/private\//, '/api/files/private-signed/');
      const signedUrl = `${baseUrlOnly}?expires=${expires}&signature=${signature}`;
      
      res.json({ signature, uuid, expires, signedUrl });
    } catch (error) {
      console.error("Errore in getSignatureFromUrl:", error);
      res.status(500).json({ error: 'Errore interno' });
    }
  }

  static async generateGenericSignature(req, res) {
    try {
      const target = req.body.url || req.query.url || req.body.file || req.query.file;
      
      if (!target) {
        return res.status(400).json({ error: 'Specifica un parametro "url" o "file"' });
      }

      const expiresInSeconds = req.body.expiresIn || req.query.expiresIn || 3600;
      const expires = Math.floor(Date.now() / 1000) + parseInt(expiresInSeconds);
      
      const signature = SecurityService.generateSignature(target, expires);
      
      const separator = target.includes('?') ? '&' : '?';
      let baseUrl = "";
      
      if (req.body.file || req.query.file) {
          baseUrl = process.env.STORAGE_BASE_URL || 'https://storage.bookizon.it/';
      }
      
      const cleanTarget = (req.body.file || req.query.file) ? target.replace(/^\//, '') : target;
      const finalBase = baseUrl ? `${baseUrl}${cleanTarget}` : target;
      
      const signedUrl = `${finalBase}${separator}expires=${expires}&signature=${signature}`;

      res.json({
        url: finalBase,
        expires,
        signature,
        signedUrl
      });
    } catch (error) {
      res.status(500).json({ error: 'Errore interno' });
    }
  }

  static async readPublicFile(req, res) {
    const { uuid } = req.params;
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

    try {
      const file = await FileDbService.getFile(uuid);
      if (!file) {
        await FileDbService.logAccess({ uuid, ipAddress, status: 'NOT_FOUND' });
        return res.status(404).json({ error: 'File non trovato' });
      }

      if (!file.is_public) {
        await FileDbService.logAccess({ uuid, ipAddress, status: 'FORBIDDEN_PRIVATE' });
        return res.status(403).json({ error: 'Accesso non autorizzato al file.' });
      }

      const object = await StorageService.getFile(file.bucket, file.file_key);
      await FileDbService.logAccess({ uuid, ipAddress, status: 'SUCCESS_PUBLIC' });
      
      res.set('Content-Type', object.ContentType || 'application/octet-stream');
      object.Body.pipe(res);
    } catch (error) {
      await FileDbService.logAccess({ uuid, ipAddress, status: 'ERROR' });
      res.status(500).json({ error: 'Errore durante la lettura del file' });
    }
  }

  static async readPrivateSignedFile(req, res) {
    const { uuid } = req.params;
    const { signature, expires } = req.query; // Prende la firma e expires dalla query string
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    try {
      const file = await FileDbService.getFile(uuid);
      if (!file) return res.status(404).json({ error: 'File non trovato' });
      
      // Controlla che il link non sia scaduto
      if (expires && Math.floor(Date.now() / 1000) > parseInt(expires)) {
        return res.status(403).json({ error: 'Link scaduto.' });
      }

      // Controlla che la firma sia valida
      if (!SecurityService.verifySignature(uuid, signature, expires)) {
        return res.status(403).json({ error: 'Firma non valida o scaduta.' });
      }
      const object = await StorageService.getFile(file.bucket, file.file_key);
      res.set('Content-Type', object.ContentType || 'application/octet-stream');
      object.Body.pipe(res);
    } catch (error) {
      console.error("Errore in readPrivateSignedFile:", error);
      res.status(500).json({ error: 'Errore interno' });
    }
  }

  static async readPrivateFile(req, res) {
    const { uuid } = req.params;
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

    try {
      const file = await FileDbService.getFile(uuid);
      if (!file) {
        await FileDbService.logAccess({ uuid, ipAddress, status: 'NOT_FOUND' });
        return res.status(404).json({ error: 'File non trovato' });
      }

      // Controllo permesso: Stessa API Key usata per l'upload oppure token admin
      if (req.apiKeyHash !== file.owner_api_key && req.authorizedBucket !== '*') {
        await FileDbService.logAccess({ uuid, ipAddress, status: 'FORBIDDEN_UNAUTHORIZED' });
        return res.status(403).json({ error: 'Accesso negato. Non sei il proprietario del file.' });
      }

      const object = await StorageService.getFile(file.bucket, file.file_key);
      await FileDbService.logAccess({ uuid, ipAddress, status: 'SUCCESS_PRIVATE' });
      
      res.set('Content-Type', object.ContentType || 'application/octet-stream');
      object.Body.pipe(res);
    } catch (error) {
      await FileDbService.logAccess({ uuid, ipAddress, status: 'ERROR' });
      res.status(500).json({ error: 'Errore durante la lettura del file' });
    }
  }

  static async generateVideoCover(req, res) {
    try {
      const { uuid } = req.params;
      const second = req.query.second ? parseInt(req.query.second) : 1;
      
      const file = await FileDbService.getFile(uuid);
      if (!file) {
        return res.status(404).json({ error: 'File non trovato' });
      }

      // Controllo permessi
      if (req.apiKeyHash !== file.owner_api_key && req.authorizedBucket !== '*' && !file.is_public) {
        return res.status(403).json({ error: 'Accesso negato al file' });
      }

      const coverInfo = await VideoService.extractCoverAndSave(uuid, second);
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      let coverUrl;
      if (coverInfo.isPublic) {
        coverUrl = `${baseUrl}/api/files/read/${coverInfo.coverUuid}`;
      } else {
        coverUrl = `${baseUrl}/api/files/private/${coverInfo.coverUuid}`;
      }

      return res.status(201).json({
        message: 'Copertina video generata e salvata con successo',
        uuid: coverInfo.coverUuid,
        url: coverUrl,
        bucket: coverInfo.bucket,
        isPublic: coverInfo.isPublic
      });
      
    } catch (error) {
      console.error('Errore generazione copertina video:', error);
      res.status(500).json({ error: 'Errore durante la generazione della copertina', details: error.message });
    }
  }
}

module.exports = AccessController;
