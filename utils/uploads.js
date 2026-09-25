const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');
const { createHttpError } = require('./httpError');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const UPLOADS_URL = '/uploads';

// The saved file's extension comes from this map, never from the client's file name,
// so an upload can't be served back as HTML or script.
const MIME_EXTENSIONS = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'application/pdf': '.pdf',
};

/**
 * Builds a multer instance that stores files in uploads/<subdir> under random names.
 * @param {object} options
 * @param {string} options.subdir - folder inside uploads/
 * @param {string[]} options.allowedTypes - accepted MIME types (keys of MIME_EXTENSIONS)
 * @param {number} options.maxFileSize - max size of one file in bytes
 */
function createUploader({ subdir, allowedTypes, maxFileSize }) {
    const storage = multer.diskStorage({
        destination: path.join(UPLOADS_DIR, subdir),
        filename: (req, file, cb) => {
            cb(null, `${crypto.randomUUID()}${MIME_EXTENSIONS[file.mimetype]}`);
        },
    });

    const fileFilter = (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(createHttpError(400, `Unsupported file type. Allowed: ${allowedTypes.join(', ')}`));
        }
    };

    return multer({ storage, fileFilter, limits: { fileSize: maxFileSize } });
}

function toPublicPath(subdir, filename) {
    return `${UPLOADS_URL}/${subdir}/${filename}`;
}

function toDiskPath(publicPath) {
    return path.join(UPLOADS_DIR, publicPath.slice(UPLOADS_URL.length));
}

async function removeFiles(filePaths) {
    await Promise.all(filePaths.map((filePath) => fs.unlink(filePath).catch(() => {})));
}

module.exports = {
    UPLOADS_DIR,
    UPLOADS_URL,
    createUploader,
    toPublicPath,
    toDiskPath,
    removeFiles,
};
