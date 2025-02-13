const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');

// Use a test database file
const TEST_DB = './test.db';

async function setupTestDatabase() {
    // Delete existing test database if it exists
    try {
        await fs.unlink(TEST_DB);
    } catch (err) {
        // Ignore error if file doesn't exist
    }

    // Create new test database
    const db = new sqlite3.Database(TEST_DB);

    try {
        // Enable foreign keys
        await run(db, 'PRAGMA foreign_keys = ON');

        // Run all migrations
        const migrationFiles = await fs.readdir('./migrations');
        const sortedFiles = migrationFiles
            .filter(file => file.endsWith('.sql'))
            .sort();

        for (const file of sortedFiles) {
            const sql = await fs.readFile(
                path.join('./migrations', file),
                'utf8'
            );
            await run(db, sql);
        }

        // Insert test data
        await run(db, `
            INSERT INTO groups (id, name) VALUES
            (1, 'Test Group 1'),
            (2, 'Test Group 2')
        `);

        await run(db, `
            INSERT INTO words (id, japanese, romaji, english, parts) VALUES
            (1, 'テスト', 'tesuto', 'test', '["test"]'),
            (2, 'データ', 'deeta', 'data', '["test"]')
        `);

        await run(db, `
            INSERT INTO words_groups (word_id, group_id) VALUES
            (1, 1),
            (2, 1)
        `);

        await run(db, `
            INSERT INTO study_activities (id, name, description) VALUES
            (1, 'Test Activity', 'For testing')
        `);

        console.log('Test database setup complete');
    } catch (err) {
        console.error('Error setting up test database:', err);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Promise wrapper for db.run
function run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Update db.js to use test database during tests
process.env.NODE_ENV = 'test';
process.env.DB_PATH = TEST_DB;

// Export setup function
module.exports = setupTestDatabase;

// Before running tests
before(async () => {
    // Initialize test database
    await setupTestDatabase();
});

// After all tests
after(async () => {
    // Clean up test database
    if (process.env.NODE_ENV === 'test') {
        await fs.unlink(TEST_DB).catch(() => {});
    }
}); 