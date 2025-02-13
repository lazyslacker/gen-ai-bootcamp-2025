# Express.js Backend Implementation Plan for Language Learning Portal

This document provides a step-by-step plan to build the backend API using Express.js and SQLite3. Each step is atomic and includes checkboxes for tracking progress. Testing code snippets are included where applicable.

---

## 1. Project Setup

- [ ] **Initialize the Project**
  - [ ] Create a new project folder (e.g., `backend_express`).
  - [ ] Initialize a Git repository.
  - [ ] Run `npm init -y` to create a `package.json` file.

- [ ] **Install Dependencies**
  - [ ] Install Express: `npm install express`
  - [ ] Install SQLite3: `npm install sqlite3`
  - [ ] Install CORS middleware: `npm install cors`
  - [ ] (Optional) Install nodemon for development: `npm install --save-dev nodemon`
  - [ ] (Optional) Install testing libraries: `npm install --save-dev mocha chai supertest`

- [ ] **Setup Project Structure**
  - [ ] Create the following folder structure:

    ```
    backend_express/
    ├── migrations/        # SQL migration files
    ├── seeds/             # Seed JSON files
    ├── routes/            # Express route modules
    ├── tests/             # Automated test files
    ├── db.js              # Database connection module
    ├── server.js          # Main server file
    └── package.json
    ```

---

## 2. Database Setup

- [ ] **Create SQLite Database**
  - [ ] Create a file named `words.db` in the project root.

- [ ] **Write Migration Scripts**
  - [ ] In the `migrations/` folder, create SQL files to create tables. For example:
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

    - **0002_create_groups_table.sql**

      ```sql
      CREATE TABLE IF NOT EXISTS groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
      );
      ```

    - **0003_create_words_groups_table.sql**

      ```sql
      CREATE TABLE IF NOT EXISTS words_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word_id INTEGER,
          group_id INTEGER,
          FOREIGN KEY(word_id) REFERENCES words(id),
          FOREIGN KEY(group_id) REFERENCES groups(id)
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
          name TEXT NOT NULL,
          thumbnail_url TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

- [ ] **Create a Migration Runner Script**
  - [ ] Write a Node.js script (e.g., `migrate.js`) that reads and executes each migration file in order against `words.db`.
  - [ ] Verify the migrations run successfully.

- [ ] **Seed Data (Optional)**
  - [ ] Place seed JSON files in the `seeds/` folder.
  - [ ] Write a script (e.g., `seed.js`) to import JSON data into the database.

---

## 3. Express Server Setup

- [ ] **Create `server.js`**
  - [ ] Import required modules (express, cors, etc.).
  - [ ] Configure Express to use JSON parsing and CORS.
  - [ ] Set up the server to listen on a specific port.
  - [ ] Example:

    ```javascript
    const express = require('express');
    const cors = require('cors');
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(cors());
    app.use(express.json());

    // Import routes (to be created in the next steps)
    const wordsRouter = require('./routes/words');
    app.use('/api/words', wordsRouter);
    // Similarly, add other routers for groups, study_sessions, etc.

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    module.exports = app; // Export for testing purposes
    ```

- [ ] **Setup Database Connection in `db.js`**
  - [ ] Create a file `db.js` that handles SQLite3 connections.
  - [ ] Example:

    ```javascript
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./words.db', (err) => {
      if (err) {
        console.error('Error connecting to the database', err);
      } else {
        console.log('Connected to the SQLite database.');
      }
    });

    module.exports = db;
    ```

---

## 4. Implement API Endpoints

- [ ] **Organize Routes**
  - [ ] Create route modules inside the `routes/` folder (e.g., `words.js`, `groups.js`, `study_sessions.js`, `study_activities.js`).

- [ ] **Example: GET /api/words Endpoint**
  - [ ] Create a file `routes/words.js` and add:

    ```javascript
    const express = require('express');
    const router = express.Router();
    const db = require('../db');

    // GET /api/words - Retrieve paginated words list
    router.get('/', (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const itemsPerPage = 100;
      const offset = (page - 1) * itemsPerPage;

      // Query to fetch words with pagination
      db.all('SELECT * FROM words LIMIT ? OFFSET ?', [itemsPerPage, offset], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        // Optionally add total count logic via a separate query
        res.json({
          items: rows,
          pagination: {
            current_page: page,
            items_per_page: itemsPerPage
          }
        });
      });
    });

    module.exports = router;
    ```

  - [ ] Import and use this route in `server.js` as shown earlier.

- [ ] **Implement Additional Endpoints**
  - [ ] Follow similar patterns to implement endpoints for:
    - **Groups**
      - GET `/api/groups`
      - GET `/api/groups/:id`
      - GET `/api/groups/:id/words`
      - GET `/api/groups/:id/study_sessions`
    - **Study Sessions**
      - GET `/api/study_sessions`
      - GET `/api/study_sessions/:id`
      - GET `/api/study_sessions/:id/words`
      - POST `/api/study_sessions/:id/words/:word_id/review`
    - **Study Activities**
      - GET `/api/study_activities/:id`
      - GET `/api/study_activities/:id/study_sessions`
      - POST `/api/study_activities`
    - **Dashboard Endpoints**
      - GET `/api/dashboard/last_study_session`
      - GET `/api/dashboard/study_progress`
      - GET `/api/dashboard/quick-stats`
    - **System Endpoints**
      - POST `/api/reset_history`
      - POST `/api/full_reset`
  - [ ] Validate request parameters and use proper HTTP status codes.
  - [ ] Ensure every endpoint returns JSON.

---

## 5. Testing the API

- [ ] **Automated Testing Setup**
  - [ ] Create test files in the `tests/` folder (e.g., `tests/api.test.js`).

- [ ] **Example Test with Mocha/Chai and Supertest**
  - [ ] Create a file `tests/api.test.js` with:

    ```javascript
    const request = require('supertest');
    const app = require('../server'); // Ensure the path is correct

    describe('GET /api/words', () => {
      it('should return a paginated list of words', (done) => {
        request(app)
          .get('/api/words?page=1')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            // Assert that the response contains the expected properties
            const body = res.body;
            if (!body.items || typeof body.pagination !== 'object') {
              return done(new Error('Response structure is incorrect'));
            }
            done();
          });
      });
    });
    ```

  - [ ] Add a test script to `package.json`:

    ```json
    "scripts": {
      "test": "mocha"
    }
    ```

  - [ ] Run tests using `npm test`.

- [ ] **Manual Testing**
  - [ ] Use Postman or curl to manually test endpoints.
  - [ ] Example using curl:

    ```bash
    curl -X GET "http://localhost:3000/api/words?page=1"
    ```

---

## 6. Finalize and Document

- [ ] **Code Review & Cleanup**
  - [ ] Review all code for consistency and clarity.
  - [ ] Add comments where necessary.
  - [ ] Remove any debugging code or unused files.

- [ ] **Update Documentation**
  - [ ] Create or update a README file with instructions on:
    - How to run the server (`node server.js` or `npx nodemon server.js`)
    - How to run migrations and seed data.
    - How to execute tests.
    - A summary of the API endpoints and their usage.

- [ ] **Version Control**
  - [ ] Commit changes with clear commit messages.
  - [ ] Push commits to your remote repository.

---

By following this checklist, you will build the backend API using Express.js in a structured, incremental manner. Each step is designed to be simple and atomic, making it easier to track progress and debug issues along the way. Happy coding!
