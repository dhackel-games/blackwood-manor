#!/bin/bash
# release-testflight.sh. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.086:acoven.
# release-testflight.sh — build, archive, export, and upload Blackwood Manor to TestFlight.
#
# One-time prerequisites (see notes at bottom):
#   1. App record for com.dhackel.BlackwoodManor exists in App Store Connect.
#   2. An App Store Connect API key is present:
#        ~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8
#      and these env vars are available from your private shell environment:
#        export ASC_KEY_ID=XXXXXXXXXX
#        export ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#      Releases target the internal "BM Testers" group by default. To override
#      it, set either the stable group ID or an exact group name (not both):
#        export ASC_BETA_GROUP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#        export ASC_BETA_GROUP_NAME="Another Internal Group"
#
# Usage:
#   cd <blackwood-manor-repo>/ios
#   ./release-testflight.sh              # build, upload, distribute, publish availability
#   ./release-testflight.sh --no-upload  # build + export only (dry run, no creds needed)
#   ./release-testflight.sh --stamp-only --force-next-build
#                                      # bump/stamp OTA content without archiving
#   ./release-testflight.sh --no-upload --force-next-build
#                                      # stamp a new OTA identity and dry-run it
#
set -euo pipefail

cd "$(dirname "$0")"
REPO_ROOT="$(cd .. && pwd)"
SCHEME="BlackwoodManor"
BUNDLE_ID="com.dhackel.BlackwoodManor"
BUILD_ROOT="build"
DERIVED_DATA="$BUILD_ROOT/DerivedData"
ARCHIVE="$BUILD_ROOT/BlackwoodManor.xcarchive"
EXPORT_DIR="$BUILD_ROOT/export"
LOCK_BRANCH="testflight-release-lock"
LOCK_REF="refs/heads/$LOCK_BRANCH"
LOCK_COMMIT=""
LOCK_HELD=0
UPLOAD=1
FORCE_NEXT_BUILD=0
STAMP_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --no-upload) UPLOAD=0 ;;
    --force-next-build) FORCE_NEXT_BUILD=1 ;;
    --stamp-only) UPLOAD=0; STAMP_ONLY=1 ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

release_lock() {
  local status=$?
  trap - EXIT
  set +e
  if [[ "$LOCK_HELD" -eq 1 ]]; then
    local remote_refs="" remote_lock cleanup_failed=0 inspected=0 removed=0 attempt
    for attempt in 1 2 3; do
      if remote_refs=$(git -C "$REPO_ROOT" ls-remote --heads origin "$LOCK_REF"); then
        inspected=1
        break
      fi
      sleep 1
    done
    if [[ "$inspected" -eq 0 ]]; then
      echo "Warning: could not inspect the remote TestFlight release lock for cleanup." >&2
      cleanup_failed=1
    else
      remote_lock=$(printf '%s\n' "$remote_refs" | awk '{print $1}')
      if [[ "$remote_lock" == "$LOCK_COMMIT" ]]; then
        for attempt in 1 2 3; do
          if git -C "$REPO_ROOT" push \
              --force-with-lease="$LOCK_REF:$LOCK_COMMIT" origin ":$LOCK_REF" \
              >/dev/null 2>&1; then
            removed=1
            break
          fi
          sleep 1
        done
        if [[ "$removed" -eq 0 ]]; then
          echo "Warning: could not remove remote TestFlight release lock." >&2
          cleanup_failed=1
        fi
      fi
    fi
    if [[ "$status" -eq 0 && "$cleanup_failed" -eq 1 ]]; then status=1; fi
  fi
  exit "$status"
}

