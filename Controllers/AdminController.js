const EventLog = require('../Models/EventLog');
const File = require('../Models/File');

class AdminController {
  static async getStats(req, res) {
    try {
      const totalFiles = await File.count();
      const recentEvents = await EventLog.findAll({ 
        limit: 50, 
        order: [['created_at', 'DESC']] 
      });
      res.json({ totalFiles, recentEvents });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AdminController;