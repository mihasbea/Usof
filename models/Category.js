const { pool } = require('../db/db');

class Category {
    static async findExistingIds(ids) {
        const sql = 'SELECT id FROM categories WHERE id IN (?)';
        const [rows] = await pool.query(sql, [ids]);
        return rows.map((row) => row.id);
    }
}

module.exports = Category;
