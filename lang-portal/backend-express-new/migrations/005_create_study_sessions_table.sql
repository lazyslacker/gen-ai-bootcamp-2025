CREATE TABLE IF NOT EXISTS study_sessions (
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
END;