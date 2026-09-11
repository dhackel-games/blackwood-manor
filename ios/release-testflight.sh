#!/bin/bash
# release-testflight.sh — build, archive, export, and upload Blackwood Manor to TestFlight.
#
# One-time prerequisites (see notes at bottom):
#   1. App record for com.dhackel.BlackwoodManor exists in App Store Connect.
#   2. An App Store Connect API key is present:
#        ~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8
#      and these env vars are exported (put them in ~/.zshrc or pass inline):
#        export ASC_KEY_ID=XXXXXXXXXX
#        export ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#
# Usage:
#   cd ~/repos/blackwood-manor/ios
#   ./release-testflight.sh              # bump build, archive, export, upload
#   ./release-testflight.sh --no-upload  # build + export only (dry run, no creds needed)
#
set -euo pipefail

cd "$(dirname "$0")"
SCHEME="BlackwoodManor"
ARCHIVE="build/BlackwoodManor.xcarchive"
EXPORT_DIR="build/export"
TEAM="9W789FP4LG"
UPLOAD=1
[[ "${1:-}" == "--no-upload" ]] && UPLOAD=0

echo "==> Regenerating project (xcodegen)"
xcodegen generate

# Auto-bump CURRENT_PROJECT_VERSION so each TestFlight upload has a unique build number.
CUR=$(grep -m1 'CURRENT_PROJECT_VERSION' project.yml | grep -oE '[0-9]+' | head -1)
NEXT=$((CUR + 1))
echo "==> Bumping build number ${CUR} -> ${NEXT}"
sed -i '' "s/CURRENT_PROJECT_VERSION: \"${CUR}\"/CURRENT_PROJECT_VERSION: \"${NEXT}\"/g" project.yml
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
echo "==> Built: $IPA (build ${NEXT})"

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

echo "==> Done. Build ${NEXT} uploaded. It will appear in TestFlight after ~5-30 min of processing."
echo "    Then add testers (e.g. Andy) in App Store Connect > TestFlight."
