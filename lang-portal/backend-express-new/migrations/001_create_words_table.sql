CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kanji TEXT NOT NULL,
    romaji TEXT NOT NULL,
    english TEXT NOT NULL,
    parts JSON NOT NULL
);