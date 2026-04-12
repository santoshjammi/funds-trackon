#!/bin/bash
# Docker setup script for funds-trackon
# Checks prerequisites, builds all images, and starts the full stack.
#
# Usage:
#   ./docker_setup.sh              # build + start all
#   ./docker_setup.sh --backend    # rebuild + restart backend only
#   ./docker_setup.sh --frontend   # rebuild + restart frontend only
#   ./docker_setup.sh --build-only # build images, do not start
#   ./docker_setup.sh --no-cache   # force clean rebuild + start
#   ./docker_setup.sh --snapshot   # export live DB to archive, then exit

set -e

# Enable BuildKit for parallel layer resolution inside each Dockerfile,
# and COMPOSE_PARALLEL_LIMIT lets all services build concurrently.
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export COMPOSE_PARALLEL_LIMIT=10

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_ONLY=false
NO_CACHE=""
SNAPSHOT=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

for arg in "$@"; do
    [[ "$arg" == "--build-only" ]] && BUILD_ONLY=true
    [[ "$arg" == "--no-cache"   ]] && NO_CACHE="--no-cache"
    [[ "$arg" == "--snapshot"   ]] && SNAPSHOT=true
    [[ "$arg" == "--backend"    ]] && BACKEND_ONLY=true
    [[ "$arg" == "--frontend"   ]] && FRONTEND_ONLY=true
done

cd "$ROOT_DIR"

# ── Partial rebuild: backend only ────────────────────────────────────────────
if $BACKEND_ONLY; then
    echo "================================================"
    echo "   funds-trackon  —  Backend Rebuild"
    echo "================================================"
    # shellcheck disable=SC2086
    docker compose build $NO_CACHE backend --parallel
    docker compose up -d backend
    echo ""
    echo "Waiting for backend to become healthy..."
    set -o allexport; source "$ROOT_DIR/.env"; set +o allexport
    ATTEMPTS=0
    until curl -sf "http://localhost:${BACKEND_PORT:-8001}/health" &>/dev/null; do
        ATTEMPTS=$((ATTEMPTS + 1))
        [[ $ATTEMPTS -ge 20 ]] && echo "WARNING: Backend did not respond in 60s. Run: docker compose logs backend" && break
        sleep 3
    done
    echo ""
    echo "Backend updated:  http://localhost:${BACKEND_PORT:-8001}"
    echo "API docs:         http://localhost:${BACKEND_PORT:-8001}/docs"
    exit 0
fi

# ── Partial rebuild: frontend only ───────────────────────────────────────────
if $FRONTEND_ONLY; then
    echo "================================================"
    echo "   funds-trackon  —  Frontend Rebuild"
    echo "================================================"
    # shellcheck disable=SC2086
    docker compose build $NO_CACHE web
    docker compose up -d web
    set -o allexport; source "$ROOT_DIR/.env"; set +o allexport
    echo ""
    echo "Frontend updated: http://localhost:${FRONTEND_PORT:-3002}"
    exit 0
fi

# ── Snapshot mode ─────────────────────────────────────────────────────────────
if $SNAPSHOT; then
    ARCHIVE="$ROOT_DIR/mongo-init/trackon_lead_management.archive"
    echo "================================================"
    echo "   funds-trackon  —  DB Snapshot"
    echo "================================================"
    if ! docker exec niveshya-mongo mongosh --eval "db.adminCommand('ping')" --quiet &>/dev/null 2>&1; then
        echo "ERROR: niveshya-mongo is not running. Start the stack first:"
        echo "       ./docker_setup.sh"
        exit 1
    fi
    # Load DATABASE_NAME from .env
    set -o allexport; source "$ROOT_DIR/.env"; set +o allexport
    echo "Exporting '${DATABASE_NAME}' → mongo-init/trackon_lead_management.archive ..."
    docker exec niveshya-mongo mongodump \
        --db "${DATABASE_NAME}" \
        --archive 2>/dev/null | cat > "$ARCHIVE"
    SIZE=$(du -sh "$ARCHIVE" | cut -f1)
    echo "Done. Archive size: $SIZE"
    echo ""
    echo "Commit this file to keep the snapshot in sync:"
    echo "  git add mongo-init/trackon_lead_management.archive"
    echo "  git commit -m 'chore: refresh db snapshot'"
    exit 0
fi

echo "================================================"
echo "   funds-trackon  —  Docker Setup"
echo "================================================"
echo ""

# ── 1. Docker ─────────────────────────────────────────────────────────────────
echo "[1/4] Checking Docker..."
if ! command -v docker &>/dev/null; then
    echo "ERROR: docker not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi
