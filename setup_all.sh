#!/bin/bash
# Combined setup and start script for funds-trackon
# Sets up and starts both the backend (FastAPI) and frontend (React)
#
# Usage:
#   ./setup_all.sh             → setup + start both
#   ./setup_all.sh --setup-only → install prereqs only, do not start servers

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
SETUP_ONLY=false

for arg in "$@"; do
    [[ "$arg" == "--setup-only" ]] && SETUP_ONLY=true
done

echo "================================================"
echo "   funds-trackon Full Stack Setup"
echo "================================================"
echo ""

# ════════════════════════════════════════════════════
#  SYSTEM PREREQS
# ════════════════════════════════════════════════════
echo "── Checking system prerequisites ──────────────"

# Python 3
echo "[prereq] Python 3..."
if ! command -v python3 &>/dev/null; then
    echo "ERROR: python3 not found. Install from https://python.org or: brew install python"
    exit 1
fi
echo "         $(python3 --version)"

# pip
echo "[prereq] pip..."
if ! python3 -m pip --version &>/dev/null; then
    echo "ERROR: pip not found. Run: python3 -m ensurepip --upgrade"
    exit 1
fi
echo "         $(python3 -m pip --version)"

# Node.js
echo "[prereq] Node.js..."
if ! command -v node &>/dev/null; then
    echo "ERROR: node not found. Install from https://nodejs.org or: brew install node"
    exit 1
fi
echo "         $(node --version)"

# npm
echo "[prereq] npm..."
if ! command -v npm &>/dev/null; then
    echo "ERROR: npm not found. It usually ships with Node.js."
    exit 1
fi
echo "         npm $(npm --version)"

# MongoDB
echo "[prereq] MongoDB..."
MONGO_RUNNING=false
if command -v mongosh &>/dev/null && mongosh --eval "db.runCommand({ping:1})" --quiet &>/dev/null 2>&1; then
    MONGO_RUNNING=true
elif command -v mongo &>/dev/null && mongo --eval "db.runCommand({ping:1})" --quiet &>/dev/null 2>&1; then
    MONGO_RUNNING=true
fi

if $MONGO_RUNNING; then
    echo "         MongoDB is already running."
elif command -v mongod &>/dev/null; then
    echo "         MongoDB found but not running. Attempting start via Homebrew..."
    if command -v brew &>/dev/null; then
        brew services start mongodb-community 2>/dev/null \
            || brew services start mongodb/brew/mongodb-community 2>/dev/null \
            || true
        sleep 3
        echo "         MongoDB start attempted."
    else
        echo "WARNING:  Could not start MongoDB automatically. Start it manually."
    fi
else
    echo "WARNING:  mongod not in PATH."
    echo "          • Install locally: brew install mongodb-community && brew services start mongodb-community"
    echo "          • Or use Atlas:    set MONGODB_URL in backend/.env to your Atlas URI."
fi

echo ""

# ════════════════════════════════════════════════════
#  BACKEND SETUP
# ════════════════════════════════════════════════════
echo "── Backend Setup ───────────────────────────────"

VENV_DIR="$BACKEND_DIR/venv"
ENV_FILE="$BACKEND_DIR/.env"

# Virtual environment
if [ ! -d "$VENV_DIR" ]; then
    echo "[backend] Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
else
    echo "[backend] venv already exists."
fi
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

# Python dependencies
echo "[backend] Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install -r "$BACKEND_DIR/requirements.txt" --quiet
echo "[backend] Dependencies installed."

# .env
if [ ! -f "$ENV_FILE" ]; then
    echo "[backend] Creating default .env..."
    cat > "$ENV_FILE" <<'EOF'
# MongoDB settings
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=trackon_lead_management

# JWT settings
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS settings
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]

# Environment
ENVIRONMENT=development
DEBUG=true

# Server port
PORT=8001
EOF
    echo "[backend] .env created at $ENV_FILE — edit to customise."
else
    echo "[backend] .env already exists."
fi

deactivate
echo ""

# ════════════════════════════════════════════════════
#  FRONTEND SETUP
# ════════════════════════════════════════════════════
echo "── Frontend Setup ──────────────────────────────"

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "[frontend] Installing npm dependencies (this may take a minute)..."
    cd "$FRONTEND_DIR" && npm install --legacy-peer-deps
    cd "$ROOT_DIR"
else
    echo "[frontend] node_modules already exists. Running npm install to sync..."
    cd "$FRONTEND_DIR" && npm install --legacy-peer-deps --prefer-offline --quiet
    cd "$ROOT_DIR"
fi
echo "[frontend] Dependencies ready."
echo ""

# ════════════════════════════════════════════════════
#  START SERVERS
# ════════════════════════════════════════════════════
if $SETUP_ONLY; then
    echo "================================================"
    echo "   Setup complete (--setup-only mode)."
    echo "   Start manually:"
    echo "     Backend:  cd backend && source venv/bin/activate && python3 main.py"
    echo "     Frontend: cd frontend && npm start"
    echo "================================================"
    exit 0
fi

echo "── Starting Servers ────────────────────────────"
echo ""

# Start backend in background
echo "[backend] Starting on http://localhost:8001 ..."
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"
cd "$BACKEND_DIR"
python3 main.py &
BACKEND_PID=$!
cd "$ROOT_DIR"

# Give backend a moment to bind
sleep 2

# Start frontend in foreground (Ctrl+C will stop both via trap)
echo "[frontend] Starting on http://localhost:3000 ..."
echo ""
echo "================================================"
echo "   Backend:  http://localhost:8001"
echo "   API Docs: http://localhost:8001/docs"
echo "   Frontend: http://localhost:3000"
echo "   Press Ctrl+C to stop both servers."
echo "================================================"
echo ""

# Trap Ctrl+C to kill both processes cleanly
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill "$BACKEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup INT TERM

cd "$FRONTEND_DIR"
PORT=3000 npm start &
FRONTEND_PID=$!
wait "$FRONTEND_PID"
