const { initDB } = require('./db/db.js');
const express = require('express');
const authRoutes = require('./routes/authRoutes.js');
const { initCronJobs } = require('./utils/cron');
const userRoutes = require('./routes/userRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

async function startServer() {
    try {
        await initDB();
        initCronJobs();
        
        app.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
    } catch(error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();

