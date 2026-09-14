const { pool } = require('../db/db');

class User {
    static async create(userData) {
        const { login, password, full_name, email} = userData;

        const sql = `
            INSERT INTO users (login, password, full_name, email)
            VALUES (?, ?, ?, ?)
            `;
        
        const [result] = await pool.query(sql, [login, password, full_name, email]);
        return result.insertId;
    }

    static async findByEmail(email) {
        const sql = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await pool.query(sql, [email]);
        return rows[0];
    }

    static async findByLogin(login) {
        const sql = `SELECT * FROM users WHERE login = ?`;
        const [rows] = await pool.query(sql, [login]);
        return rows[0];
    }

    static async findByLoginOrEmail(login, email) {
        const sql = `SELECT * FROM users WHERE login = ? OR email = ?`;
        const [rows] = await pool.query(sql, [login, email]);
        return rows[0];
    }

    static async savePasswordResetToken(userId, tokenHash, expiresAt) {
        const sql =`
                UPDATE users
                SET password_reset_token = ?, password_reset_expires = ?
                WHERE id = ?
                `;
        const [result] = await pool.query(sql,[tokenHash, expiresAt, userId]);
        return result.affectedRows > 0;
    }

    static async findByValidResetToken(tokenHash) {
        const sql = `
        SELECT * FROM users 
        WHERE password_reset_token = ? 
        AND password_reset_expires > NOW()
        `;
        const [rows] = await pool.query(sql,[tokenHash]);
        return rows[0];
    }

    static async updatePassAndClearResetToken(userId, hashedNewPass) {
        const sql = `
        UPDATE users 
        SET password = ?, password_reset_token = NULL, password_reset_expires = NULL
        WHERE id = ?
        `;
        const [result] = await pool.query(sql, [hashedNewPass, userId]);
        return result.affectedRows > 0;
    }
}

module.exports = User;