acquire_release_lock() {
  local remote_refs existing fetched lock_time lock_age timeout lock_tree nonce attempt
  timeout="${ASC_RELEASE_LOCK_TIMEOUT:-14400}"
  for attempt in 1 2 3; do
    if ! remote_refs=$(git -C "$REPO_ROOT" ls-remote --heads origin "$LOCK_REF"); then
      sleep 1
      continue
    fi
    existing=$(printf '%s\n' "$remote_refs" | awk '{print $1}')
    if [[ -n "$existing" ]]; then
      if ! git -C "$REPO_ROOT" fetch --quiet origin "$LOCK_REF"; then
        sleep 1
        continue
      fi
      fetched=$(git -C "$REPO_ROOT" rev-parse FETCH_HEAD)
      [[ "$fetched" == "$existing" ]] || continue
      lock_time=$(git -C "$REPO_ROOT" show -s --format=%ct "$fetched")
      lock_age=$(($(date +%s) - lock_time))
      if (( lock_age < timeout )); then
        echo "Another TestFlight release owns the remote lock (${lock_age}s old)." >&2
        exit 1
      fi
      echo "==> Removing stale TestFlight release lock (${lock_age}s old)"
      if ! git -C "$REPO_ROOT" push \
          --force-with-lease="$LOCK_REF:$existing" origin ":$LOCK_REF"; then
        sleep 1
        continue
      fi
    fi

    lock_tree=$(git -C "$REPO_ROOT" rev-parse 'HEAD^{tree}')
    nonce="$(date -u +%Y-%m-%dT%H:%M:%SZ)-$$-$(uuidgen)"
    LOCK_COMMIT=$(printf 'TestFlight release lock %s\n' "$nonce" |
      git -C "$REPO_ROOT" commit-tree "$lock_tree" -p "$START_HEAD")
    if git -C "$REPO_ROOT" push origin "$LOCK_COMMIT:$LOCK_REF"; then
      LOCK_HELD=1
      trap release_lock EXIT
      return
    fi
    sleep 1
  done
  echo "Could not acquire the remote TestFlight release lock after 3 attempts." >&2
  exit 1
}

if [[ "$UPLOAD" -eq 1 ]]; then
  [[ "$(git -C "$REPO_ROOT" branch --show-current)" == "main" ]] || {
    echo "TestFlight publishing must run from main." >&2
    exit 1
  }
  [[ -z "$(git -C "$REPO_ROOT" status --porcelain)" ]] || {
    echo "TestFlight publishing requires a clean worktree." >&2
    exit 1
  }
  git -C "$REPO_ROOT" fetch origin main
  START_HEAD=$(git -C "$REPO_ROOT" rev-parse HEAD)
  [[ "$START_HEAD" == "$(git -C "$REPO_ROOT" rev-parse origin/main)" ]] || {
    echo "Local main must exactly match origin/main before publishing." >&2
    exit 1
  }
  : "${ASC_KEY_ID:?Set ASC_KEY_ID (App Store Connect API Key ID)}"
  : "${ASC_ISSUER_ID:?Set ASC_ISSUER_ID (App Store Connect Issuer ID)}"
  acquire_release_lock
fi

echo "==> Removing artifacts from prior release"
rm -rf "$BUILD_ROOT"
mkdir -p "$BUILD_ROOT"

