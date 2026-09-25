const nodemailer = require('nodemailer');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const SENDER = '"USOF Support" <noreply@usof.com>';

const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.MAILTRAP_PORT || 2525,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
    },
});

/**
 * Sends a link to the frontend page where the user chooses a new password.
 * That page sends the new password to POST /api/auth/password-reset/:confirm_token.
 * @param {string} toEmail
 * @param {string} rawToken - unhashed reset token
 */
async function sendResetPasswordEmail(toEmail, rawToken) {
    const resetUrl = `${CLIENT_URL}/password-reset/${rawToken}`;

    await transporter.sendMail({
        from: SENDER,
        to: toEmail,
        subject: 'Password reset request',
        html: `
            <h2>Password reset request</h2>
            <p>You asked to reset your password. Follow the link below to choose a new one:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>The link is valid for 1 hour.</p>
            <p>If you did not ask for this, just ignore this email.</p>
        `,
    });
}

/**
 * Sends a link that confirms the user's email address.
 * @param {string} toEmail
 * @param {string} rawToken - unhashed confirmation token
 */
async function sendConfirmationEmail(toEmail, rawToken) {
    const confirmUrl = `${APP_URL}/api/auth/confirm-email/${rawToken}`;

    await transporter.sendMail({
        from: SENDER,
        to: toEmail,
        subject: 'Email confirmation',
        html: `
            <h2>Confirm your email</h2>
            <p>Dear friend,</p>
            <p>We are very happy to welcome you to our Usof community. To verify your email address, please click the link below.</p>
            <p><a href="${confirmUrl}">${confirmUrl}</a></p>
            <p>Best regards, the Usof team</p>
        `,
    });
}

module.exports = {
    sendResetPasswordEmail,
    sendConfirmationEmail,
};
