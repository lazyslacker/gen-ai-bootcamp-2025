const fs = require('fs').promises;
const path = require('path');
const db = require('./db');

async function runMigrations() {
    try {
        // Enable foreign keys
        await db.asyncRun('PRAGMA foreign_keys = ON');
        console.log('Foreign keys enabled');

        // Get all migration files
        const files = await fs.readdir(path.join(__dirname, 'migrations'));
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

        // Run each migration
        for (const file of sqlFiles) {
            console.log(`Running migration: ${file}`);
            const sql = await fs.readFile(
                path.join(__dirname, 'migrations', file),
                'utf8'
            );

            try {
                await db.asyncRun(sql);
                console.log(`Completed migration: ${file}`);
            } catch (err) {
                console.error(`Error in migration ${file}:`, err);
                throw err;
            }
        }

        console.log('All migrations completed successfully');
    } catch (err) {
        console.error('Error running migrations:', err);
        throw err;
    }
}

module.exports = runMigrations;

// Run migrations if this file is run directly
if (require.main === module) {
    runMigrations().catch(err => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
}
