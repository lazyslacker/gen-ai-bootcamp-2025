# API Testing Guide

## Setup

1. Install test dependencies:

```bash
npm install --save-dev mocha chai supertest
```

2. Configure test environment:

```bash
export NODE_ENV=test
export DB_PATH=./test.db
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npx mocha tests/api.test.js
```

### Run Tests with Watch Mode

```bash
npx mocha --watch tests/**/*.test.js
```

## Test Structure

### Test Files

- `api.test.js`: Core API endpoint tests
- `groups.test.js`: Group-related endpoint tests
- `dashboard.test.js`: Dashboard endpoint tests
- `system.test.js`: System operation tests

### Example Test Case

```javascript
const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('API Endpoint', () => {
    it('should return expected data', async () => {
        const res = await request(app)
            .get('/api/endpoint')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).to.have.property('items');
    });
});
```

## Testing Endpoints

### GET Requests

```javascript
// Basic GET request
const res = await request(app)
    .get('/api/words')
    .expect(200);

// GET with query parameters
const res = await request(app)
    .get('/api/words')
    .query({ page: 1, per_page: 10 })
    .expect(200);
```

### POST Requests

```javascript
// Create new study session
const res = await request(app)
    .post('/api/study_sessions')
    .send({
        group_id: 1,
        study_activity_id: 1
    })
    .expect(201);
```

### Testing Pagination

```javascript
it('should return paginated results', async () => {
    const res = await request(app)
        .get('/api/words')
        .query({ page: 1, per_page: 2 });

    expect(res.body.pagination).to.deep.include({
        current_page: 1,
        per_page: 2
    });
    expect(res.body.items).to.have.lengthOf(2);
});
```

### Testing Error Cases

```javascript
it('should handle invalid input', async () => {
    const res = await request(app)
        .post('/api/study_sessions')
        .send({})
        .expect(400);

    expect(res.body).to.have.property('error');
});
```

## Database Testing

### Test Data Setup

```javascript
before(async () => {
    // Insert test data
    await db.asyncRun(`
        INSERT INTO groups (id, name) VALUES
        (1, 'Test Group')
    `);
});
```

### Cleanup

```javascript
after(async () => {
    // Clean up test data
    await db.asyncRun('DELETE FROM word_review_items');
    await db.asyncRun('DELETE FROM study_sessions');
});
```

## Common Assertions

### Response Structure

```javascript
expect(res.body).to.have.property('items');
expect(res.body.items).to.be.an('array');
```

### Data Validation

```javascript
const word = res.body.items[0];
expect(word).to.have.property('japanese');
expect(word).to.have.property('romaji');
expect(word).to.have.property('english');
```

### Error Responses

```javascript
expect(res.body).to.have.property('error');
expect(res.status).to.equal(400);
```

## Test Coverage

### Important Test Cases

1. Valid input scenarios
2. Invalid input handling
3. Edge cases (empty results, maximum values)
4. Error conditions
5. Database constraints

### Example Test Suite

```javascript
describe('Study Sessions', () => {
    it('should create new session');
    it('should reject invalid group_id');
    it('should reject invalid activity_id');
    it('should handle concurrent requests');
    it('should maintain referential integrity');
});
```

## Troubleshooting Tests

### Common Issues

1. Database Connection

```javascript
// Verify database connection
before(async () => {
    try {
        await db.asyncGet('SELECT 1');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
});
```

2. Async Test Timeouts

```javascript
// Increase timeout for slow tests
it('should handle large datasets', async function() {
    this.timeout(5000);
    // Test code...
});
```

3. Test Data State

```javascript
// Reset database before each test
beforeEach(async () => {
    await db.asyncRun('DELETE FROM word_review_items');
    await db.asyncRun('DELETE FROM study_sessions');
});
```

### Debug Tips

1. Use console.log in tests
2. Check test database content
3. Verify test environment variables
4. Run single test file for focused debugging
