const Category = require('../models/Category');
const Post = require('../models/Post');
const { removeFiles, toPublicPath } = require('../utils/uploads');
const { MAX_STRING_LENGTH, isNonEmptyString, parsePositiveInt } = require('../utils/validators');

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Accepts "1,2,3" (form-data) or [1, 2, 3] (JSON).
 * @returns {number[] | null} unique category IDs, or null when the value is invalid
 */
function parseCategoryIds(categories) {
    const rawIds = typeof categories === 'string' ? categories.split(',') : categories;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
        return null;
    }

    const ids = rawIds.map(parsePositiveInt);
    return ids.includes(null) ? null : [...new Set(ids)];
}

/**
 * Checks the body of a new post.
 * @returns {Promise<{ error: string } | { title: string, content: string, categoryIds: number[] }>}
 */
async function validatePostInput({ title, content, categories }) {
    if (!isNonEmptyString(title) || !isNonEmptyString(content)) {
        return { error: 'Title and content are required' };
    }
    if (title.trim().length > MAX_STRING_LENGTH) {
        return { error: `Title must be at most ${MAX_STRING_LENGTH} characters long` };
    }

    const categoryIds = parseCategoryIds(categories);
    if (!categoryIds) {
        return { error: 'Categories must be a non-empty list of category IDs' };
    }

    const existingIds = await Category.findExistingIds(categoryIds);
    const missingIds = categoryIds.filter((id) => !existingIds.includes(id));
    if (missingIds.length > 0) {
        return { error: `Categories not found: ${missingIds.join(', ')}` };
    }

    return { title: title.trim(), content: content.trim(), categoryIds };
}

function getAttachmentType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'document';
    return 'other';
}

class PostController {
    static async create(req, res) {
        // Multer has already saved the files, so every failure path must delete them.
        const files = req.files ?? [];
        const filePaths = files.map((file) => file.path);

        try {
            const input = await validatePostInput(req.body);
            if (input.error) {
                await removeFiles(filePaths);
                return res.status(400).json({ message: input.error });
            }

            const attachments = files.map((file) => ({
                path: toPublicPath('posts', file.filename),
                type: getAttachmentType(file.mimetype),
            }));

            const postId = await Post.create({
                author_id: req.user.id,
                title: input.title,
                content: input.content,
                categoryIds: input.categoryIds,
                attachments,
            });

            return res.status(201).json({
                message: 'Post created successfully',
                post_id: postId,
                attachments_count: attachments.length,
            });
        } catch (error) {
            await removeFiles(filePaths);
            console.error('Error during post creation:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getAll(req, res) {
        try {
            const { page: pageParam, limit: limitParam } = req.query;
            const page = pageParam === undefined ? 1 : parsePositiveInt(pageParam);
            const limit = limitParam === undefined ? DEFAULT_PAGE_SIZE : parsePositiveInt(limitParam);

            if (!page || !limit || limit > MAX_PAGE_SIZE) {
                return res.status(400).json({
                    message: `Page must be a positive integer and limit must be between 1 and ${MAX_PAGE_SIZE}`,
                });
            }

            const offset = (page - 1) * limit;
            const [totalPosts, posts] = await Promise.all([
                Post.countActive(),
                Post.getAll(limit, offset),
            ]);

            return res.status(200).json({
                data: posts,
                pagination: {
                    total_posts: totalPosts,
                    total_pages: Math.ceil(totalPosts / limit),
                    current_page: page,
                    limit,
                },
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req, res) {
        try {
            const postId = parsePositiveInt(req.params.post_id);
            if (!postId) {
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
