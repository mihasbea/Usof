const Comment = require('../models/Comment');
const { validateText } = require('../utils/validators');

class CommentController {
    static async getByPost(req, res) {
        try {
            const comments = await Comment.findByPost(req.post.id, req.user);
            return res.status(200).json(comments);
        } catch (error) {
            console.error(`Error fetching comments of post ID ${req.post.id}:`, error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async createForPost(req, res) {
        try {
            if (req.post.status !== 'active') {
                return res
                    .status(403)
                    .json({ message: 'Comments can only be added to active posts' });
            }

            const { content } = req.body;
            const contentError = validateText(content, 'Content');
            if (contentError) {
                return res.status(400).json({ message: contentError });
            }

            const commentId = await Comment.create({
                post_id: req.post.id,
                author_id: req.user.id,
                content: content.trim(),
            });
            const comment = await Comment.findById(commentId);

            return res.status(201).json({ message: 'Comment created successfully', comment });
        } catch (error) {
            console.error(`Error creating a comment under post ID ${req.post.id}:`, error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = CommentController;
