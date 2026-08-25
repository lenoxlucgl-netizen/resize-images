module.exports = {
  sizes: (process.env.RESIZE_SIZES || '200x200,400x400').split(','),
  keepOriginal: process.env.KEEP_ORIGINAL === 'true',
  resizedPath: process.env.RESIZED_PATH || '/thumbs',
  supportedFormats: ['jpeg', 'png', 'webp', 'avif', 'tiff']
};