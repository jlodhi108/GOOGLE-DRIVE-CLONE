const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create transporter using SMTP credentials from .env
function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendEmail({ to, subject, text, html }) {
  const transporter = createTransporter();

  // If SMTP not configured, log OTP to console as fallback
  if (!transporter) {
    console.log(`[EMAIL - NO SMTP] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL BODY] ${text}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Drive Clone" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error('Email sending error (non-fatal):', err.message);
    console.log(`[EMAIL FALLBACK] To: ${to} | ${text}`);
  }
}

const emailService = {
  sendOtpEmail: (to, otp) => sendEmail({
    to,
    subject: 'Verify your email - Drive Clone',
    text: `Your verification code is ${otp}. It expires in ${config.otpExpirationMinutes} minutes.`,
    html: `<p>Your verification code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in ${config.otpExpirationMinutes} minutes.</p>`
  }),

  sendPasswordResetEmail: (to, otp) => sendEmail({
    to,
    subject: 'Reset your password - Drive Clone',
    text: `Your password reset code is ${otp}. It expires in ${config.otpExpirationMinutes} minutes.`,
    html: `<p>Your password reset code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in ${config.otpExpirationMinutes} minutes. If you didn't request this, you can ignore this email.</p>`
  })
};

module.exports = emailService;
