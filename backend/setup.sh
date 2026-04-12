#!/bin/bash
# Backend setup and start script
# Run from anywhere: bash backend/setup.sh
# Or from inside the backend dir: ./setup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
VENV_DIR="$SCRIPT_DIR/venv"
REQUIREMENTS="$SCRIPT_DIR/requirements.txt"

echo "=== Backend Setup ==="
echo ""

# ── 1. Python 3 ───────────────────────────────────────────────────────────────
echo "[1/5] Checking Python 3..."
if ! command -v python3 &>/dev/null; then
    echo "ERROR: python3 not found."
    echo "       Install from https://python.org or via: brew install python"
    exit 1
fi
echo "      $(python3 --version)"

# ── 2. pip ────────────────────────────────────────────────────────────────────
echo "[2/5] Checking pip..."
if ! python3 -m pip --version &>/dev/null; then
    echo "ERROR: pip not found. Install pip and re-run."
    exit 1
fi
echo "      $(python3 -m pip --version)"

# ── 3. MongoDB ────────────────────────────────────────────────────────────────
echo "[3/5] Checking MongoDB..."
MONGO_RUNNING=false
if command -v mongosh &>/dev/null && mongosh --eval "db.runCommand({ping:1})" --quiet &>/dev/null 2>&1; then
    MONGO_RUNNING=true
elif command -v mongo &>/dev/null && mongo --eval "db.runCommand({ping:1})" --quiet &>/dev/null 2>&1; then
    MONGO_RUNNING=true
fi

if $MONGO_RUNNING; then
    echo "      MongoDB is already running."
elif command -v mongod &>/dev/null; then
    echo "      MongoDB found but not running. Starting via Homebrew..."
    if command -v brew &>/dev/null; then
        brew services start mongodb-community 2>/dev/null \
            || brew services start mongodb/brew/mongodb-community 2>/dev/null \
            || true
        sleep 3
        echo "      MongoDB start attempted."
    else
        echo "WARNING: brew not found. Start MongoDB manually before the server connects."
    fi
else
    echo "WARNING: mongod not found. Options:"
    echo "         • Local install: brew install mongodb-community && brew services start mongodb-community"
    echo "         • Cloud:         set MONGODB_URL in backend/.env to your Atlas connection string."
fi

# ── 4. Virtual environment ────────────────────────────────────────────────────
echo "[4/5] Setting up Python virtual environment..."
if [ ! -d "$VENV_DIR" ]; then
    echo "      Creating venv..."
    python3 -m venv "$VENV_DIR"
else
    echo "      venv already exists."
fi
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"
pip install --upgrade pip --quiet
pip install -r "$REQUIREMENTS" --quiet
echo "      Dependencies installed."

# ── 5. .env file ─────────────────────────────────────────────────────────────
echo "[5/5] Checking .env..."
if [ ! -f "$ENV_FILE" ]; then
    echo "      Creating default .env..."
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
    echo "      .env created. Edit $ENV_FILE to customise."
else
    echo "      .env already exists."
fi

# ── Start ─────────────────────────────────────────────────────────────────────
echo ""
echo "=== Starting Backend Server ==="
echo "      API:   http://localhost:8001"
echo "      Docs:  http://localhost:8001/docs"
echo "      Press Ctrl+C to stop."
echo ""
cd "$SCRIPT_DIR"
python3 main.py
