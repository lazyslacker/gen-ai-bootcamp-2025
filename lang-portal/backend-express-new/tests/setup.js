const fs = require('fs').promises;
const path = require('path');
const db = require('../db');
const runMigrations = require('../migrate');
const seedDatabase = require('../seed');

// Use test database in data directory
const DATA_DIR = path.join(__dirname, '..', 'data');
const TEST_DB = path.join(DATA_DIR, 'test.db');

// Update environment for tests
process.env.NODE_ENV = 'test';

// Before all tests
before(async () => {
    try {
        // Ensure data directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Delete existing test database if it exists
        try {
            await fs.unlink(TEST_DB);
        } catch (err) {
            // Ignore error if file doesn't exist
        }

        // Connect to database
        await db.connect();

        // Run migrations and seed data
        await runMigrations();
        await seedDatabase();
        console.log('Test database setup completed');
    } catch (err) {
        console.error('Error setting up test database:', err);
        throw err;
    }
});

// After each test
afterEach(async () => {
    try {
        // Close the current connection
        await db.close();
        
        // Delete the test database
        await fs.unlink(TEST_DB).catch(() => {});
        
        // Create a new connection
        await db.connect();
        
        // Run migrations and seed fresh data
        await runMigrations();
        await seedDatabase();
    } catch (err) {
        console.error('Error resetting test database:', err);
        throw err;
    }
});

// After all tests
after(async () => {
    await db.close();
    await fs.unlink(TEST_DB).catch(() => {});
}); 