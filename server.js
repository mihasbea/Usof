// Must run first: other modules read process.env as soon as they are loaded.
require('dotenv').config({ quiet: true });

const express = require('express');
const { ensureDatabaseExists } = require('./db/db');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const { initCronJobs } = require('./utils/cron');
const { UPLOADS_DIR, UPLOADS_URL } = require('./utils/uploads');

const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const PORT = Number(process.env.PORT) || 3000;

const app = express();

app.use(express.json());
// Express 5 leaves req.body undefined when a request has no body.
app.use((req, res, next) => {
    req.body ??= {};
    next();
});

app.use(
    UPLOADS_URL,
    express.static(UPLOADS_DIR, {
        // Stops browsers from guessing a different file type than the one the server sends.
        setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    })
);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
    const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
    if (missingEnvVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }

    await ensureDatabaseExists();
    initCronJobs();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error('Error starting server:', error);
    process.exit(1);
});
