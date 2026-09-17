const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.MAILTRAP_PORT || 2525,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
    }
});

/**
 * 
 * @param {string} toEmail 
 * @param {string} rawToken
 */

const sendResetPasswordEmail = async (toEmail, rawToken) => {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/password-reset/${rawToken}`;

    const mailOptions = {
        from: '"USOF Support" <noreply@usof.com>',
        to: toEmail,
        subject: 'Password Reset Request',
        html: `
            <h2>Запит на скидання пароля</h2>
            <p>Ви запросили скидання пароля. Для встановлення нового пароля перейдіть за посиланням нижче:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>Посилання дійсне протягом 1 години.</p>
            <p>Якщо ви не робили цього запиту, просто ігноруйте цей лист.</p>
        `
    };
    await transporter.sendMail(mailOptions);
};

const sendConfirmationEmail = async (toEmail, rawToken) => {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/confirm-email/${rawToken}`;

    const mailOptions = {
        from: '"USOF Support" <noreply@usof.com>',
        to: toEmail,
        subject: 'Email confirmation',
        html: `
            <h2>Confirm your email</h2>
            <p>Dear friend,</p>
            <p>We are very happy to welcome you to our Usof community. To verify your email address, please click the link below.</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>Best regards, the Usof team</p>
        `
    };
    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendResetPasswordEmail, 
    sendConfirmationEmail
};