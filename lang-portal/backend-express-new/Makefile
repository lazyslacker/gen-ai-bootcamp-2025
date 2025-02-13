.PHONY: setup test dev start clean reset-db seed-db init-dev-db

# Setup project
setup:
	npm install
	mkdir -p data
	npm run init-dev-db

# Run tests
test:
	NODE_ENV=test npm test

# Run development server
dev:
	NODE_ENV=development npm run dev

# Start production server
start:
	NODE_ENV=production npm start

# Clean up
clean:
	rm -rf data
	rm -f *.db

# Reset database
reset-db: clean
	NODE_ENV=development node migrate.js

# Seed database with test data
seed-db:
	NODE_ENV=development node seed.js

# Initialize development database
init-dev-db:
	NODE_ENV=development node scripts/init-dev-db.js 