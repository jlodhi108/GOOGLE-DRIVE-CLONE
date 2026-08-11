const config = require('../config/config');

async function sendEmail({ to, subject, text, html }) {
  // If SendGrid is not configured, log to console and skip sending
  if (!config.sendgridApiKey || !config.fromEmail) {
    console.log(`[EMAIL - NO SENDGRID] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL BODY] ${text}`);
    return;
  }

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.fromEmail },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html }
        ]
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Failed to send email: ${res.status} ${body}`);
    }
  } catch (err) {
    console.error('Email sending error (non-fatal):', err.message);
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
