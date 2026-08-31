const StorageService = require('../services/StorageService');
const FileDbService = require('../services/FileDbService');
const SecurityService = require('../services/SecurityService');

class AccessController {
  
  static async generateSignedUrl(req, res) {
    try {
      const { uuid } = req.params;
      const file = await FileDbService.getFile(uuid);
      
      if (!file) {
        return res.status(404).json({ error: 'File non trovato' });
      }
      
      // Controllo che il richiedente sia il proprietario (tramite API Key hash inserito nel middleware apiKey)
      if (req.apiKeyHash !== file.owner_api_key) {
        return res.status(403).json({ error: 'Non hai i permessi per generare URL per questo file' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      let url;

      if (file.is_public) {
        // File pubblico, url libero senza firma
        url = `${baseUrl}/api/files/read/${uuid}`;
      } else {
        // File privato, url con firma
        const signature = SecurityService.generateSignature(uuid);
        url = `${baseUrl}/api/files/private-signed/${uuid}?signature=${signature}`;
      }
      
      res.json({ url });
    } catch (error) {
      res.status(500).json({ error: 'Errore interno' });
    }
  }

  static async readPublicFile(req, res) {
    const { uuid } = req.params;
    const { signature } = req.query;
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

      /*
      if (!SecurityService.verifySignature(uuid, signature)) {
        await FileDbService.logAccess({ uuid, ipAddress, status: 'FORBIDDEN_INVALID_SIG' });
        return res.status(403).json({ error: 'Accesso non autorizzato al file.' });
      }
      */

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
    const { signature } = req.query; // Prende la firma dalla query string
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    try {
      const file = await FileDbService.getFile(uuid);
      if (!file) return res.status(404).json({ error: 'File non trovato' });
      // Controlla che la firma sia valida
      if (!SecurityService.verifySignature(uuid, signature)) {
        return res.status(403).json({ error: 'Firma non valida o scaduta.' });
      }
      const object = await StorageService.getFile(file.bucket, file.file_key);
      res.set('Content-Type', object.ContentType || 'application/octet-stream');
      object.Body.pipe(res);
    } catch (error) {
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

      // Controllo permesso: Stessa API Key usata per l'upload
      if (req.apiKeyHash !== file.owner_api_key) {
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
}

module.exports = AccessController;
