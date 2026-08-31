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

      if (!file.is_public) {
        return res.status(400).json({ error: 'Il file non è pubblico, non puoi generare un Signed URL' });
      }

      const signature = SecurityService.generateSignature(uuid);
      const url = `${req.protocol}://${req.get('host')}/api/files/read/${uuid}?signature=${signature}`;
      
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

      if (!SecurityService.verifySignature(uuid, signature)) {
        await FileDbService.logAccess({ uuid, ipAddress, status: 'FORBIDDEN_INVALID_SIG' });
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
