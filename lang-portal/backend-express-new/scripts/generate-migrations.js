const fs = require('fs').promises;
const path = require('path');

const migrations = [
    {
        name: '001_create_words_table',
        content: `CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kanji TEXT NOT NULL,
    romaji TEXT NOT NULL,
    english TEXT NOT NULL,
    parts JSON NOT NULL
);`
    },
    {
        name: '002_create_groups_table',
        content: `CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);`
    },
    {
        name: '003_create_words_groups_table',
        content: `CREATE TABLE IF NOT EXISTS words_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER,
    group_id INTEGER,
    FOREIGN KEY(word_id) REFERENCES words(id),
    FOREIGN KEY(group_id) REFERENCES groups(id)
);`
    },
    {
        name: '004_create_study_activities_table',
        content: `CREATE TABLE IF NOT EXISTS study_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    launch_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_study_activities_timestamp 
AFTER UPDATE ON study_activities
BEGIN
    UPDATE study_activities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;`
    },
    {
        name: '005_create_study_sessions_table',
        content: `CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    study_activity_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (study_activity_id) REFERENCES study_activities(id)
);

CREATE TRIGGER IF NOT EXISTS update_study_sessions_timestamp 
AFTER UPDATE ON study_sessions
BEGIN
    UPDATE study_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;`
    },
    {
        name: '006_create_word_review_items_table',
        content: `CREATE TABLE IF NOT EXISTS word_review_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER,
    study_session_id INTEGER,
    correct BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(word_id) REFERENCES words(id),
    FOREIGN KEY(study_session_id) REFERENCES study_sessions(id)
);`
    }
];

async function generateMigrations() {
    const migrationsDir = path.join(__dirname, '..', 'migrations');

    // Create migrations directory if it doesn't exist
    await fs.mkdir(migrationsDir, { recursive: true });

    // Generate migration files
    for (const migration of migrations) {
        const filePath = path.join(migrationsDir, `${migration.name}.sql`);
        await fs.writeFile(filePath, migration.content);
        console.log(`Generated migration: ${migration.name}.sql`);
    }
}

if (require.main === module) {
    generateMigrations().catch(console.error);
}

module.exports = generateMigrations; 