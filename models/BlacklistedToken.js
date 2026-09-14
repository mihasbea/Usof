const { pool } = require('../db/db');

class BlacklistedToken {
    static async add (tokenHash, expiresAt) {

        if (typeof expiresAt == 'number' && expiresAt < 1e11) {
            expiry = expiresAt * 1000; 
        }

        const expiryDate = new Date(expiry);

        if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
            return null;
        }

        const sql = `INSERT IGNORE INTO blacklisted_tokens (token_hash, expires_at) VALUES (?, ?)`;
        const [result] = await pool.query(sql, [tokenHash, expiryDate]);
        return result.insertId;
    }
    static async isBlacklisted(tokenHash) {
        const sql = `SELECT 1 FROM blacklisted_tokens WHERE token_hash = ? AND expires_at > NOW()`;
        const [rows] = await pool.query(sql, [tokenHash]);
        return rows.length > 0;
    }
}

module.exports = BlacklistedToken;