if ! docker info &>/dev/null; then
    echo "ERROR: Docker daemon is not running. Start Docker Desktop and retry."
    exit 1
fi
echo "      Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# ── 2. Docker Compose ─────────────────────────────────────────────────────────
echo "[2/4] Checking Docker Compose..."
if ! docker compose version &>/dev/null; then
    echo "ERROR: 'docker compose' plugin not found. Update Docker Desktop."
    exit 1
fi
echo "      $(docker compose version)"

# ── 3. .env file ──────────────────────────────────────────────────────────────
echo "[3/4] Checking .env..."
if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "      .env not found — creating defaults..."
    cat > "$ROOT_DIR/.env" <<'EOF'
# Centralized port configuration for funds-trackon
# Change these and re-run `docker compose up -d --build`

FRONTEND_PORT=3002
BACKEND_PORT=8001
MONGO_PORT=27019

# CORS origins for backend as JSON array — mirrors FRONTEND_PORT above
CORS_ORIGINS=["http://localhost:3002","http://127.0.0.1:3002"]

# Database Configuration — change DATABASE_NAME here; MONGODB_URL stays host-only
DATABASE_NAME=trackon_lead_management
MONGODB_URL=mongodb://mongo:27017/${DATABASE_NAME}

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Environment
NODE_ENV=development
DEBUG=True
EOF
    echo "      .env created. Edit $ROOT_DIR/.env before running in production."
else
    echo "      .env exists."
    # Validate required keys are present
    MISSING=()
    for KEY in DATABASE_NAME MONGODB_URL FRONTEND_PORT BACKEND_PORT; do
        grep -q "^${KEY}=" "$ROOT_DIR/.env" || MISSING+=("$KEY")
    done
    if [ ${#MISSING[@]} -gt 0 ]; then
        echo "WARNING: Missing keys in .env: ${MISSING[*]}"
    fi
fi

# Source .env so we can echo resolved values below
set -o allexport
# shellcheck disable=SC1090,SC1091
source "$ROOT_DIR/.env"
set +o allexport

# ── 4. Build (parallel) ──────────────────────────────────────────────────────
echo "[4/4] Building Docker images in parallel..."
echo ""
# Fork both service builds simultaneously so they run concurrently.
# shellcheck disable=SC2086
docker compose build $NO_CACHE backend &
BACKEND_BUILD_PID=$!
# shellcheck disable=SC2086
docker compose build $NO_CACHE web &
WEB_BUILD_PID=$!

BACKEND_EXIT=0; wait $BACKEND_BUILD_PID || BACKEND_EXIT=$?
WEB_EXIT=0;     wait $WEB_BUILD_PID     || WEB_EXIT=$?

[[ $BACKEND_EXIT -ne 0 ]] && { echo "ERROR: Backend build failed (exit $BACKEND_EXIT)."; exit $BACKEND_EXIT; }
[[ $WEB_EXIT     -ne 0 ]] && { echo "ERROR: Frontend build failed (exit $WEB_EXIT).";  exit $WEB_EXIT;  }
echo ""
echo "All images built successfully."

# ── Start ─────────────────────────────────────────────────────────────────────
if $BUILD_ONLY; then
    echo ""
    echo "================================================"
    echo "   Build complete (--build-only mode)."
    echo "   Start the stack with: docker compose up -d"
    echo "================================================"
    exit 0
fi

echo ""
echo "Starting containers..."
docker compose up -d

echo ""
echo "Waiting for services to become healthy..."
# Poll the backend health endpoint (up to 90 s)
ATTEMPTS=0
until curl -sf "http://localhost:${BACKEND_PORT:-8001}/health" &>/dev/null; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -ge 30 ]; then
        echo "WARNING: Backend did not respond within 90 s. Check logs:"
        echo "         docker compose logs backend"
        break
    fi
    sleep 3
done

echo ""
echo "================================================"
echo "   Stack is up!"
echo ""
echo "   Frontend : http://localhost:${FRONTEND_PORT:-3002}"
echo "   Backend  : http://localhost:${BACKEND_PORT:-8001}"
echo "   API Docs : http://localhost:${BACKEND_PORT:-8001}/docs"
echo "   MongoDB  : localhost:${MONGO_PORT:-27019}"
echo "   Database : ${DATABASE_NAME}"
echo ""
echo "   Useful commands:"
echo "     docker compose logs -f           # tail all logs"
echo "     docker compose logs backend -f   # backend only"
echo "     docker compose down              # stop everything"
echo "     ./docker_setup.sh --no-cache     # clean rebuild"
echo "================================================"
