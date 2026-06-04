#!/usr/bin/env bash
set -euo pipefail

# Build Squidex Android APK
# Usage: ./scripts/build-apk.sh [--install]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -L)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd -L)"
APK_OUTPUT_DIR="$ROOT_DIR/dist"

echo "==> Installing dependencies..."
npm install

echo "==> Building Android APK..."
cd "$ROOT_DIR/apps/mobile"
npx expo build:android --type apk --output-dir "$APK_OUTPUT_DIR"

echo ""
echo "=============================================="
echo "  APK built successfully!"
echo "  Output: $APK_OUTPUT_DIR/squidex.apk"
echo ""
echo "  Install on device:"
if [ "${1:-}" = "--install" ]; then
  echo "  > adb install $APK_OUTPUT_DIR/squidex.apk"
else
  echo "  > adb install dist/squidex.apk"
fi
echo "=============================================="
