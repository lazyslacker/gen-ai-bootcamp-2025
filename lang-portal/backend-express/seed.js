const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');

const db = new sqlite3.Database('./words.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database.');
});

async function seedDatabase() {
    try {
        // Enable foreign keys
        await run('PRAGMA foreign_keys = ON');

        // Read and insert groups
        const groups = JSON.parse(
            await fs.readFile('./seeds/groups.json', 'utf8')
        ).groups;
        
        for (const group of groups) {
            await run(
                'INSERT OR IGNORE INTO groups (id, name) VALUES (?, ?)',
                [group.id, group.name]
            );
        }

        // Read and insert words
        const words = JSON.parse(
            await fs.readFile('./seeds/words.json', 'utf8')
        ).words;
        
        for (const word of words) {
            await run(
                'INSERT OR IGNORE INTO words (id, japanese, romaji, english, parts) VALUES (?, ?, ?, ?, ?)',
                [word.id, word.japanese, word.romaji, word.english, JSON.stringify(word.parts)]
            );
        }

        // Read and insert words_groups
        const wordsGroups = JSON.parse(
            await fs.readFile('./seeds/words_groups.json', 'utf8')
        ).words_groups;
        
        for (const wg of wordsGroups) {
            await run(
                'INSERT OR IGNORE INTO words_groups (word_id, group_id) VALUES (?, ?)',
                [wg.word_id, wg.group_id]
            );
        }

        // Read and insert study activities
        const activities = JSON.parse(
            await fs.readFile('./seeds/study_activities.json', 'utf8')
        ).study_activities;
        
        for (const activity of activities) {
            await run(
                'INSERT OR IGNORE INTO study_activities (id, name, description, thumbnail_url) VALUES (?, ?, ?, ?)',
                [activity.id, activity.name, activity.description, activity.thumbnail_url]
            );
        }

        console.log('Database seeded successfully!');
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Promise wrapper for db.run
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Run seeding
seedDatabase(); 