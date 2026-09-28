const Category = require('../models/Category');
const Post = require('../models/Post');
const { removeFiles, toDiskPath, toPublicPath } = require('../utils/uploads');
const {
    MAX_STRING_LENGTH,
    parseDate,
    parseIdList,
    parsePositiveInt,
    validateText,
} = require('../utils/validators');

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const POST_STATUSES = ['active', 'inactive'];
const SORT_OPTIONS = ['likes', 'date'];
const ORDER_OPTIONS = ['asc', 'desc'];

function validateTitle(title) {
    return validateText(title, 'Title', MAX_STRING_LENGTH);
}

function validateContent(content) {
    return validateText(content, 'Content');
}

async function validateCategories(categories) {
    const categoryIds = parseIdList(categories);
    if (!categoryIds) {
        return { error: 'Categories must be a non-empty list of category IDs' };
    }

    const existingIds = await Category.findExistingIds(categoryIds);
    const missingIds = categoryIds.filter((id) => !existingIds.includes(id));
    if (missingIds.length > 0) {
        return { error: `Categories not found: ${missingIds.join(', ')}` };
    }

    return { categoryIds };
}

function parseListQuery(query) {
    const page = query.page === undefined ? 1 : parsePositiveInt(query.page);
    const limit = query.limit === undefined ? DEFAULT_PAGE_SIZE : parsePositiveInt(query.limit);
    if (!page || !limit || limit > MAX_PAGE_SIZE) {
        return {
            error: `Page must be a positive integer and limit must be between 1 and ${MAX_PAGE_SIZE}`,
        };
    }

    const { sort = 'likes', order = 'desc', status } = query;
    if (!SORT_OPTIONS.includes(sort)) {
        return { error: `Sort must be one of: ${SORT_OPTIONS.join(', ')}` };
    }
    if (!ORDER_OPTIONS.includes(order)) {
        return { error: `Order must be one of: ${ORDER_OPTIONS.join(', ')}` };
    }
    if (status !== undefined && !POST_STATUSES.includes(status)) {
        return { error: `Status must be one of: ${POST_STATUSES.join(', ')}` };
    }

    let categoryIds;
    if (query.categories !== undefined) {
        categoryIds = parseIdList(query.categories);
        if (!categoryIds) {
            return { error: 'Categories must be a comma-separated list of category IDs' };
        }
    }

    const dateFrom = query.date_from === undefined ? undefined : parseDate(query.date_from);
    const dateTo = query.date_to === undefined ? undefined : parseDate(query.date_to);
    if (dateFrom === null || dateTo === null) {
        return { error: 'Dates must be valid dates in the YYYY-MM-DD format' };
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
        return { error: 'date_from must not be later than date_to' };
    }

    return {
        page,
        limit,
        sort,
        order,
        filters: { status, categoryIds, dateFrom, dateTo },
    };
}

function getAttachmentType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'document';
    return 'other';
}

class PostController {
    static async create(req, res) {
        const files = req.files ?? [];
        const filePaths = files.map((file) => file.path);

        try {
            const { title, content, categories } = req.body;

            const textError = validateTitle(title) ?? validateContent(content);
            if (textError) {
                await removeFiles(filePaths);
                return res.status(400).json({ message: textError });
            }

            const { error: categoriesError, categoryIds } = await validateCategories(categories);
            if (categoriesError) {
                await removeFiles(filePaths);
                return res.status(400).json({ message: categoriesError });
            }

            const attachments = files.map((file) => ({
                path: toPublicPath('posts', file.filename),
                type: getAttachmentType(file.mimetype),
            }));

            const postId = await Post.create({
                author_id: req.user.id,
                title: title.trim(),
                content: content.trim(),
                categoryIds,
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
            const query = parseListQuery(req.query);
            if (query.error) {
                return res.status(400).json({ message: query.error });
            }

            const { page, limit, sort, order, filters } = query;
            const { posts, total } = await Post.findAll({
                user: req.user,
                filters,
                sort,
                order,
                limit,
                offset: (page - 1) * limit,
            });

            return res.status(200).json({
                data: posts,
                pagination: {
                    total_posts: total,
                    total_pages: Math.ceil(total / limit),
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
            const post = await Post.getById(req.post.id);
            return res.status(200).json(post);
        } catch (error) {
            console.error(`Error fetching post ID ${req.post.id}:`, error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getCategories(req, res) {
        try {
            const categories = await Post.getCategories(req.post.id);
            return res.status(200).json(categories);
        } catch (error) {
            console.error(`Error fetching categories of post ID ${req.post.id}:`, error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async update(req, res) {
        try {
            const isAuthor = req.post.author_id === req.user.id;
            const isAdmin = req.user.role === 'admin';

            if (!isAuthor && !isAdmin) {
                return res
                    .status(403)
                    .json({ message: 'Only the author or an admin can update this post' });
            }

            const { title, content, categories, status } = req.body;
            const changes = {};

            if ((title !== undefined || content !== undefined) && !isAuthor) {
                return res
                    .status(403)
                    .json({ message: 'Only the author can change the title and content' });
            }
            if (status !== undefined && !isAdmin) {
                return res.status(403).json({ message: 'Only an admin can change the status' });
            }

            if (title !== undefined) {
                const titleError = validateTitle(title);
                if (titleError) {
                    return res.status(400).json({ message: titleError });
                }
                changes.title = title.trim();
            }

            if (content !== undefined) {
                const contentError = validateContent(content);
                if (contentError) {
                    return res.status(400).json({ message: contentError });
                }
                changes.content = content.trim();
            }

            if (status !== undefined) {
                if (!POST_STATUSES.includes(status)) {
                    return res
                        .status(400)
                        .json({ message: `Status must be one of: ${POST_STATUSES.join(', ')}` });
                }
                changes.status = status;
            }

            let categoryIds;
            if (categories !== undefined) {
                const result = await validateCategories(categories);
                if (result.error) {
                    return res.status(400).json({ message: result.error });
                }
                categoryIds = result.categoryIds;
            }

            if (Object.keys(changes).length === 0 && !categoryIds) {
                return res.status(400).json({
                    message:
                        'Provide at least one field to update: title, content, categories, status',
                });
            }

            await Post.update(req.post.id, changes, categoryIds);
            const post = await Post.getById(req.post.id);

            return res.status(200).json({ message: 'Post updated successfully', post });
        } catch (error) {
            console.error(`Error updating post ID ${req.post.id}:`, error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async delete(req, res) {
        try {
            const isAuthor = req.post.author_id === req.user.id;
            const isAdmin = req.user.role === 'admin';

            if (!isAuthor && !isAdmin) {
                return res
                    .status(403)
                    .json({ message: 'Only the author or an admin can delete this post' });
            }

            const attachmentPaths = await Post.delete(req.post.id);
            await removeFiles(attachmentPaths.map(toDiskPath));

            return res.status(200).json({ message: 'Post deleted successfully' });
        } catch (error) {
            console.error(`Error deleting post ID ${req.post.id}:`, error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = PostController;
