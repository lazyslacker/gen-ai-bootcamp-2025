const db = require('./db');
const runMigrations = require('./migrate');

async function seedDatabase() {
    try {
        // Connect to database first
        await db.connect();

        // Run migrations before seeding
        console.log('Running migrations...');
        await runMigrations();

        console.log('Starting database seeding...');
        await db.asyncRun('BEGIN TRANSACTION');

        // Clear existing data
        console.log('Clearing existing data...');
        await db.asyncRun('DELETE FROM word_review_items');
        await db.asyncRun('DELETE FROM study_sessions');
        await db.asyncRun('DELETE FROM words_groups');
        await db.asyncRun('DELETE FROM words');
        await db.asyncRun('DELETE FROM groups');
        await db.asyncRun('DELETE FROM study_activities');
        await db.asyncRun('DELETE FROM sqlite_sequence');

        // Add study activities
        console.log('Seeding study activities...');
        await db.asyncRun(`
            INSERT INTO study_activities (name, description, thumbnail_url, launch_url) VALUES 
            ('Typing Practice', 'Master Japanese typing with interactive exercises', '/images/typing.png', '/activities/typing'),
            ('Flashcards', 'Review words efficiently with spaced repetition', '/images/flashcards.png', '/activities/flashcards'),
            ('Word Quiz', 'Test your knowledge with multiple choice quizzes', '/images/quiz.png', '/activities/quiz'),
            ('Writing Practice', 'Practice writing Kanji characters', '/images/writing.png', '/activities/writing'),
            ('Listening Drill', 'Improve your listening comprehension', '/images/listening.png', '/activities/listening')
        `);

        // Add word groups
        console.log('Seeding groups...');
        await db.asyncRun(`
            INSERT INTO groups (name) VALUES 
            ('Basic Greetings'),
            ('Numbers 1-10'),
            ('Days of the Week'),
            ('Common Phrases'),
            ('Family Members'),
            ('Colors'),
            ('Food & Drinks')
        `);

        // Add words with their groups
        console.log('Seeding words...');
        const words = [
            // Basic Greetings
            ['こんにちは', 'konnichiwa', 'hello', '["greeting", "basic"]', 1],
            ['さようなら', 'sayounara', 'goodbye', '["greeting", "basic"]', 1],
            ['おはよう', 'ohayou', 'good morning', '["greeting", "basic"]', 1],
            ['こんばんは', 'konbanwa', 'good evening', '["greeting", "basic"]', 1],
            
            // Numbers
            ['いち', 'ichi', 'one', '["number", "basic"]', 2],
            ['に', 'ni', 'two', '["number", "basic"]', 2],
            ['さん', 'san', 'three', '["number", "basic"]', 2],
            ['よん', 'yon', 'four', '["number", "basic"]', 2],
            ['ご', 'go', 'five', '["number", "basic"]', 2]
        ];

        for (const [kanji, romaji, english, parts, groupId] of words) {
            const result = await db.asyncRun(
                'INSERT INTO words (kanji, romaji, english, parts) VALUES (?, ?, ?, ?)',
                [kanji, romaji, english, parts]
            );
            await db.asyncRun(
                'INSERT INTO words_groups (word_id, group_id) VALUES (?, ?)',
                [result.lastID, groupId]
            );
        }

        // Create some study sessions
        console.log('Creating study sessions...');
        const groups = await db.asyncAll('SELECT * FROM groups');
        const activities = await db.asyncAll('SELECT * FROM study_activities');

        // Create sessions over the past week
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const group = groups[Math.floor(Math.random() * groups.length)];
            const activity = activities[Math.floor(Math.random() * activities.length)];
            
            const session = await db.asyncRun(
                'INSERT INTO study_sessions (group_id, study_activity_id, created_at) VALUES (?, ?, ?)',
                [group.id, activity.id, date.toISOString()]
            );

            // Add reviews for this session
            const words = await db.asyncAll(
                'SELECT word_id FROM words_groups WHERE group_id = ?',
                [group.id]
            );

            for (const word of words) {
                const correct = Math.random() > 0.3; // 70% success rate
                await db.asyncRun(
                    'INSERT INTO word_review_items (word_id, study_session_id, correct) VALUES (?, ?, ?)',
                    [word.word_id, session.lastID, correct]
                );
            }
        }

        await db.asyncRun('COMMIT');
        console.log('Database seeded successfully');

        // Verify the data
        const counts = await Promise.all([
            db.asyncGet('SELECT COUNT(*) as count FROM words'),
            db.asyncGet('SELECT COUNT(*) as count FROM groups'),
            db.asyncGet('SELECT COUNT(*) as count FROM study_sessions'),
            db.asyncGet('SELECT COUNT(*) as count FROM study_activities'),
            db.asyncGet('SELECT COUNT(*) as count FROM word_review_items')
        ]);

        console.log('Verification:');
        console.log('- Words:', counts[0].count);
        console.log('- Groups:', counts[1].count);
        console.log('- Study Sessions:', counts[2].count);
        console.log('- Study Activities:', counts[3].count);
        console.log('- Word Reviews:', counts[4].count);

    } catch (err) {
        await db.asyncRun('ROLLBACK');
        console.error('Error seeding database:', err);
        throw err;
    } finally {
        await db.close();
    }
}

module.exports = seedDatabase;

if (require.main === module) {
    seedDatabase().catch(err => {
        console.error('Seeding failed:', err);
        process.exit(1);
    });
} 