if [[ "$STAMP_ONLY" -eq 1 ]]; then
  CONTENT_DATE=$(node -p 'require("../web/versions.json").CONTENT_DATE')
  CONTENT_BUILD=$(node -p 'require("../web/versions.json").CONTENT_BUILD')
  RELEASE_CONTENT_DATE="${RELEASE_DATE_OVERRIDE:-$(date '+%Y.%m.%d' | sed -E 's/\.0([0-9])/\.\1/g')}"
  if [[ ! "$RELEASE_CONTENT_DATE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] \
      || [[ ! "$CONTENT_BUILD" =~ ^[0-9]+$ ]]; then
    echo "Invalid content YYYY.M.D / build metadata." >&2
    exit 1
  fi
  if [[ "$CONTENT_DATE" != "$RELEASE_CONTENT_DATE" ]]; then
    NEXT_CONTENT_BUILD=1
  elif (( FORCE_NEXT_BUILD == 1 )); then
    NEXT_CONTENT_BUILD=$((CONTENT_BUILD + 1))
  else
    NEXT_CONTENT_BUILD=$CONTENT_BUILD
  fi
  CONTENT_VERSION=$(node -e '
    const [y, m, d] = process.argv[1].split(".").map(Number);
    console.log(`${String(y).padStart(4, "0")}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}${String(process.argv[2]).padStart(3, "0")}`);
  ' "$RELEASE_CONTENT_DATE" "$NEXT_CONTENT_BUILD")
  echo "==> Stamping content ${RELEASE_CONTENT_DATE} build ${NEXT_CONTENT_BUILD} (${CONTENT_VERSION})"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const versions = JSON.parse(fs.readFileSync(path, "utf8"));
    // Legacy aliases keep already-installed native updaters compatible.
    versions.APP_VERSION = process.argv[2];
    versions.BUILD = process.argv[3];
    versions.CONTENT_DATE = process.argv[2];
    versions.CONTENT_BUILD = process.argv[3];
    versions.CONTENT_VERSION = Number(process.argv[4]);
    fs.writeFileSync(path, `${JSON.stringify(versions, null, 2)}\n`);
  ' ../web/versions.json "$RELEASE_CONTENT_DATE" "$NEXT_CONTENT_BUILD" "$CONTENT_VERSION"
  echo "==> Refreshing bundled web game"
  ./copy-web.sh
  echo "==> --stamp-only set; app version/build unchanged."
  exit 0
fi

# Native releases use today's date. A genuinely new date starts at build 1;
# same-date releases advance beyond content, TestFlight, and checked-in state.
CURRENT_APP_VERSION=$(node -p 'require("../web/package.json").version')
MARKETING_VERSION="${RELEASE_DATE_OVERRIDE:-$(date '+%Y.%m.%d' | sed -E 's/\.0([0-9])/\.\1/g')}"
if [[ ! "$CURRENT_APP_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] \
    || [[ ! "$MARKETING_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid current or release YYYY.M.D app version." >&2
  exit 1
fi
CUR=$(grep -m1 'CURRENT_PROJECT_VERSION' project.yml | grep -oE '[0-9]+' | head -1)
CONTENT_DATE=$(node -p 'require("../web/versions.json").CONTENT_DATE')
CONTENT_BUILD=$(node -p 'require("../web/versions.json").CONTENT_BUILD')
AVAILABLE_RELEASE=$(node -p 'require("../web/versions.json").LATEST_APP_BUILD_AVAILABLE')
ASC_LATEST_BUILD=0
if [[ "$UPLOAD" -eq 1 ]]; then
  ASC_LATEST_BUILD=$(node tools/testflight-release.mjs \
    --latest-build \
    --bundle-id "$BUNDLE_ID" \
    --version "$MARKETING_VERSION")
fi
NEXT=$(node --input-type=module -e '
  import { synchronizedAppBuild } from "./tools/testflight-release.mjs";
  console.log(synchronizedAppBuild({
    releaseVersion: process.argv[1],
    currentAppVersion: process.argv[2],
    currentAppBuild: process.argv[3],
    contentDate: process.argv[4],
    contentBuild: process.argv[5],
    latestAvailableRelease: process.argv[6],
    latestUploadedBuild: process.argv[7],
    forceNext: process.argv[8] === "1",
  }));
' "$MARKETING_VERSION" "$CURRENT_APP_VERSION" "$CUR" "$CONTENT_DATE" "$CONTENT_BUILD" \
  "$AVAILABLE_RELEASE" "$ASC_LATEST_BUILD" "$FORCE_NEXT_BUILD")
echo "==> Releasing version ${MARKETING_VERSION} build ${NEXT}"

# A native release is one synchronized identity: package, Xcode project, native
# metadata, bundled content metadata, and compatibility aliases all use the
# release date and build. Content-only stamping above never touches app identity.
echo "==> Synchronizing app and content identity (v${MARKETING_VERSION} build ${NEXT})"
APP_RELEASE_ID=$(node -e '
  const [y, m, d] = process.argv[1].split(".").map(Number);
  console.log(`${String(y).padStart(4, "0")}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}${String(process.argv[2]).padStart(3, "0")}`);
' "$MARKETING_VERSION" "$NEXT")
node -e '
  const fs = require("fs");
  const [packagePath, versionsPath, version, build, releaseId] = process.argv.slice(1);
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"));
  pkg.version = version;
  versions.APP_VERSION = version;
  versions.BUILD = build;
  versions.NATIVE_APP_VERSION = version;
  versions.NATIVE_APP_BUILD = build;
  versions.CONTENT_DATE = version;
  versions.CONTENT_BUILD = build;
  versions.CONTENT_VERSION = Number(releaseId);
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
  fs.writeFileSync(versionsPath, `${JSON.stringify(versions, null, 2)}\n`);
' ../web/package.json ../web/versions.json "$MARKETING_VERSION" "$NEXT" "$APP_RELEASE_ID"

echo "==> Refreshing bundled web game"
./copy-web.sh

echo "==> Setting app version ${MARKETING_VERSION} + build ${NEXT} in project.yml"
sed -i '' -E "s/MARKETING_VERSION: \"[^\"]+\"/MARKETING_VERSION: \"${MARKETING_VERSION}\"/g" project.yml
sed -i '' -E "s/CURRENT_PROJECT_VERSION: \"[^\"]+\"/CURRENT_PROJECT_VERSION: \"${NEXT}\"/g" project.yml
STAMP_DATE=$(date +%Y-%m-%d)
STAMP_BUILD=$(printf "%03d" "$NEXT")
RELEASE_EDITOR="${RELEASE_EDITOR:-dhackel}"
sed -i '' -E \
  "1s/[0-9]{4}-[0-9]{2}-[0-9]{2}\\.[0-9]{3}:[A-Za-z0-9_-]+/${STAMP_DATE}.${STAMP_BUILD}:${RELEASE_EDITOR}/" \
  project.yml

echo "==> Regenerating project (xcodegen)"
xcodegen generate

echo "==> Archiving"
rm -rf "$ARCHIVE"
xcodebuild -project BlackwoodManor.xcodeproj -scheme "$SCHEME" \
  -configuration Release \
  -derivedDataPath "$DERIVED_DATA" \
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

echo "==> Validating IPA"
xcrun altool --validate-app -f "$IPA" -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

echo "==> Uploading to TestFlight"
xcrun altool --upload-app -f "$IPA" -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

echo "==> Waiting for App Store Connect processing and internal distribution"
node tools/testflight-release.mjs \
  --bundle-id "$BUNDLE_ID" \
  --version "$MARKETING_VERSION" \
  --build "$NEXT"

node -e '
  const fs = require("fs");
  const path = process.argv[1];
  const versions = JSON.parse(fs.readFileSync(path, "utf8"));
  versions.LATEST_APP_BUILD_AVAILABLE = Number(process.argv[2]);
  fs.writeFileSync(path, `${JSON.stringify(versions, null, 2)}\n`);
' ../web/versions.json "$APP_RELEASE_ID"

echo "==> Publishing the verified TestFlight build number"
git -C "$REPO_ROOT" fetch origin main
if [[ "$(git -C "$REPO_ROOT" rev-parse HEAD)" != "$START_HEAD" ]] \
    || [[ "$(git -C "$REPO_ROOT" rev-parse origin/main)" != "$START_HEAD" ]]; then
  echo "main changed during the release. The verified build number is left uncommitted; rebase it before publishing." >&2
  exit 1
fi
git -C "$REPO_ROOT" add \
  ios/project.yml \
  web/package.json \
  web/versions.json
if git -C "$REPO_ROOT" diff --cached --quiet; then
  echo "==> Release metadata already identifies build ${NEXT}"
else
  git -C "$REPO_ROOT" commit \
    -m "build(ios): publish TestFlight build ${NEXT}" \
    -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
  git -C "$REPO_ROOT" push origin HEAD:main
fi

echo "==> Done. Version ${MARKETING_VERSION} build ${NEXT} is available to the configured internal TestFlight group."
echo "    LATEST_APP_BUILD_AVAILABLE is committed in web/versions.json."
