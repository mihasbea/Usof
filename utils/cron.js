const cron = require('node-cron');
const { pool } = require('../db/db'); 

function initCronJobs() {
    cron.schedule('0 0 * * *', async () => {
        try {
            const [result] = await pool.query('DELETE FROM blacklisted_tokens WHERE expires_at < NOW()');
            console.log(`[CRON] Expired tokens cleaned. Deleted rows: ${result.affectedRows}`);
        } catch (err) {
            console.error('[CRON] Token cleanup error:', err);
        }
    });

    console.log('[CRON] Background tasks initialized successfully.');
}

module.exports = { initCronJobs };