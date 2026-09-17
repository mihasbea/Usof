const { pool } = require('../db/db');

class User {
    static async create(userData) {
        const { login, password, full_name, email, role = 'user', email_confirmed = false, email_confirm_token = null } = userData;

        const sql = `
            INSERT INTO users (login, password, full_name, email, role, email_confirmed, email_confirm_token)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
        
        const [result] = await pool.query(sql, [login, password, full_name, email, role, email_confirmed, email_confirm_token]);
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

    static async findAll() {
        const sql = `SELECT id, login, full_name, email, profile_picture, rating, role, created_at, updated_at FROM users`;
        const [rows] = await pool.query(sql);
        return rows;
    }

    static async findById(id) {
        const sql = `SELECT id, login, full_name, email, profile_picture, rating, role, created_at, updated_at FROM users WHERE id = ?`;
        const [rows] = await pool.query(sql, [id]);
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

    static async findByConfirmToken(token) {
        const sql = `
        SELECT * FROM users 
        WHERE email_confirm_token = ? 
        `;
        const [rows] = await pool.query(sql,[token]);
        return rows[0];
    }

    static async confirmEmail(userId) {
        const sql = `
        UPDATE users 
        SET email_confirmed = ?, email_confirm_token = NULL
        WHERE id = ?
        `;
        const [result] = await pool.query(sql, [true, userId]);
        return result.affectedRows > 0;
    }

    static async update(id, updateData) {
        const keys = Object.keys(updateData);
        if(keys.length ===0) return false;

        const setClause = keys.map(key => `${key} = ?`). join(',');
        const values = Object.values(updateData);
        values.push(id);

        const sql = `UPDATE users SET ${setClause} WHERE id = ?`;
        const [result] = await pool.query(sql, values);

        return result.affectedRows > 0;
    }

    static async delete(id) {
        const sql = `DELETE FROM users WHERE id = ?`;
        const [result] = await pool.query(sql, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;