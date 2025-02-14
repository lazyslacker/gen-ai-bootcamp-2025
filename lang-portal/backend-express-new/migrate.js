const fs = require('fs').promises;
const path = require('path');
const db = require('./db');

async function runMigrations() {
    try {
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = await fs.readdir(migrationsDir);
        
        // Sort migration files to ensure order
        const migrationFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log('Found migration files:', migrationFiles);

        for (const file of migrationFiles) {
            console.log('Running migration:', file);
            const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
            
            await db.asyncRun('BEGIN TRANSACTION');
            try {
                await db.asyncRun(sql);
                await db.asyncRun('COMMIT');
                console.log('Completed migration:', file);
            } catch (err) {
                await db.asyncRun('ROLLBACK');
                throw err;
            }
        }
    } catch (err) {
        console.error('Error running migrations:', err);
        throw err;
    }
}

// Only close the connection if run directly
if (require.main === module) {
    runMigrations()
        .then(() => db.close())
        .catch(err => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}

module.exports = runMigrations;
