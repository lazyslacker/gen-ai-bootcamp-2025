const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Import database connection
const db = require('./db');

// Middleware
app.use(cors());
app.use(express.json());

// Import routes (we'll create these next)
const wordsRouter = require('./routes/words');
const groupsRouter = require('./routes/groups');
const studySessionsRouter = require('./routes/study_sessions');
const studyActivitiesRouter = require('./routes/study_activities');
const dashboardRouter = require('./routes/dashboard');
const systemRouter = require('./routes/system');

// Register routes
app.use('/words', wordsRouter);
app.use('/groups', groupsRouter);
app.use('/study_sessions', studySessionsRouter);
app.use('/study_activities', studyActivitiesRouter);
app.use('/dashboard', dashboardRouter);
app.use('/', systemRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Export for testing
module.exports = app;
