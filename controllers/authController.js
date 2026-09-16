const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const BlacklistedToken = require('../models/BlacklistedToken');
const { sendResetPasswordEmail } = require('../utils/mailer')

class AuthController {
    static async register(req, res) {
        try {
            const {login, password, password_confirmation, full_name, email} = req.body;

            if (!login || !password || !password_confirmation || !full_name || !email) {
                return res.status(400).json({message: 'All fields are required'});
            }

            if (password !== password_confirmation) {
                return res.status(400).json({message: 'Passwords do not match'});
            }

            if (await User.findByEmail(email) || await User.findByLogin(login)) {
                return res.status(409).json({message: 'Email or login already in use'});
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUserData = {
                login: login,
                password: hashedPassword,
                full_name: full_name,
                email: email
            };
            await User.create(newUserData);
            return res.status(201).json({message: 'User created successfully'});

        } catch (error) {
            console.error('Error during registration:', error);
            return res.status(500).json({message: 'Internal server error'});
        }
    }

    static async login(req, res) {
        try {
            const {login, email, password} = req.body;

            if ((!login && !email) || !password) {
                return res.status(400).json({message: 'Missing required fields (login/email and password)'});
            }

            let user = null;
            if (login) {
                user = await User.findByLogin(login);
            }
            if (email) {
                user = await User.findByEmail(email);
            }

            if (!user) {
                return res.status(401).json({message: 'Invalid login or email'});
            }

            if (!user.email_confirmed) {
                return res.status(403).json({message: 'Email not confirmed'});
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({message: 'Invalid password'});
            }

            const token = jwt.sign({ id: user.id, login: user.login, role: user.role }, process.env.JWT_SECRET, { expiresIn: '3h' });

            return res.status(200).json({ message: 'Login successful', token });
        } catch (error) {
            console.error('Error during login:', error);
            return res.status(500).json({message: 'Internal server error'});
        }
    }

    static async logout(req, res) {
        try {
            const token = req.token;
            const expiresAt = new Date(req.user.exp * 1000); //to milliseconds
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            await BlacklistedToken.add(tokenHash, expiresAt);
            return res.status(200).json({ message: 'Logout successful' });
        } catch (error) {
            console.error('Error during logout:', error);
            return res.status(500).json({message: 'Internal server error'});
        }
    }

    static async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({message: 'Email is required'});
            }

            const genericMessage = 'A password reset link has been sent.';

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(200).json({ message: genericMessage });
            }

            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            await User.savePasswordResetToken(user.id, tokenHash, expiresAt);
            await sendResetPasswordEmail(user.email, rawToken);

            return res.status(200).json({ message: genericMessage });
        } catch(error) {
            console.error('Error during password reset request:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async confirmPassReset(req, res) {
        try {
            const { confirm_token } = req.params;
            const { new_password, new_password_confirmation } = req.body;

            if (!new_password || !new_password_confirmation) {
                return res.status(400).json({ message: 'Both pasfford fields are required' })
            }
            if (new_password !== new_password_confirmation) {
                return res.status(400).json({ message:'Passwords do not match' });
            }

            const tokenHash = crypto.createHash('sha256').update(confirm_token).digest('hex');
            const user = await User.findByValidResetToken(tokenHash);

            if (!user) {
                return res.status(400).json({ message: 'Invalid or expired password reset token' });
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);
            await User.updatePassAndClearResetToken(user.id, hashedPassword);

            return res.status(200).json({ message: 'Password has been successfully reset' });
        } catch(error) {
            console.error('Error during password reset confirmation:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = AuthController;