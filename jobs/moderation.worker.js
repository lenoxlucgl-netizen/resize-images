const EventService = require('../services/EventService');
const ModerationService = require('../services/ModerationService');
const File = require('../Models/File');

class ModerationWorker {
  static async start() {
    console.log('Moderation Worker started');
    
    EventService.subscribe(async (eventData) => {
      if (eventData.event === 'image.uploaded') {
        try {
          const fileRecord = await File.findById(eventData.payload.fileId);
          if (!fileRecord) return;

          console.log(`Moderating file: ${fileRecord.original_name}`);
          
          // Scarica immagine per analisi
          const { Body } = await require('../utils/s3Client').send(
            new (require('@aws-sdk/client-s3').GetObjectCommand)({
              Bucket: fileRecord.bucket_id,
              Key: fileRecord.stored_path
            })
          );

          const buffer = await Body.transformToByteArray();
          const result = await ModerationService.moderateImage(
            Buffer.from(buffer), 
            fileRecord.mime_type
          );

          if (!result.safe) {
            await ModerationService.replaceWithPlaceholder(
              fileRecord.bucket_id, 
              fileRecord.stored_path
            );
            
            await EventService.emit('image.blocked', {
              fileId: fileRecord.id,
              reason: result.reason
            });
          } else {
            await EventService.emit('image.approved', {
              fileId: fileRecord.id,
              confidence: result.confidence
            });
          }

        } catch (error) {
          console.error('Moderation failed:', error);
        }
      }
    });
  }
}

module.exports = ModerationWorker;