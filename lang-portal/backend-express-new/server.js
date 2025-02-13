const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');
const db = require('./db');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/study-activities', require('./routes/study-activities'));
app.use('/api/study-sessions', require('./routes/study-sessions'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/words', require('./routes/words'));
app.use('/api', require('./routes/system'));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
