# Language Learning Portal Backend

A RESTful API backend for the Language Learning Portal, built with Express.js and SQLite.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd backend-express-new
```

2. Install dependencies:

```bash
npm run setup
```

3. Initialize database:

```bash
npm run reset-db
npm run seed-db
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The server will be running at <http://localhost:3000>

## Testing

Run the test suite:

```bash
npm test
```

## Deployment

### Option 1: Traditional Server

1. Prepare the server:

```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

2. Deploy the application:

```bash
# Clone and setup
git clone <repository-url>
cd backend-express-new
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit environment variables

# Initialize database
npm run reset-db
npm run seed-db

# Start with PM2
pm2 start server.js --name "lang-portal-api"
pm2 save
```

3. Setup Nginx reverse proxy:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Docker Deployment

1. Build the Docker image:

```bash
docker build -t lang-portal-api .
```

2. Run the container:

```bash
docker run -d \
    --name lang-portal-api \
    -p 3000:3000 \
    -v $(pwd)/data:/app/data \
    lang-portal-api
```

### Option 3: Cloud Platform (e.g., Heroku)

1. Install Heroku CLI:

```bash
npm install -g heroku
```

2. Deploy to Heroku:

```bash
heroku create lang-portal-api
git push heroku main

# Setup database
heroku run npm run reset-db
heroku run npm run seed-db
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_PATH=./data/words.db

# Security
CORS_ORIGIN=https://yourdomain.com
```

## Production Considerations

1. Security:
   - Enable HTTPS
   - Set secure CORS policy
   - Implement rate limiting
   - Add authentication/authorization

2. Monitoring:
   - Setup application monitoring (e.g., PM2, New Relic)
   - Configure error tracking (e.g., Sentry)
   - Setup log management

3. Backup:
   - Schedule regular database backups
   - Setup backup rotation policy

4. Performance:
   - Enable compression
   - Setup caching
   - Configure proper connection pooling

## Troubleshooting

Common issues and solutions:

1. Database connection errors:
   - Check if data directory exists and is writable
   - Verify SQLite installation
   - Check file permissions

2. Port conflicts:
   - Change PORT in .env file
   - Check for other services using port 3000

3. Permission issues:
   - Ensure proper file ownership
   - Check directory permissions
   - Verify process user permissions

## API Endpoints

### Groups

- GET `/api/groups` - List all groups (paginated)
- GET `/api/groups/:id` - Get a specific group
- GET `/api/groups/:id/words` - Get words in a group

### Words

- GET `/api/words` - List all words (paginated)
- GET `/api/words/:id` - Get a specific word with its groups

### Study Sessions

- GET `/api/study-sessions/:id` - Get a study session
- POST `/api/study-sessions/:id/words/:word_id/review` - Record a word review

### Dashboard

- GET `/api/dashboard/last_study_session` - Get the last study session
- GET `/api/dashboard/study_progress` - Get study progress statistics

### System

- GET `/api/system/health` - Check system health
- GET `/api/system/stats` - Get system statistics
- POST `/api/reset_history` - Clear study history
- POST `/api/full_reset` - Reset all data
- POST `/api/system/vacuum` - Optimize database

## Database Schema

The application uses SQLite with the following tables:

- `words` - Japanese vocabulary
- `groups` - Word groupings
- `words_groups` - Word-group relationships
- `study_sessions` - Study session records
- `study_activities` - Available study activities
- `word_review_items` - Word review history

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with test data
- `npm run clean` - Clean up data files
- `npm run reset-db` - Reset database to initial state
- `npm run seed-db` - Seed database after reset

## License

ISC
