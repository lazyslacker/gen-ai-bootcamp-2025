const db = require('../db');
const runMigrations = require('../migrate');
const seedDatabase = require('../seed');

async function initDevDatabase() {
    try {
        console.log('Connecting to database...');
        await db.connect();

        console.log('Running migrations...');
        await runMigrations();

        console.log('Seeding database with development data...');
        await seedDatabase();

        console.log('Development database initialized successfully!');
    } catch (err) {
        console.error('Error initializing development database:', err);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// Run if this script is executed directly
if (require.main === module) {
    initDevDatabase();
}

module.exports = initDevDatabase; 