const ResizeJob = require('../Models/ResizeJob');

class ResizeController {
  static async getJobs(req, res) {
    try {
      const jobs = await ResizeJob.findAll({ 
        where: { file_id: req.params.fileId },
        order: [['created_at', 'DESC']]
      });
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async triggerManualResize(req, res) {
    // Logica per triggerare resize manuale se necessario
    res.json({ message: 'Manual resize triggered' });
  }
}

module.exports = ResizeController;