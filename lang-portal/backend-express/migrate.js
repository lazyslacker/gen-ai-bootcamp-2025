const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');

// Create/connect to SQLite database
const db = new sqlite3.Database('./words.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database.');
});

async function runMigrations() {
    try {
        // Get all migration files
        const migrationFiles = await fs.readdir('./migrations');
        
        // Sort files to ensure they run in order
        const sortedFiles = migrationFiles
            .filter(file => file.endsWith('.sql'))
            .sort();

        // Enable foreign keys
        await run('PRAGMA foreign_keys = ON');
        
        // Run each migration in a transaction
        for (const file of sortedFiles) {
            console.log(`Running migration: ${file}`);
            
            const sql = await fs.readFile(
                path.join('./migrations', file), 
                'utf8'
            );
            
            await run('BEGIN TRANSACTION');
            
            try {
                await run(sql);
                await run('COMMIT');
                console.log(`Migration ${file} completed successfully.`);
            } catch (err) {
                await run('ROLLBACK');
                throw err;
            }
        }
        
        console.log('All migrations completed successfully!');
    } catch (err) {
        console.error('Error running migrations:', err);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Promise wrapper for db.run
function run(sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Run migrations
runMigrations(); 