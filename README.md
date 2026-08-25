# Resize Images Platform

S3 Compatible Image Storage with Auto-Resize functionality.

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

L'app salva le immagini nel bucket MinIO `savedimages`. La Console è raggiungibile
da `http://127.0.0.1:62192/browser/savedimages`, mentre l'endpoint API S3 usato
dall'app è `http://127.0.0.1:9000`.

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd resize-images-platform
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Apri `http://localhost:3003`. La pagina consente di caricare JPEG, PNG, WebP,
GIF, AVIF o TIFF, scegliere una o più dimensioni e decidere se mantenere anche
l'originale. Tutti gli oggetti vengono salvati in `savedimages/thumbs/`.

## Environment Variables

See `.env` file for all available configuration options:

- **PORT**: Server port (default: 3000)
- **DB_HOST**, **DB_PORT**, **DB_NAME**, **DB_USER**, **DB_PASSWORD**: PostgreSQL connection
- **STORAGE_TYPE**: Storage provider (`local`, `minio`, `rustfs`, `aws-s3`)
- **MINIO_ENDPOINT**, **MINIO_ROOT_USER**, **MINIO_ROOT_PASSWORD**: MinIO configuration
- **REDIS_HOST**, **REDIS_PORT**: Redis connection
- **JWT_SECRET**, **JWT_REFRESH_SECRET**: Authentication tokens
- **RESIZE_SIZES**: Image resize dimensions
- **KEEP_ORIGINAL**: Whether to keep original images
- **RESIZED_PATH**: Path for resized images

## Project Structure

```
project-root/
├── Controllers/          # Request handlers
├── Models/              # Database models
├── Routes/              # API routes
├── config/              # Configuration files
├── jobs/                # Background workers
├── middlewares/         # Express middlewares
├── services/            # Business logic
├── utils/               # Utility functions
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
└── server.js            # Application entry point
```

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/files` - File storage routes
- `/api/buckets` - Bucket management
- `/api/resize` - Image resize operations
- `/api/admin` - Admin operations

## Development

This project uses:
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Redis** - Event bus and caching
- **MinIO/S3** - Object storage
- **Sharp** - Image processing
- **ioredis** - Redis client
- **Multer** - File upload handling

## Notes

- This application runs directly with Node.js (no Docker required)
- Make sure PostgreSQL, Redis, and MinIO are running locally or update the `.env` file with remote service URLs
- For production, ensure proper security configurations for JWT secrets and database credentials
