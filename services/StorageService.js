const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const StorageConfig = require('../config/storage');
const client = StorageConfig.getClient();

class StorageService {
  static async uploadFile(bucket, key, buffer, contentType) {
    return await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }));
  }

  static async getFile(bucket, key) {
    return await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));
  }

  static async deleteFile(bucket, key) {
    return await client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    }));
  }
}

module.exports = StorageService;