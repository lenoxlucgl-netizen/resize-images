const Redis = require('ioredis');
const EventLog = require('../Models/EventLog');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

class EventService {
  static async emit(eventName, payload) {
    // Pubblica su Redis per i worker
    await redis.publish('image_events', JSON.stringify({
      event: eventName,
      timestamp: new Date().toISOString(),
      payload
    }));

    // Salva log su DB
    await EventLog.create({ event_name: eventName, payload });
  }

  static subscribe(callback) {
    const subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
    
    subscriber.subscribe('image_events');
    subscriber.on('message', (channel, message) => {
      callback(JSON.parse(message));
    });
  }
}

module.exports = EventService;