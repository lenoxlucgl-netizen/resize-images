const Bucket = require('../Models/Bucket.js');

class BucketController {
  static async createBucket(req, res) {
    try {
      const { name, isPublic } = req.body;
      const bucket = await Bucket.create({ name, owner_id: req.user.id, isPublic });
      res.status(201).json(bucket);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async listBuckets(req, res) {
    try {
      const buckets = await Bucket.findAll({ where: { owner_id: req.user.id } });
      res.json(buckets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = BucketController;