CREATE TABLE IF NOT EXISTS study_activities (
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
END;