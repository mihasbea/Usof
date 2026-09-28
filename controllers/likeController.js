const { isDuplicateEntryError } = require('../db/db');
const Like = require('../models/Like');

const LIKE_TYPES = ['like', 'dislike'];

class LikeController {
    static async getByPost(req, res) {
        try {
            const likes = await Like.findByTarget('post', req.post.id);
            return res.status(200).json(likes);
        } catch (error) {
            console.error(`Error fetching likes of post ID ${req.post.id}:`, error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async createForPost(req, res) {
        try {
            const { type = 'like' } = req.body;
            if (!LIKE_TYPES.includes(type)) {
                return res
                    .status(400)
                    .json({ message: `Type must be one of: ${LIKE_TYPES.join(', ')}` });
            }

            if (req.post.status !== 'active') {
                return res.status(403).json({ message: 'Only active posts can be liked' });
            }

            const target = { targetType: 'post', targetId: req.post.id };
            const ownerId = req.post.author_id;
            const existingLike = await Like.findByAuthorAndTarget(
                req.user.id,
                target.targetType,
                target.targetId
            );

            if (existingLike?.type === type) {
                return res.status(409).json({ message: `You have already ${type}d this post` });
            }

            if (existingLike) {
                await Like.updateType(existingLike.id, type, ownerId);
                const like = await Like.findById(existingLike.id);
                return res.status(200).json({ message: `Changed to ${type}`, like });
            }

            const likeId = await Like.create({ authorId: req.user.id, type, ownerId, ...target });
            const like = await Like.findById(likeId);

            return res.status(201).json({ message: `Post ${type}d successfully`, like });
        } catch (error) {
            if (isDuplicateEntryError(error)) {
                return res.status(409).json({ message: 'You have already rated this post' });
            }
            console.error(`Error liking post ID ${req.post.id}:`, error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async deleteForPost(req, res) {
        try {
            const like = await Like.findByAuthorAndTarget(req.user.id, 'post', req.post.id);
            if (!like) {
                return res.status(404).json({ message: 'You have not rated this post' });
            }

            await Like.delete(like.id, req.post.author_id);
            return res.status(200).json({ message: 'Like deleted successfully' });
        } catch (error) {
            console.error(`Error deleting a like under post ID ${req.post.id}:`, error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = LikeController;
