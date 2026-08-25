const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs/promises');
const path = require('path');
const StorageConfig = require('../config/storage');
const client = StorageConfig.getClient();
const localRoot = path.join(__dirname, '..', 'saved-images');

class StorageService {
  static async uploadFile(bucket, key, buffer, contentType) {
    if ((process.env.STORAGE_TYPE || 'local') === 'local') {
      const localKey = key.replace(/^[/\\]+/, '');
      const filePath = path.join(localRoot, localKey);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, buffer);
      return { Key: localKey, ContentType: contentType };
    }
    return await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }));
  }

  static async getFile(bucket, key) {
    if ((process.env.STORAGE_TYPE || 'minio') === 'local') {
      const filePath = path.join(localRoot, key.replace(/^[/\\]+/, ''));
      return { Body: require('fs').createReadStream(filePath) };
    }
    return await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));
  }

  static async deleteFile(bucket, key) {
    if ((process.env.STORAGE_TYPE || 'local') === 'local') {
      await fs.rm(path.join(localRoot, key.replace(/^[/\\]+/, '')), { force: true });
      return;
    }
    return await client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    }));
  }
}

module.exports = StorageService;