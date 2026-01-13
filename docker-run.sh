#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect which docker compose command is available
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}Error: docker compose or docker-compose not found.${NC}"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down containers...${NC}"
    $DOCKER_COMPOSE down
    echo -e "${GREEN}Containers stopped successfully.${NC}"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Check if ports are already in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${RED}Error: Port $1 is already in use.${NC}"
        return 1
    fi
    return 0
}

# Check required ports (5433 for postgres to avoid conflict with local)
if ! check_port 3000 || ! check_port 8000 || ! check_port 5433; then
    echo -e "${YELLOW}Please stop the processes using these ports or modify docker-compose.yml.${NC}"
    exit 1
fi

echo -e "${GREEN}Starting StudyBudd application with Docker...${NC}"
echo -e "${YELLOW}Services:${NC}"
echo -e "  - Frontend (Next.js):  http://localhost:3000"
echo -e "  - Backend (FastAPI):   http://localhost:8000"
echo -e "  - Database (Postgres): localhost:5433"
echo -e "${YELLOW}Press Ctrl+C to stop all containers${NC}\n"

# Start docker compose in the foreground
$DOCKER_COMPOSE up --build

# If docker compose exits for any reason, run cleanup
cleanup
