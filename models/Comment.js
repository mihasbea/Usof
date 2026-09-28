const { pool } = require('../db/db');
const { visibilityCondition } = require('../utils/visibility');

const LIKE_COUNTS_JOIN = `
    LEFT JOIN (
        SELECT
            comment_id,
            COUNT(CASE WHEN type = 'like' THEN 1 END) AS likes_count,
            COUNT(CASE WHEN type = 'dislike' THEN 1 END) AS dislikes_count
        FROM likes
        WHERE comment_id IS NOT NULL
        GROUP BY comment_id
    ) lc ON lc.comment_id = c.id
`;

const COMMENT_FIELDS = `
    c.id, c.post_id, c.content, c.status, c.created_at, c.updated_at,
    c.author_id, u.login AS author_login,
    COALESCE(lc.likes_count, 0) AS likes_count,
    COALESCE(lc.dislikes_count, 0) AS dislikes_count
`;

class Comment {
    static async create({ post_id, author_id, content }) {
        const sql = 'INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)';
        const [result] = await pool.query(sql, [post_id, author_id, content]);
        return result.insertId;
    }

    static async findById(id) {
        const sql = `
            SELECT ${COMMENT_FIELDS}
            FROM comments c
            JOIN users u ON c.author_id = u.id
            ${LIKE_COUNTS_JOIN}
            WHERE c.id = ?
        `;
        const [rows] = await pool.query(sql, [id]);
        return rows[0];
    }

    static async findByPost(postId, user) {
        const conditions = ['c.post_id = ?'];
        const params = [postId];

        const visibility = visibilityCondition('c', user);
        if (visibility) {
            conditions.push(visibility.sql);
            params.push(...visibility.params);
        }

        const sql = `
            SELECT ${COMMENT_FIELDS}
            FROM comments c
            JOIN users u ON c.author_id = u.id
            ${LIKE_COUNTS_JOIN}
            WHERE ${conditions.join(' AND ')}
            ORDER BY c.created_at ASC, c.id ASC
        `;
        const [comments] = await pool.query(sql, params);
        return comments;
    }
}

module.exports = Comment;
