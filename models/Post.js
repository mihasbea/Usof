const { pool } = require('../db/db');

class Post {
    /**
     * Creates a post with its categories and attachments in one transaction.
     * @param {object} data
     * @param {number} data.author_id
     * @param {string} data.title
     * @param {string} data.content
     * @param {number[]} data.categoryIds - IDs of existing categories, without duplicates
     * @param {{ path: string, type: string }[]} data.attachments
     * @returns {Promise<number>} the new post's ID
     */
    static async create({ author_id, title, content, categoryIds, attachments }) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                'INSERT INTO posts (author_id, title, content) VALUES (?, ?, ?)',
                [author_id, title, content]
            );
            const postId = result.insertId;

            await connection.query('INSERT INTO post_categories (post_id, category_id) VALUES ?', [
                categoryIds.map((categoryId) => [postId, categoryId]),
            ]);

            if (attachments.length > 0) {
                await connection.query(
                    'INSERT INTO post_attachments (post_id, file_path, file_type) VALUES ?',
                    [attachments.map((attachment) => [postId, attachment.path, attachment.type])]
                );
            }

            await connection.commit();
            return postId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async countActive() {
        const sql = "SELECT COUNT(*) AS total FROM posts WHERE status = 'active'";
        const [rows] = await pool.query(sql);
        return rows[0].total;
    }

    static async getAll(limit, offset) {
        const sql = `
            SELECT
                p.id, p.title, p.content, p.status, p.created_at,
                u.login AS author_login, u.id AS author_id
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.status = 'active'
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [posts] = await pool.query(sql, [limit, offset]);
        return posts;
    }

    static async getById(id) {
        const postQuery = `
            SELECT
                p.id, p.title, p.content, p.status, p.created_at, p.updated_at,
                u.login AS author_login, u.id AS author_id
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.id = ? AND p.status = 'active'
        `;
        const [posts] = await pool.query(postQuery, [id]);

        if (posts.length === 0) {
            return null;
        }

        const categoriesQuery = `
            SELECT c.id, c.title
            FROM categories c
            JOIN post_categories pc ON c.id = pc.category_id
            WHERE pc.post_id = ?
        `;
        const attachmentsQuery = `
            SELECT id, file_path, file_type
            FROM post_attachments
            WHERE post_id = ?
        `;
        const [[categories], [attachments]] = await Promise.all([
            pool.query(categoriesQuery, [id]),
            pool.query(attachmentsQuery, [id]),
        ]);

        return { ...posts[0], categories, attachments };
    }

    // Public paths of every file attached to the author's posts.
    static async findAttachmentPathsByAuthor(authorId) {
        const sql = `
            SELECT pa.file_path
            FROM post_attachments pa
            JOIN posts p ON pa.post_id = p.id
            WHERE p.author_id = ?
        `;
        const [rows] = await pool.query(sql, [authorId]);
        return rows.map((row) => row.file_path);
    }
}

module.exports = Post;
