const { pool } = require('../db/db');
const Post = require('../models/Post');
const fs = require('fs').promises;

class PostController {
    static async create(req, res) {
        const connection = await pool.getConnection();
        let createdFiles = req.files ? req.files.map(f => f.path) : [];

        try {
            await connection.beginTransaction();

            let { title, content, categories } = req.body;
            const author_id = req.user.id;

            if (!title || !content || !categories) {
                return res.status(400).json({ message: 'Title, content and categories are required' });
            }

            let categoryIds = [];
            if (typeof categories === 'string') {
                categoryIds = categories.split(',').map(id => parseInt(id.trim(), 10));
            } else if (Array.isArray(categories)) {
                categoryIds = categories.map(id => parseInt(id, 10));
            }

            categoryIds = categoryIds.filter(id => !isNaN(id));

            if (categoryIds.length === 0) {
                return res.status(400).json({ message: 'Valid categories are required' });
            }

            const postId = await Post.create({ author_id, title, content }, connection);

            await Post.addCategories(postId, categoryIds, connection);

            if (req.files && req.files.length > 0) {
                const attachments = req.files.map(file => {
                    let fileType = 'other';
                    if (file.mimetype.startsWith('image/')) fileType = 'image';
                    else if (file.mimetype.startsWith('video/')) fileType = 'video';
                    else if (file.mimetype === 'application/pdf') fileType = 'document';

                    return { path: `/uploads/posts/${file.filename}`, type: fileType };
                });

                await Post.addAttachments(postId, attachments, connection);
                createdFiles = req.files.map(f => f.path);
            }

            await connection.commit();

            return res.status(201).json({
                message: 'Post created successfully',
                post_id: postId,
                attachments_count: createdFiles.length
            });

        } catch (error) {
            await connection.rollback();

            for (const filePath of createdFiles) {
                await fs.unlink(filePath).catch(() => {});
            }

            console.error('Error during post creation:', error);
            return res.status(500).json({ message: 'Internal server error' });
        } finally {
            connection.release();
        }
    }

    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            
            if (page < 1 || limit < 1) {
                return res.status(400).json({ message: 'Page and limit must be positive integers' });
            }

            const offset = (page - 1) * limit;

            const [totalPosts, posts] = await Promise.all([
                Post.countAll(),
                Post.getAll(limit, offset)
            ]);

            const totalPages = Math.ceil(totalPosts / limit);

            return res.status(200).json({
                data: posts,
                pagination: {
                    total_posts: totalPosts,
                    total_pages: totalPages,
                    current_page: page,
                    limit: limit
                }
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req, res) {
        try {
            const postId = parseInt(req.params.post_id, 10);

            if (isNaN(postId) || postId <= 0) {
                return res.status(400).json({ message: 'Invalid post ID format' });
            }

            const post = await Post.getById(postId);

            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            return res.status(200).json(post);
        } catch (error) {
            console.error(`Error fetching post ID ${req.params.post_id}:`, error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = PostController;