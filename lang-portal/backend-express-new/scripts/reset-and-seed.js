const fs = require('fs').promises;
const path = require('path');
const generateMigrations = require('./generate-migrations');
const db = require('../db');
const seedDatabase = require('../seed');

async function resetAndSeed() {
    try {
        const dbPath = process.env.NODE_ENV === 'test' 
            ? path.join(__dirname, '..', 'data', 'test.db')
            : path.join(__dirname, '..', 'data', 'development.db');

        // Delete existing database if it exists
        try {
            await fs.unlink(dbPath);
            console.log('Existing database deleted');
        } catch (err) {
            // Ignore error if file doesn't exist
        }

        // Generate fresh migration files
        console.log('Generating migration files...');
        await generateMigrations();

        // Run seeding process (which includes migrations)
        console.log('Starting database seeding...');
        await seedDatabase();

        console.log('Database reset and seeding completed successfully!');
    } catch (err) {
        console.error('Error during reset and seed:', err);
        process.exit(1);
    }
}

resetAndSeed(); 