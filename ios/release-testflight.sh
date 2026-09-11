#!/bin/bash
# release-testflight.sh — build, archive, export, and upload Blackwood Manor to TestFlight.
#
# One-time prerequisites (see notes at bottom):
#   1. App record for com.dhackel.BlackwoodManor exists in App Store Connect.
#   2. An App Store Connect API key is present:
#        ~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8
#      and these env vars are available from your private shell environment:
#        export ASC_KEY_ID=XXXXXXXXXX
#        export ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#
# Usage:
#   cd <blackwood-manor-repo>/ios
#   ./release-testflight.sh              # bump build, archive, export, upload
#   ./release-testflight.sh --no-upload  # build + export only (dry run, no creds needed)
#
set -euo pipefail

cd "$(dirname "$0")"
SCHEME="BlackwoodManor"
ARCHIVE="build/BlackwoodManor.xcarchive"
EXPORT_DIR="build/export"
UPLOAD=1
[[ "${1:-}" == "--no-upload" ]] && UPLOAD=0

# Derive the marketing version and next build number FIRST, so we can stamp the
# same values into the on-screen badge, the bundled web game, and project.yml.
MARKETING_VERSION=$(node -p 'require("../web/package.json").version')
if [[ ! "$MARKETING_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid YYYY.M.D package version: $MARKETING_VERSION" >&2
  exit 1
fi
CUR=$(grep -m1 'CURRENT_PROJECT_VERSION' project.yml | grep -oE '[0-9]+' | head -1)
NEXT=$((CUR + 1))
echo "==> Releasing version ${MARKETING_VERSION} build ${NEXT}"

# Stamp the on-screen build badge (web/js/version.js) so the browser and the app
# always report the same version + build number. Done BEFORE copy-web.sh so the
# stamped file is the copy that lands in the app bundle.
echo "==> Stamping build badge (v${MARKETING_VERSION} build ${NEXT})"
sed -i '' -E "s/(export const APP_VERSION = \")[^\"]*(\";)/\1${MARKETING_VERSION}\2/" ../web/js/version.js
sed -i '' -E "s/(export const BUILD = \")[^\"]*(\";)/\1${NEXT}\2/" ../web/js/version.js

echo "==> Refreshing bundled web game"
./copy-web.sh

echo "==> Setting app version ${MARKETING_VERSION} + build ${NEXT} in project.yml"
sed -i '' -E "s/MARKETING_VERSION: \"[^\"]+\"/MARKETING_VERSION: \"${MARKETING_VERSION}\"/g" project.yml
sed -i '' "s/CURRENT_PROJECT_VERSION: \"${CUR}\"/CURRENT_PROJECT_VERSION: \"${NEXT}\"/g" project.yml

echo "==> Regenerating project (xcodegen)"
xcodegen generate

echo "==> Archiving"
rm -rf "$ARCHIVE"
xcodebuild -project BlackwoodManor.xcodeproj -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE" \
  -destination 'generic/platform=iOS' \
  -allowProvisioningUpdates \
  clean archive

echo "==> Exporting IPA (app-store-connect)"
rm -rf "$EXPORT_DIR"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist ExportOptions-AppStore.plist \
  -allowProvisioningUpdates

IPA=$(ls "$EXPORT_DIR"/*.ipa | head -1)
echo "==> Built: $IPA (version ${MARKETING_VERSION}, build ${NEXT})"

if [[ "$UPLOAD" -eq 0 ]]; then
  echo "==> --no-upload set; stopping before upload."
  exit 0
fi

: "${ASC_KEY_ID:?Set ASC_KEY_ID (App Store Connect API Key ID)}"
: "${ASC_ISSUER_ID:?Set ASC_ISSUER_ID (App Store Connect Issuer ID)}"

echo "==> Validating IPA"
xcrun altool --validate-app -f "$IPA" -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

echo "==> Uploading to TestFlight"
xcrun altool --upload-app -f "$IPA" -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

echo "==> Done. Version ${MARKETING_VERSION} build ${NEXT} uploaded. It will appear in TestFlight after ~5-30 min of processing."
echo "    Then add testers (e.g. Andy) in App Store Connect > TestFlight."
