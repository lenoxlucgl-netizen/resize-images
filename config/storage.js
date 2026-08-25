const { S3Client } = require('@aws-sdk/client-s3');

class StorageConfig {
  static getClient() {
    const type = process.env.STORAGE_TYPE || 'minio';
    
    const config = {
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER,
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
      },
    };

    if (type === 'minio') {
      config.endpoint = process.env.MINIO_ENDPOINT;
      config.forcePathStyle = true;
    } else if (type === 'rustfs') {
      config.endpoint = process.env.RUSTFS_ENDPOINT;
    }

    return new S3Client(config);
  }
}

module.exports = StorageConfig;