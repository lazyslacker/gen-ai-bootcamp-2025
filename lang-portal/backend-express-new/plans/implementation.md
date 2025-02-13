# Express.js Backend Implementation Plan for Language Learning Portal

This document outlines an atomic, step-by-step plan to build the backend API using Express.js and SQLite3. Each task is broken down into small steps with checkboxes. Testing code examples are included.

---

## 1. Project Setup

- [ ] **Initialize the Project**
  - [ ] Create a new project folder (e.g., `backend_express-new`).
  - [ ] Initialize a Git repository.
  - [ ] Run `npm init -y` to generate a `package.json` file.

- [ ] **Install Dependencies**
  - [ ] Install Express:  

    ```bash
    npm install express
    ```

  - [ ] Install SQLite3:  

    ```bash
    npm install sqlite3
    ```

  - [ ] Install CORS middleware:  

    ```bash
    npm install cors
    ```

  - [ ] (Optional) Install nodemon for development:  

    ```bash
    npm install --save-dev nodemon
    ```

  - [ ] (Optional) Install testing libraries:  

    ```bash
    npm install --save-dev mocha chai supertest
    ```

- [ ] **Setup Project Structure**
  - Create the following folder structure:

    ```
    backend_express/
    ├── migrations/        # SQL migration files
    ├── seeds/             # JSON seed files
    ├── routes/            # Express route modules
    ├── tests/             # Automated test files
    ├── db.js              # Database connection module
    ├── server.js          # Main server file
    ├── migrate.js         # Migration runner script (optional)
    └── package.json
    ```

---

## 2. Database Setup

- [ ] **Create the SQLite Database**
  - [ ] Create a file named `words.db` in the project root.

- [ ] **Write Migration Scripts**  
  In the `migrations/` folder, create SQL files based on the schema:
  - **0001_create_words_table.sql**

    ```sql
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      japanese TEXT NOT NULL,
      romaji TEXT NOT NULL,
      english TEXT NOT NULL,
      parts JSON NOT NULL
    );
    ```

  - **0002_create_words_groups_table.sql**

    ```sql
    CREATE TABLE IF NOT EXISTS words_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER,
      group_id INTEGER,
      FOREIGN KEY(word_id) REFERENCES words(id),
      FOREIGN KEY(group_id) REFERENCES groups(id)
    );
    ```

  - **0003_create_groups_table.sql**

    ```sql
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
    ```

  - **0004_create_study_sessions_table.sql**

    ```sql
    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      study_activity_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(group_id) REFERENCES groups(id)
    );
    ```

  - **0005_create_study_activities_table.sql**

    ```sql
    CREATE TABLE IF NOT EXISTS study_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      study_session_id INTEGER,
      group_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      name TEXT,
      thumbnail_url TEXT,
      description TEXT
    );
    ```

  - **0006_create_word_review_items_table.sql**

    ```sql
    CREATE TABLE IF NOT EXISTS word_review_items (
      word_id INTEGER,
      study_session_id INTEGER,
      correct BOOLEAN NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(word_id) REFERENCES words(id),
      FOREIGN KEY(study_session_id) REFERENCES study_sessions(id)
    );
    ```

- [ ] **Create a Migration Runner Script (Optional)**
  - [ ] Create a file `migrate.js` that reads and executes each SQL file in order. For example:

    ```javascript
    const fs = require('fs');
    const path = require('path');
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./words.db');

    const migrationsDir = path.join(__dirname, 'migrations');

    fs.readdir(migrationsDir, (err, files) => {
      if (err) throw err;
      files.sort().forEach(file => {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        db.exec(sql, (err) => {
          if (err) {
            console.error(`Error executing ${file}:`, err);
          } else {
            console.log(`${file} executed successfully.`);
          }
        });
      });
    });
    ```

  - [ ] Run the migration script:  

    ```bash
    node migrate.js
    ```

- [ ] **Seed Data (Optional)**
  - [ ] Place your JSON seed files in the `seeds/` folder.
  - [ ] Write a script (e.g., `seed.js`) to import data from JSON files into the database.

---

## 3. Express Server Setup

- [ ] **Create the Main Server File (`server.js`)**
  - [ ] Import required modules (`express`, `cors`, etc.).
  - [ ] Set up middleware for JSON parsing and CORS.
  - [ ] Import and mount route modules.
  - [ ] Start the server.
  - **Example:**

    ```javascript
    const express = require('express');
    const cors = require('cors');
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(cors());
    app.use(express.json());

    // Import routes
    const wordsRouter = require('./routes/words');
    const groupsRouter = require('./routes/groups');
    const studySessionsRouter = require('./routes/study_sessions');
    const studyActivitiesRouter = require('./routes/study_activities');
    // ... import other route modules as needed

    // Mount routes
    app.use('/api/words', wordsRouter);
    app.use('/api/groups', groupsRouter);
    app.use('/api/study_sessions', studySessionsRouter);
    app.use('/api/study_activities', studyActivitiesRouter);

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    module.exports = app; // Export app for testing
    ```

