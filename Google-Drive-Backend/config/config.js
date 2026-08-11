require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '1h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.FROM_EMAIL,
  otpExpirationMinutes: 10
};
