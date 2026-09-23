const { pool } = require('../db/db');

class Post {
    static async create(data, dbConnection = pool) {
        const { author_id, title, content } = data;
        const sql = `INSERT INTO posts (author_id, title, content) VALUES (?, ?, ?)`;
        const [result] = await dbConnection.query(sql, [author_id, title, content]);
        return result.insertId;
    }

    static async addCategories(postId, categoryIds, dbConnection = pool) {
        const values = categoryIds.map(catId => [postId, catId]);
        const sql = `INSERT INTO post_categories (post_id, category_id) VALUES ?`;
        await dbConnection.query(sql, [values]);
    }

    static async addAttachments(postId, attachments, dbConnection = pool) {
        const values = attachments.map(att => [postId, att.path, att.type]);
        const sql = `INSERT INTO post_attachments (post_id, file_path, file_type) VALUES ?`;
        await dbConnection.query(sql, [values]);
    }

    static async countAll(dbConnection = pool) {
        const sql = `SELECT COUNT(*) as total FROM posts WHERE status = 'active'`;
        const [result] = await dbConnection.query(sql);
        return result[0].total;
    }

    static async getAll(limit, offset, dbConnection = pool) {
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
        const [posts] = await dbConnection.query(sql, [limit, offset]);
        return posts;
    }

    static async getById(id, dbConnection = pool) {
        const postQuery = `
            SELECT 
                p.id, p.title, p.content, p.status, p.created_at, p.updated_at,
                u.login AS author_login, u.id AS author_id
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.id = ? AND p.status = 'active'
        `;
        
        const [posts] = await dbConnection.query(postQuery, [id]);
        
        if (posts.length === 0) {
            return null;
        }

        const post = posts[0];

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
            dbConnection.query(categoriesQuery, [id]),
            dbConnection.query(attachmentsQuery, [id])
        ]);

        post.categories = categories;
        post.attachments = attachments;

        return post;
    }
}

module.exports = Post;