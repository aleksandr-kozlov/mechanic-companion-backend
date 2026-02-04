export const FILE_UPLOAD_CONFIG = {
  maxFileSize: {
    image: 10 * 1024 * 1024, // 10MB
    document: 20 * 1024 * 1024, // 20MB
  },
  allowedMimeTypes: {
    image: ['image/jpeg', 'image/png', 'image/jpg'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  uploadDir: './uploads',
  imageCompression: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 80,
  },
};
