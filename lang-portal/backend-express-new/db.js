const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

class Database {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error connecting to database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database:', this.dbPath);
                    // Enable foreign keys after connection
                    this.db.run('PRAGMA foreign_keys = ON', (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            console.log('Foreign keys enabled');
                            resolve();
                        }
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
const dbPath = process.env.NODE_ENV === 'test' 
    ? path.join(__dirname, 'data', 'test.db')
    : path.join(__dirname, 'data', 'development.db');

const db = new Database(dbPath);

// Export a wrapper object that binds all methods to the database instance
module.exports = {
    connect: () => db.connect(),
    close: (...args) => db.close(...args),
    asyncRun: (...args) => db.asyncRun(...args),
    asyncGet: (...args) => db.asyncGet(...args),
    asyncAll: (...args) => db.asyncAll(...args)
};
