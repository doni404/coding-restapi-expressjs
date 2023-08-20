import cors from 'cors';
import express from 'express';

import adminCMS from './routes/cms/admin.js';

// Defining the Express app
const app = express();

// Enabling CORS for all request
app.use(cors());

// Use express JSON format
app.use(express.json({
    limit: '20mb',
}));

// Declaring root endpoint
app.get('/', (req, res) => {
    res.send('CODING API v1');
});

// v1 cms
app.use('/v1/cms/admins', adminCMS);

export default app;