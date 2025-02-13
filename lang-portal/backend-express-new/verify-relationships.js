const db = require('./db');

async function verifyRelationships() {
    try {
        // Check words in groups
        console.log('\nWords in Basic Greetings group:');
        const groupWords = await db.asyncAll(`
            SELECT w.japanese, w.english
            FROM words w
            JOIN words_groups wg ON w.id = wg.word_id
            JOIN groups g ON g.id = wg.group_id
            WHERE g.name = 'Basic Greetings'
        `);
        console.log(groupWords);

        // Check study session with reviews
        console.log('\nStudy session reviews:');
        const reviews = await db.asyncAll(`
            SELECT w.japanese, w.english, wri.correct
            FROM word_review_items wri
            JOIN words w ON w.id = wri.word_id
            JOIN study_sessions ss ON ss.id = wri.study_session_id
        `);
        console.log(reviews);

    } catch (err) {
        console.error('Error verifying relationships:', err);
    } finally {
        db.close();
    }
}

verifyRelationships(); 