# Plan — Fully Functional APK Download

## Problem
The download page links to `/download/squidex.apk` which returns 404 because no actual APK is built or hosted.

## Solution
Build the APK via GitHub Actions on every push to main, release it as a GitHub Release asset, and redirect the download link there.

## Steps

### 1. Fix GitHub Actions workflow
Replace the current `build-apk.yml` with one that:
- Checks out code, installs deps
- Runs `npx expo prebuild --platform android` to generate native project
- Runs `cd android && ./gradlew assembleRelease` to build APK
- Uses `ncipollo/release-action` to create/update a "latest" release with the APK attached
- Uses an existing release named "latest" or creates it

### 2. Set up Vercel redirect
Add a redirect in `site/vercel.json` so `/download/squidex.apk` → `https://github.com/drewsephski/squidex-mobile/releases/latest/download/squidex.apk`

### 3. Update download page
- Remove the "Coming soon" badge on the APK card
- Add a "Build status" indicator linking to the Actions tab
- Update the download link to point to the actual APK download

## Verification
1. Push to main triggers the workflow
2. Workflow builds APK and creates a GitHub Release
3. Navigate to `squidex.app/download/squidex.apk` → downloads the APK
