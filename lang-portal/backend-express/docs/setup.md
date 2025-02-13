# Setup and Deployment Guide

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- SQLite3

## Local Development Setup

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd backend-express
npm install
```

2. Initialize the database:

```bash
# Run migrations to create database schema
npm run migrate

# Seed the database with initial data
npm run seed
```

3. Start the development server:

```bash
npm run dev
```

The server will start on <http://localhost:3000> with auto-reload enabled.

## Testing

1. Run the test suite:

```bash
npm test
```

This will:

- Create a test database
- Run migrations
- Insert test data
- Run all tests
- Clean up test database

## Production Deployment

1. Set environment variables:

```bash
# Server configuration
PORT=3000
NODE_ENV=production

# Database configuration
DB_PATH=./words.db
```

2. Build and start the server:

```bash
npm install --production
npm run migrate
npm run seed
npm start
```

## Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start development server with auto-reload
- `npm test`: Run test suite
- `npm run migrate`: Run database migrations
- `npm run seed`: Seed database with initial data

## Project Structure

```
backend-express/
├── docs/              # Documentation
├── migrations/        # Database migrations
├── routes/           # API route handlers
├── seeds/            # Seed data
├── tests/            # Test files
├── db.js             # Database connection
├── migrate.js        # Migration runner
├── seed.js           # Seed runner
└── server.js         # Main application
```

## Database Management

### Migrations

Database schema changes are managed through migration files in the `migrations/` directory.

To create a new migration:

1. Add a new SQL file in `migrations/`
2. Name it with timestamp prefix (e.g., `001_create_tables.sql`)
3. Run `npm run migrate`

### Seed Data

Initial data is managed through JSON files in the `seeds/` directory:

- `words.json`: Japanese vocabulary
- `groups.json`: Word categories
- `words_groups.json`: Word-group relationships
- `study_activities.json`: Available study activities

## Troubleshooting

### Database Issues

1. Delete the database file:

```bash
rm words.db
```

2. Recreate from scratch:

```bash
npm run migrate
npm run seed
```

### Server Won't Start

1. Check port availability:

```bash
lsof -i :3000
```

2. Kill existing process if needed:

```bash
kill -9 <PID>
```

### Test Database Issues

1. Clean test database:

```bash
rm test.db
```

2. Tests will recreate it automatically when run
