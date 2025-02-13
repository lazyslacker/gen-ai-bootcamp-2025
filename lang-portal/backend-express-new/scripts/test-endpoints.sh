#!/bin/bash

# Base URL
API_URL="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Testing Language Learning Portal API Endpoints..."
echo "==============================================="

# 1. Dashboard - Last Study Session
echo -e "\n${GREEN}Testing GET /api/dashboard/last_study_session${NC}"
curl -s "$API_URL/dashboard/last_study_session" | json_pp

# 2. Dashboard - Study Progress
echo -e "\n${GREEN}Testing GET /api/dashboard/study_progress${NC}"
curl -s "$API_URL/dashboard/study_progress" | json_pp

# 3. Dashboard - Quick Stats
echo -e "\n${GREEN}Testing GET /api/dashboard/quick-stats${NC}"
curl -s "$API_URL/dashboard/quick-stats" | json_pp

# 4. Create Study Session
echo -e "\n${GREEN}Testing POST /api/study-sessions${NC}"
curl -s -X POST "$API_URL/study-sessions" \
  -H "Content-Type: application/json" \
  -d '{"group_id": 1, "study_activity_id": 1}' | json_pp

# Get the created session ID for next tests
SESSION_ID=$(curl -s "$API_URL/dashboard/last_study_session" | jq -r '.id')

# 5. Record Word Review
echo -e "\n${GREEN}Testing POST /api/study_sessions/$SESSION_ID/words/1/review${NC}"
curl -s -X POST "$API_URL/study_sessions/$SESSION_ID/words/1/review" \
  -H "Content-Type: application/json" \
  -d '{"correct": true}' | json_pp

# 6. Get Groups
echo -e "\n${GREEN}Testing GET /api/groups${NC}"
curl -s "$API_URL/groups" | json_pp

# 7. Get Words in Group
echo -e "\n${GREEN}Testing GET /api/groups/1/words${NC}"
curl -s "$API_URL/groups/1/words" | json_pp

# 8. Get Study Activities
echo -e "\n${GREEN}Testing GET /api/study-activities${NC}"
curl -s "$API_URL/study-activities" | json_pp

# 9. Reset History
echo -e "\n${GREEN}Testing POST /api/reset_history${NC}"
curl -s -X POST "$API_URL/reset_history" \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}' | json_pp

# 10. Full Reset (commented out to prevent accidental data loss)
# echo -e "\n${GREEN}Testing POST /api/full_reset${NC}"
# curl -s -X POST "$API_URL/full_reset" \
#   -H "Content-Type: application/json" \
#   -d '{"confirm": true}' | json_pp

echo -e "\n${GREEN}API Testing Complete!${NC}" 