require('dotenv').config({ quiet: true });

const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');
const { connectionOptions, ensureDatabaseExists } = require('./db');

async function initializeDatabase() {
    await ensureDatabaseExists();

    const sql = await fs.readFile(path.join(__dirname, 'db.sql'), 'utf8');
    const connection = await mysql.createConnection({
        ...connectionOptions,
        database: process.env.DB_NAME,
        multipleStatements: true,
    });

    try {
        await connection.query(sql);
    } finally {
        await connection.end();
    }
}

initializeDatabase()
    .then(() => console.log('Database has been successfully initialized'))
    .catch((error) => {
        console.error('Database initialization error:', error);
        process.exitCode = 1;
    });
