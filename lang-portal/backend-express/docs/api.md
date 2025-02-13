# Language Learning API Documentation

## Base URL

`http://localhost:3000/api`

## Authentication

Currently no authentication required.

## Endpoints

### Words

#### GET /words

Get a paginated list of words.

Query Parameters:

- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 100)

Example:

```bash
curl "http://localhost:3000/api/words?page=1&per_page=10"
```

Response:

```json
{
    "items": [
        {
            "id": 1,
            "japanese": "こんにちは",
            "romaji": "konnichiwa",
            "english": "hello",
            "parts": ["greeting", "formal"]
        }
    ],
    "pagination": {
        "current_page": 1,
        "per_page": 100,
        "total_pages": 1,
        "total_items": 7
    }
}
```

### Groups

#### GET /groups

Get all word groups.

Example:

```bash
curl http://localhost:3000/api/groups
```

Response:

```json
{
    "items": [
        {
            "id": 1,
            "name": "Basic Greetings"
        }
    ]
}
```

#### GET /groups/:id

Get a specific group by ID.

Example:

```bash
curl http://localhost:3000/api/groups/1
```

Response:

```json
{
    "id": 1,
    "name": "Basic Greetings"
}
```

#### GET /groups/:id/words

Get all words in a specific group.

Example:

```bash
curl http://localhost:3000/api/groups/1/words
```

Response:

```json
{
    "items": [
        {
            "id": 1,
            "japanese": "こんにちは",
            "romaji": "konnichiwa",
            "english": "hello",
            "parts": ["greeting", "formal"]
        }
    ]
}
```

#### GET /groups/:id/study_sessions

Get paginated study sessions for a group.

Example:

```bash
curl "http://localhost:3000/api/groups/1/study_sessions?page=1&per_page=10"
```

Response:

```json
{
    "items": [
        {
            "id": 1,
            "group_id": 1,
            "group_name": "Basic Greetings",
            "activity_id": 1,
            "activity_name": "Typing Tutor",
            "start_time": "2024-02-13T01:50:33.000Z",
            "end_time": "2024-02-13T01:50:33.000Z",
            "review_items_count": 5
        }
    ],
    "total": 1,
    "page": 1,
    "per_page": 10,
    "total_pages": 1
}
```

### Study Sessions

#### POST /study_sessions

Create a new study session.

Example:

```bash
curl -X POST http://localhost:3000/api/study_sessions \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": 1,
    "study_activity_id": 1
  }'
```

Response:

```json
{
    "id": 1,
    "group_id": 1,
    "group_name": "Basic Greetings",
    "activity_id": 1,
    "activity_name": "Typing Tutor",
    "created_at": "2024-02-13T01:50:33.000Z"
}
```

#### POST /study_sessions/:id/words/:word_id/review

Record a word review in a study session.

Example:

```bash
curl -X POST http://localhost:3000/api/study_sessions/1/words/1/review \
  -H "Content-Type: application/json" \
  -d '{
    "correct": true
  }'
```

Response:

```json
{
    "success": true,
    "word_id": 1,
    "study_session_id": 1,
    "correct": true,
    "created_at": "2024-02-13T01:51:15.586Z"
}
```

### Dashboard

#### GET /dashboard/last_study_session

Get the most recent study session.

Example:

```bash
curl http://localhost:3000/api/dashboard/last_study_session
```

Response:

```json
{
    "session": {
        "id": 1,
        "group_id": 1,
        "group_name": "Basic Greetings",
        "activity_id": 1,
        "activity_name": "Typing Tutor",
        "start_time": "2024-02-13T01:50:33.000Z",
        "end_time": "2024-02-13T01:50:33.000Z",
        "review_items_count": 5
    }
}
```

#### GET /dashboard/study_progress

Get study progress for all groups.

Example:

```bash
curl http://localhost:3000/api/dashboard/study_progress
```

Response:

```json
{
    "items": [
        {
            "group_id": 1,
            "group_name": "Basic Greetings",
            "total_words": 3,
            "mastered_words": 1,
            "progress_percentage": 33
        }
    ]
}
```

#### GET /dashboard/quick-stats

Get overall study statistics.

Example:

```bash
curl http://localhost:3000/api/dashboard/quick-stats
```

Response:

```json
{
    "total_sessions": 1,
    "total_reviews": 5,
    "accuracy_percentage": 80,
    "total_words": 7
}
```

### System

#### POST /reset_history

Reset all study history (sessions and reviews).

Example:

```bash
curl -X POST http://localhost:3000/api/reset_history
```

Response:

```json
{
    "message": "Study history cleared successfully"
}
```

#### POST /full_reset

Reset entire database (all data).

Example:

```bash
curl -X POST http://localhost:3000/api/full_reset
```

Response:

```json
{
    "message": "Database reset successfully"
}
```

## Error Responses

All endpoints may return the following error response:

```json
{
    "error": "Error message here"
}
```

Common HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error
