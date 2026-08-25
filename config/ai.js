module.exports = {
  provider: process.env.AI_PROVIDER || 'off', // off, gemini, openai, claude, ollama
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || 'gemini-pro-vision',
  moderationLevels: {
    OFF: 0,
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3
  },
  currentLevel: parseInt(process.env.MODERATION_LEVEL || '0'),
  placeholderImage: process.env.PLACEHOLDER_IMAGE || 'placeholders/default.jpg'
};