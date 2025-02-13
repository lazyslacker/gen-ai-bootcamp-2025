CREATE TABLE IF NOT EXISTS words_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER,
    group_id INTEGER,
    FOREIGN KEY(word_id) REFERENCES words(id),
    FOREIGN KEY(group_id) REFERENCES groups(id)
); 