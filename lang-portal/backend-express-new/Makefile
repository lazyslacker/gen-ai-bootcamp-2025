.PHONY: setup test dev start clean reset-db seed-db

# Setup project
setup:
	npm install
	mkdir -p data

# Run tests
test:
	NODE_ENV=test npm test

# Run development server
dev:
	npm run dev

# Start production server
start:
	npm start

# Clean up
clean:
	rm -rf data
	rm -f *.db

# Reset database
reset-db: clean
	node migrate.js

# Seed database with test data
seed-db:
	node seed.js 