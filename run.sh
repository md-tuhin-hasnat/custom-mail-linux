#!/usr/bin/env bash
set -e

# ==============================================================================
# Aura Mail — Enterprise Linux Client Build & Run Orchestrator
# ==============================================================================

TARGET="electron"
SEED="true"
MODE="dev"
PORT="3000"

print_help() {
  cat << EOF
Usage: ./run.sh [OPTIONS]

Options:
  -e, --electron       Launch as Electron desktop application (default)
  -b, --browser        Launch in standard Web Browser (Chrome/Firefox/Brave)
  -s, --seed           Include enterprise seed data (threads, events, tasks) (default)
  -n, --no-seed        Start with clean/empty mailbox (no seed data)
  -d, --dev            Run in live development mode with hot-reloading (default)
  -p, --prod           Build full production bundle and launch
  -h, --help           Display this help message

Examples:
  ./run.sh                           # Interactive prompt or default electron + seed
  ./run.sh --electron --seed         # Electron with seed data
  ./run.sh --electron --no-seed      # Electron with empty mailbox
  ./run.sh --browser --seed          # Web browser at localhost:3000 with seed data
  ./run.sh --browser --no-seed       # Web browser with empty mailbox
  ./run.sh -b -s --prod              # Build production export and open in browser
EOF
}

# Parse command line flags
HAS_ARGS=0
while [[ $# -gt 0 ]]; do
  HAS_ARGS=1
  case "$1" in
    -e|--electron)
      TARGET="electron"
      shift
      ;;
    -b|--browser)
      TARGET="browser"
      shift
      ;;
    -s|--seed)
      SEED="true"
      shift
      ;;
    -n|--no-seed|--empty)
      SEED="false"
      shift
      ;;
    -d|--dev)
      MODE="dev"
      shift
      ;;
    -p|--prod)
      MODE="prod"
      shift
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_help
      exit 1
      ;;
  esac
done

# If no arguments provided and in an interactive TTY, prompt the user
if [[ $HAS_ARGS -eq 0 && -t 0 ]]; then
  echo "=========================================================="
  echo "         Aura Mail — Enterprise Linux Client             "
  echo "=========================================================="
  echo ""
  echo "Select target runtime:"
  echo "  1) Electron Desktop App (Default)"
  echo "  2) Web Browser (http://localhost:$PORT)"
  read -r -p "Enter choice [1-2, default 1]: " TARGET_CHOICE
  if [[ "$TARGET_CHOICE" == "2" ]]; then
    TARGET="browser"
  else
    TARGET="electron"
  fi

  echo ""
  echo "Select initial data:"
  echo "  1) With Enterprise Seed Data (Emails, Calendar, Tasks) [Default]"
  echo "  2) Clean Empty Mailbox (Without Seed)"
  read -r -p "Enter choice [1-2, default 1]: " SEED_CHOICE
  if [[ "$SEED_CHOICE" == "2" ]]; then
    SEED="false"
  else
    SEED="true"
  fi

  echo ""
  echo "Select build mode:"
  echo "  1) Development with Live Reload [Default]"
  echo "  2) Production Optimized Build"
  read -r -p "Enter choice [1-2, default 1]: " MODE_CHOICE
  if [[ "$MODE_CHOICE" == "2" ]]; then
    MODE="prod"
  else
    MODE="dev"
  fi
  echo ""
fi

# Load .env file if it exists
if [ -f ".env" ]; then
  # Export all variables defined in .env
  set -a
  source .env
  set +a
fi

# Export environment variables for Next.js & Electron
export SEED_DATA="$SEED"
export NEXT_PUBLIC_SEED_DATA="$SEED"

echo "----------------------------------------------------------"
echo " Configuration:"
echo "   Target Runtime : $TARGET"
echo "   Seed Data      : $( [ "$SEED" = "true" ] && echo "Enabled (Enterprise demo)" || echo "Disabled (Empty mailbox)" )"
echo "   Build Mode     : $MODE"
echo "----------------------------------------------------------"

# Ensure dependencies exist
if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Running npm install..."
  npm install
fi

# Execution paths
if [ "$TARGET" = "electron" ]; then
  echo "Bundling Electron main process..."
  npm run build:main

  if [ "$MODE" = "prod" ]; then
    echo "Building Next.js production static export..."
    npm run build:renderer
    echo "Launching Electron in production mode..."
    npx cross-env NODE_ENV=production SEED_DATA="$SEED" NEXT_PUBLIC_SEED_DATA="$SEED" npx electron .
  else
    echo "Starting Next.js dev server & Electron window..."
    npx concurrently -k \
      "npx cross-env SEED_DATA=$SEED NEXT_PUBLIC_SEED_DATA=$SEED next dev -p $PORT" \
      "npx wait-on tcp:$PORT && npx cross-env SEED_DATA=$SEED NEXT_PUBLIC_SEED_DATA=$SEED npx electron ."
  fi

elif [ "$TARGET" = "browser" ]; then
  URL="http://localhost:$PORT?seed=$SEED"
  if [ "$MODE" = "prod" ]; then
    echo "Building Next.js static output..."
    npm run build:renderer
    echo "Serving static export on $URL..."
    # Launch browser using xdg-open if on Linux desktop
    (sleep 1.5 && (xdg-open "$URL" 2>/dev/null || true)) &
    npx serve out -l "$PORT"
  else
    echo "Starting Next.js development server on $URL..."
    (sleep 2 && (xdg-open "$URL" 2>/dev/null || true)) &
    cross-env SEED_DATA="$SEED" NEXT_PUBLIC_SEED_DATA="$SEED" next dev -p "$PORT"
  fi
fi
