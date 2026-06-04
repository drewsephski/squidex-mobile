#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -L)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd -L)"
APP_PATH="${1:-$ROOT_DIR/dist/macos/Squidex.app}"
PROFILE="${SQUIDEX_NOTARY_PROFILE:-squidex-notary}"
SUBMIT_ZIP="$ROOT_DIR/dist/macos/Squidex-submit.zip"
OUTPUT_ZIP="$ROOT_DIR/dist/macos/Squidex-notarized.zip"

if [ ! -d "$APP_PATH" ]; then
  echo "App bundle not found: $APP_PATH" >&2
  echo "Run npm run desktop:mac:bundle and npm run desktop:mac:sign first." >&2
  exit 1
fi

codesign --verify --deep --strict --verbose=2 "$APP_PATH"

rm -f "$SUBMIT_ZIP" "$OUTPUT_ZIP"
ditto -c -k --keepParent "$APP_PATH" "$SUBMIT_ZIP"

xcrun notarytool submit "$SUBMIT_ZIP" --keychain-profile "$PROFILE" --wait
xcrun stapler staple "$APP_PATH"
xcrun stapler validate "$APP_PATH"
spctl --assess --type execute --verbose=4 "$APP_PATH"

ditto -c -k --keepParent "$APP_PATH" "$OUTPUT_ZIP"
rm -f "$SUBMIT_ZIP"

echo "Notarized app: $APP_PATH"
echo "Distributable archive: $OUTPUT_ZIP"
