const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
    }

    connect() {
        const DATA_DIR = path.join(__dirname, 'data');
        const dbPath = process.env.NODE_ENV === 'test' 
            ? path.join(DATA_DIR, 'test.db')
            : path.join(DATA_DIR, 'words.db');

        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error connecting to SQLite database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database:', dbPath);
                    // Enable foreign keys
                    this.db.run('PRAGMA foreign_keys = ON', (err) => {
                        if (!err) console.log('Foreign keys enabled');
                        resolve(this);
                    });
                }
            });
        });
    }

    close(callback) {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    this.db = null;
                    if (err) reject(err);
                    else resolve();
                    if (callback) callback(err);
                });
            } else {
                resolve();
                if (callback) callback();
            }
        });
    }

    asyncRun(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }

    asyncGet(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    asyncAll(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Create database instance
const database = new Database();

// Export a wrapper object that binds all methods to the database instance
module.exports = {
    connect: () => database.connect(),
    close: (...args) => database.close(...args),
    asyncRun: (...args) => database.asyncRun(...args),
    asyncGet: (...args) => database.asyncGet(...args),
    asyncAll: (...args) => database.asyncAll(...args)
};
