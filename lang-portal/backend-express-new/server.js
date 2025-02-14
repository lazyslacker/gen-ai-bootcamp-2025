const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');
const db = require('./db');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Connect to database when server starts
db.connect().catch(console.error);

// Serve API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Add this before your routes
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body
    });
    next();
});

// Routes
app.use('/api/study-activities', require('./routes/study-activities'));
app.use('/api/study-sessions', require('./routes/study-sessions'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/words', require('./routes/words'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api', require('./routes/system'));

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
