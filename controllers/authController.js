const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const BlacklistedToken = require('../models/BlacklistedToken');

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

            const token = jwt.sign({ id: user.id, login: user.login }, process.env.JWT_SECRET, { expiresIn: '3h' });

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
}

module.exports = AuthController;