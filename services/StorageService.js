const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListBucketsCommand, HeadObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs/promises');
const path = require('path');
const StorageConfig = require('../config/storage');
const client = StorageConfig.getClient();
const localRoot = path.join(__dirname, '..', 'saved-images');

class StorageService {
  static async listBuckets() {
    if ((process.env.STORAGE_TYPE || 'local') === 'local') {
      return ['local-images']; // Dummy per ambiente locale
    }
    const data = await client.send(new ListBucketsCommand({}));
    return data.Buckets ? data.Buckets.map(b => b.Name) : [];
  }

  static async listObjects(bucket) {
    if ((process.env.STORAGE_TYPE || 'local') === 'local') {
      const files = [];
      async function scan(dir) {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (let e of entries) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) await scan(p);
            else files.push(p.replace(localRoot + path.sep, '').replace(/\\/g, '/'));
          }
        } catch (err) {}
      }
      await scan(localRoot);
      return files.map(key => ({ Key: key }));
    }
    const data = await client.send(new ListObjectsV2Command({ Bucket: bucket }));
    return data.Contents || [];
  }

  static async fileExists(bucket, key) {
    if ((process.env.STORAGE_TYPE || 'local') === 'local') {
      const filePath = path.join(localRoot, key.replace(/^[/\\]+/, ''));
      try { await fs.access(filePath); return true; } catch (e) { return false; }
    }
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch (e) {
      if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) return false;
      throw e;
    }
  }

  static async uploadFile(bucket, key, buffer, contentType, isPublic = false) {
    if ((process.env.STORAGE_TYPE || 'local') === 'local') {
      const localKey = key.replace(/^[/\\]+/, '');
      const filePath = path.join(localRoot, localKey);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, buffer);
      return { Key: localKey, ContentType: contentType };
    }
    
    const params = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    };
    
    if (isPublic) {
      params.Tagging = 'visibility=public';
    }

    return await client.send(new PutObjectCommand(params));
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