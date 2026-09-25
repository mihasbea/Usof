/**
 * Creates an error whose message the error handler may show to the client.
 * @param {number} status - HTTP status code (4xx)
 * @param {string} message
 */
function createHttpError(status, message) {
    const error = new Error(message);
    error.status = status;
    error.expose = true;
    return error;
}

module.exports = { createHttpError };
