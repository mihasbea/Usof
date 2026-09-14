const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function initDB() {
    try {
        const tempConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        const dbNameEscaped = mysql.escapeId(process.env.DB_NAME);

        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbNameEscaped}`);
        await tempConnection.query(`USE ${dbNameEscaped}`);

        const sqlFilePath = path.join(__dirname, 'db.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        await tempConnection.query(sql);
        console.log('Database initialized successfully.');

        return pool;
    } catch(error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        await tempConnection.end();
    }
}

module.exports = {
    pool,
    initDB
};