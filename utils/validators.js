const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_STRING_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 8;

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Parses a positive integer such as an ID, page or limit.
 * @returns {number | null} the number, or null when the value is not a positive integer
 */
function parsePositiveInt(value) {
    const text = String(value).trim();
    if (!/^\d+$/.test(text)) {
        return null;
    }

    const number = Number(text);
    return number > 0 && Number.isSafeInteger(number) ? number : null;
}

/**
 * Checks the user fields that are present in `fields`; missing fields are skipped.
 * @returns {string | null} a message describing the first invalid field, or null
 */
function validateUserFields(fields) {
    const { login, full_name, email, password, password_confirmation } = fields;

    if (login !== undefined && !isShortString(login)) {
        return `Login must be a non-empty string of at most ${MAX_STRING_LENGTH} characters`;
    }
    if (full_name !== undefined && !isShortString(full_name)) {
        return `Full name must be a non-empty string of at most ${MAX_STRING_LENGTH} characters`;
    }
    if (email !== undefined && !(isShortString(email) && EMAIL_PATTERN.test(email))) {
        return 'Email is not valid';
    }
    if (password !== undefined) {
        if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
            return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
        }
        if (password !== password_confirmation) {
            return 'Passwords do not match';
        }
    }
    return null;
}

function isShortString(value) {
    return isNonEmptyString(value) && value.length <= MAX_STRING_LENGTH;
}

module.exports = {
    MAX_STRING_LENGTH,
    isNonEmptyString,
    parsePositiveInt,
    validateUserFields,
};
