const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_STRING_LENGTH = 255;
const MAX_TEXT_LENGTH = 10000;
const MIN_PASSWORD_LENGTH = 8;

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateText(value, fieldName, maxLength = MAX_TEXT_LENGTH) {
    if (!isNonEmptyString(value)) {
        return `${fieldName} is required`;
    }
    if (value.trim().length > maxLength) {
        return `${fieldName} must be at most ${maxLength} characters long`;
    }
    return null;
}

function parseIdList(value) {
    const rawIds = typeof value === 'string' ? value.split(',') : value;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
        return null;
    }

    const ids = rawIds.map(parsePositiveInt);
    return ids.includes(null) ? null : [...new Set(ids)];
}

function parseDate(value) {
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
        return null;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) ? value : null;
}

function parsePositiveInt(value) {
    const text = String(value).trim();
    if (!/^\d+$/.test(text)) {
        return null;
    }

    const number = Number(text);
    return number > 0 && Number.isSafeInteger(number) ? number : null;
}

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
    validateText,
    parsePositiveInt,
    parseIdList,
    parseDate,
    validateUserFields,
};
