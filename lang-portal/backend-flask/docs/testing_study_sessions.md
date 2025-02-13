# Manual Testing Guide for Study Sessions API

## Prerequisites

- Flask server running on localhost:5000
- SQLite database initialized with sample data
- A tool like Postman, curl, or httpie installed

## Test Cases

### 1. Create Study Session (Success Case)

```bash
curl -X POST http://localhost:5000/api/study-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": 1,
    "study_activity_id": 1
  }'
```

Expected Response (201 Created):

```json
{
  "id": 1,
  "group_id": 1,
  "group_name": "Basic Greetings",
  "activity_id": 1,
  "activity_name": "Typing Tutor",
  "created_at": "2024-03-14T12:00:00Z"
}
```

### 2. Invalid JSON Payload

```bash
curl -X POST http://localhost:5000/api/study-sessions \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

Expected Response (400 Bad Request):

```json
{
  "error": "Invalid JSON payload"
}
```

### 3. Missing Required Fields

```bash
curl -X POST http://localhost:5000/api/study-sessions \
  -H "Content-Type: application/json" \
  -d '{"group_id": 1}'
```

Expected Response (400 Bad Request):

```json
{
  "error": "Missing required fields",
  "required": ["group_id", "study_activity_id"]
}
```

### 4. Non-existent Group

```bash
curl -X POST http://localhost:5000/api/study-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": 99999,
    "study_activity_id": 1
  }'
```

Expected Response (404 Not Found):

```json
{
  "error": "Group not found",
  "group_id": 99999
}
```

### 5. Create Word Review (Success Case)

```bash
curl -X POST http://localhost:5000/api/study_sessions/1/words/1/review \
  -H "Content-Type: application/json" \
  -d '{
    "correct": true
  }'
```

Expected Response (201 Created):

```json
{
  "success": true,
  "word_id": 1,
  "study_session_id": 1,
  "correct": true,
  "created_at": "2024-03-14T12:00:00Z"
}
```

### 6. Invalid Word Review

```bash
curl -X POST http://localhost:5000/api/study_sessions/1/words/99999/review \
  -H "Content-Type: application/json" \
  -d '{
    "correct": true
  }'
```

Expected Response (404 Not Found):

```json
{
  "error": "Word not found or not in session group",
  "word_id": 99999,
  "group_id": 1
}
```

### 7. Missing Correct Field

```bash
curl -X POST http://localhost:5000/api/study_sessions/1/words/1/review \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected Response (400 Bad Request):

```json
{
  "error": "Missing required field",
  "required": ["correct"]
}
```

## Verification Steps

1. Check database after successful creation
2. Verify response format matches API specification
3. Confirm error messages are clear and helpful
4. Test CORS headers are present in responses

## Verification Steps for Word Reviews

1. Check database after successful review:

   ```sql
   sqlite3 words.db
   > SELECT * FROM word_review_items WHERE word_id = 1 ORDER BY created_at DESC LIMIT 1;
   ```

2. Verify response format matches API specification
3. Confirm error messages are clear and helpful
4. Test CORS headers are present in responses
