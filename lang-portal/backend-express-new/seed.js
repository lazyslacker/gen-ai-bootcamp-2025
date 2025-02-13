const db = require('./db');

async function seedDatabase() {
    try {
        await db.asyncRun('BEGIN TRANSACTION');

        // 1. Add study activities first (no dependencies)
        const activities = [
            {
                name: 'Typing Tutor',
                description: 'Practice typing Japanese words',
                thumbnail_url: null
            },
            {
                name: 'Flashcards',
                description: 'Review words with flashcards',
                thumbnail_url: null
            }
        ];

        for (const activity of activities) {
            await db.asyncRun(
                'INSERT INTO study_activities (name, description, thumbnail_url) VALUES (?, ?, ?)',
                [activity.name, activity.description, activity.thumbnail_url]
            );
        }

        // 2. Add groups (no dependencies)
        const groups = [
            { name: 'Basic Greetings' },
            { name: 'Common Phrases' },
            { name: 'Numbers 1-10' }
        ];

        for (const group of groups) {
            await db.asyncRun(
                'INSERT INTO groups (name) VALUES (?)',
                [group.name]
            );
        }

        // 3. Add words (no dependencies)
        const words = [
            {
                japanese: 'こんにちは',
                romaji: 'konnichiwa',
                english: 'hello',
                parts: JSON.stringify(['greeting', 'formal'])
            },
            {
                japanese: 'さようなら',
                romaji: 'sayounara',
                english: 'goodbye',
                parts: JSON.stringify(['greeting', 'formal'])
            },
            {
                japanese: 'おはよう',
                romaji: 'ohayou',
                english: 'good morning',
                parts: JSON.stringify(['greeting', 'informal'])
            }
        ];

        for (const word of words) {
            await db.asyncRun(
                'INSERT INTO words (japanese, romaji, english, parts) VALUES (?, ?, ?, ?)',
                [word.japanese, word.romaji, word.english, word.parts]
            );
        }

        // 4. Add words to groups (depends on words and groups)
        await db.asyncRun('INSERT INTO words_groups (word_id, group_id) VALUES (1, 1)');
        await db.asyncRun('INSERT INTO words_groups (word_id, group_id) VALUES (2, 1)');
        await db.asyncRun('INSERT INTO words_groups (word_id, group_id) VALUES (3, 1)');

        // 5. Add study sessions (depends on groups and activities)
        await db.asyncRun(
            'INSERT INTO study_sessions (group_id, study_activity_id) VALUES (?, ?)',
            [1, 1]
        );

        // 6. Add word reviews (depends on words and study sessions)
        await db.asyncRun(
            'INSERT INTO word_review_items (word_id, study_session_id, correct) VALUES (?, ?, ?)',
            [1, 1, true]
        );
        await db.asyncRun(
            'INSERT INTO word_review_items (word_id, study_session_id, correct) VALUES (?, ?, ?)',
            [2, 1, false]
        );

        await db.asyncRun('COMMIT');
        console.log('Database seeded successfully');

        // Verify the data
        const wordCount = await db.asyncGet('SELECT COUNT(*) as count FROM words');
        const groupCount = await db.asyncGet('SELECT COUNT(*) as count FROM groups');
        const sessionCount = await db.asyncGet('SELECT COUNT(*) as count FROM study_sessions');

        console.log('Verification:');
        console.log('- Words:', wordCount.count);
        console.log('- Groups:', groupCount.count);
        console.log('- Study Sessions:', sessionCount.count);

    } catch (err) {
        await db.asyncRun('ROLLBACK');
        console.error('Error seeding database:', err);
        throw err;
    }
}

module.exports = seedDatabase;

if (require.main === module) {
    seedDatabase().then(() => {
        db.close();
    }).catch(err => {
        console.error('Seeding failed:', err);
        process.exit(1);
    });
} 