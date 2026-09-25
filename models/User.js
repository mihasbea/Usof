const { pool } = require('../db/db');

// Fields anyone may see. The email is left out on purpose.
const PUBLIC_FIELDS = 'id, login, full_name, profile_picture, rating, role, created_at';
// Fields for the server's own use. The password and tokens are left out.
const PROFILE_FIELDS = `${PUBLIC_FIELDS}, email, updated_at`;

class User {
    static async create(userData) {
        const {
            login,
            password,
            full_name,
            email,
            role = 'user',
            email_confirmed = false,
            email_confirm_token = null,
        } = userData;

        const sql = `
            INSERT INTO users (login, password, full_name, email, role, email_confirmed, email_confirm_token)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(sql, [
            login,
            password,
            full_name,
            email,
            role,
            email_confirmed,
            email_confirm_token,
        ]);
        return result.insertId;
    }

    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.query(sql, [email]);
        return rows[0];
    }

    static async findByLogin(login) {
        const sql = 'SELECT * FROM users WHERE login = ?';
        const [rows] = await pool.query(sql, [login]);
        return rows[0];
    }

    static async findByLoginOrEmail(login, email) {
        const sql = 'SELECT id FROM users WHERE login = ? OR email = ?';
        const [rows] = await pool.query(sql, [login, email]);
        return rows[0];
    }

    static async findAllPublic() {
        const sql = `SELECT ${PUBLIC_FIELDS} FROM users`;
        const [rows] = await pool.query(sql);
        return rows;
    }

    static async findPublicById(id) {
        const sql = `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`;
        const [rows] = await pool.query(sql, [id]);
        return rows[0];
    }

    static async findById(id) {
        const sql = `SELECT ${PROFILE_FIELDS} FROM users WHERE id = ?`;
        const [rows] = await pool.query(sql, [id]);
        return rows[0];
    }

    static async savePasswordResetToken(userId, tokenHash, expiresAt) {
        const sql = `
            UPDATE users
            SET password_reset_token = ?, password_reset_expires = ?
            WHERE id = ?
        `;
        const [result] = await pool.query(sql, [tokenHash, expiresAt, userId]);
        return result.affectedRows > 0;
    }

    static async findByValidResetToken(tokenHash) {
        const sql = `
            SELECT id FROM users
            WHERE password_reset_token = ? AND password_reset_expires > NOW()
        `;
        const [rows] = await pool.query(sql, [tokenHash]);
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

    static async findByConfirmToken(tokenHash) {
        const sql = 'SELECT id FROM users WHERE email_confirm_token = ?';
        const [rows] = await pool.query(sql, [tokenHash]);
        return rows[0];
    }

    static async confirmEmail(userId) {
        const sql = `
            UPDATE users
            SET email_confirmed = TRUE, email_confirm_token = NULL
            WHERE id = ?
        `;
        const [result] = await pool.query(sql, [userId]);
        return result.affectedRows > 0;
    }

    /**
     * Updates the given columns of a user.
     * @param {number} id
     * @param {object} updateData - column names mapped to new values; the caller must whitelist the keys
     */
    static async update(id, updateData) {
        const columns = Object.keys(updateData);
        if (columns.length === 0) {
            return false;
        }

        const setClause = columns.map((column) => `${pool.escapeId(column)} = ?`).join(', ');
        const sql = `UPDATE users SET ${setClause} WHERE id = ?`;
        const [result] = await pool.query(sql, [...Object.values(updateData), id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const sql = 'DELETE FROM users WHERE id = ?';
        const [result] = await pool.query(sql, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;
