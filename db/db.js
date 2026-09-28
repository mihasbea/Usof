const mysql = require('mysql2/promise');

const connectionOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
};

const pool = mysql.createPool({ ...connectionOptions, database: process.env.DB_NAME });

async function ensureDatabaseExists() {
    const connection = await mysql.createConnection(connectionOptions);
    try {
        const dbName = mysql.escapeId(process.env.DB_NAME);
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
    } finally {
        await connection.end();
    }
}

async function withTransaction(callback) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

function isDuplicateEntryError(error) {
    return error.code === 'ER_DUP_ENTRY';
}

module.exports = {
    pool,
    connectionOptions,
    ensureDatabaseExists,
    withTransaction,
    isDuplicateEntryError,
};