- [ ] **Setup Database Connection (`db.js`)**
  - [ ] Create a file `db.js` to handle SQLite3 connection.
  - **Example:**

    ```javascript
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./words.db', (err) => {
      if (err) {
        console.error('Error connecting to the database:', err);
      } else {
        console.log('Connected to the SQLite database.');
      }
    });

    module.exports = db;
    ```

---

## 4. API Endpoints Implementation

Implement endpoints according to the technical specs. Organize endpoints in separate route files under the `routes/` folder.

- [ ] **Implement Dashboard Endpoints**
  - [ ] Create a file `routes/dashboard.js` and implement:
    - GET `/api/dashboard/last_study_session`
    - GET `/api/dashboard/study_progress`
    - GET `/api/dashboard/quick-stats`
  - [ ] Example for GET `/api/dashboard/last_study_session`:

    ```javascript
    const express = require('express');
    const router = express.Router();
    const db = require('../db');

    router.get('/last_study_session', (req, res) => {
      const sql = `
        SELECT ss.id, ss.group_id, ss.created_at, ss.study_activity_id, g.name AS group_name
        FROM study_sessions ss
        JOIN groups g ON ss.group_id = g.id
        ORDER BY ss.created_at DESC
        LIMIT 1
      `;
      db.get(sql, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    });

    module.exports = router;
    ```

  - [ ] Mount this router in `server.js` under `/api/dashboard`.

- [ ] **Implement Study Activities Endpoints**
  - [ ] Create `routes/study_activities.js` for:
    - GET `/api/study_activities/:id`
    - GET `/api/study_activities/:id/study_sessions` (with pagination)
    - POST `/api/study_activities` (for creating a study session)
  - [ ] Validate parameters and return JSON responses.

- [ ] **Implement Words Endpoints**
  - [ ] Create `routes/words.js` for:
    - GET `/api/words` (with pagination)
    - GET `/api/words/:id`
  - [ ] Implement SQL queries to include review statistics if required.

- [ ] **Implement Groups Endpoints**
  - [ ] Create `routes/groups.js` for:
    - GET `/api/groups` (with pagination)
    - GET `/api/groups/:id`
    - GET `/api/groups/:id/words`
    - GET `/api/groups/:id/study_sessions`
  - [ ] Validate parameters and structure responses as per the spec.

- [ ] **Implement Study Sessions Endpoints**
  - [ ] Create `routes/study_sessions.js` for:
    - GET `/api/study_sessions` (with pagination)
    - GET `/api/study_sessions/:id`
    - GET `/api/study_sessions/:id/words`
    - POST `/api/study_sessions/:id/words/:word_id/review`
  - [ ] For the review endpoint, validate that `correct` is provided in the request body and insert a record into `word_review_items`.

- [ ] **Implement System Endpoints**
  - [ ] Create routes for:
    - POST `/api/reset_history`
    - POST `/api/full_reset`
  - [ ] These endpoints should clear or reset relevant tables in the database.

---

## 5. Testing the API

- [ ] **Setup Automated Testing**
  - [ ] Create test files under the `tests/` folder (e.g., `tests/api.test.js`).

- [ ] **Write a Sample Test with Mocha, Chai, and Supertest**
  - [ ] Create `tests/api.test.js`:

    ```javascript
    const request = require('supertest');
    const app = require('../server');
    const { expect } = require('chai');

    describe('GET /api/words', () => {
      it('should return a paginated list of words', (done) => {
        request(app)
          .get('/api/words?page=1')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const body = res.body;
            expect(body).to.have.property('items');
            expect(body).to.have.property('pagination');
            done();
          });
      });
    });
    ```

  - [ ] Add a test script to your `package.json`:

    ```json
    "scripts": {
      "test": "mocha"
    }
    ```

  - [ ] Run tests with:

    ```bash
    npm test
    ```

- [ ] **Manual Testing**
  - [ ] Use Postman or curl to test endpoints manually.
  - [ ] Example using curl:

    ```bash
    curl -X GET "http://localhost:3000/api/words?page=1"
    ```

---

## 6. Task Runner and Final Steps

- [ ] **Implement Task Runner Scripts**
  - [ ] Create scripts (or a Makefile) for:
    - **Initializing the Database:** Create an empty `words.db` file.
    - **Running Migrations:** Execute the migration runner (`node migrate.js`).
    - **Seeding Data:** Run your seed script if implemented.
  - [ ] Document these tasks in the README.

- [ ] **Code Review and Cleanup**
  - [ ] Review and comment your code for clarity.
  - [ ] Remove any unused files or debugging code.
  - [ ] Commit your changes with clear messages and push to your repository.

- [ ] **Update Documentation**
  - [ ] Create or update a README file with instructions on:
    - How to run the server (`node server.js` or `npx nodemon server.js`).
    - How to run migrations and seed data.
    - How to execute tests.
    - A summary of the API endpoints and their usage.

---

By following these atomic steps, you'll build the complete Express.js backend for the language learning portal. This plan covers project setup, database configuration, API endpoints implementation, and testing, ensuring a smooth development process. Happy coding!
