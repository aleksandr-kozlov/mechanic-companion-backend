export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM,
  },
  files: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE, 10) || 10485760,
    maxDocumentSize: parseInt(process.env.MAX_DOCUMENT_SIZE, 10) || 20971520,
  },
  pdf: {
    tempDir: process.env.PDF_TEMP_DIR || './tmp/pdf',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
    authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT, 10) || 5,
  },
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8081',
});
