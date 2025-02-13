const db = require('./db');

async function verifyDatabase() {
    try {
        // Get all tables
        const tables = await db.asyncAll(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);
        
        console.log('Created tables:', tables.map(t => t.name));

        // Verify foreign keys are enabled
        const fk = await db.asyncGet('PRAGMA foreign_keys');
        console.log('Foreign keys enabled:', fk.foreign_keys === 1);

    } catch (err) {
        console.error('Error verifying database:', err);
    } finally {
        db.close();
    }
}

verifyDatabase(); 