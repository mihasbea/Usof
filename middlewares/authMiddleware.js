const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const BlacklistedToken = require('../models/BlacklistedToken');

const AuthMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token is missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async(err, decodedUser) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid access token' });
        }

        try {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const isBlacklisted = await BlacklistedToken.isBlacklisted(tokenHash);

            if (isBlacklisted) {
                return res.status(403).json({ message: 'Token has been revoked' });
            }

            req.user = decodedUser;
            req.token = token;
            next();
        } catch (error) {
            console.error('Error checking blacklisted token:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });
};

module.exports = AuthMiddleware;