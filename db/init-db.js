const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function initializeDB() {
    let connection;
    try {
        const sqlFilePath = path.join(__dirname, 'db.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        const queries = sqlContent
            .split(';')
            .map(query => query.trim())
            .filter(query => query.length > 0);

        for (const query of queries) {
            await pool.query(query);
        }

        console.log('Database has been successfully initialized');
        process.exit(0);
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

initializeDB();