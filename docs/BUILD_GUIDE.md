# SpotYme Build Guide

This guide explains how to build and release the SpotYme Android APK using Expo Application Services (EAS).

## Prerequisites

1. **Node.js & npm/pnpm** installed
2. **Expo account** (create at https://expo.dev)
3. **EAS CLI** installed globally
4. **GitHub CLI** (required for releases)

## Initial Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

Enter your Expo account credentials when prompted.

### 3. Install Dependencies

```bash
pnpm install
```

## Version Management

### Before Building a New Version

1. **Update version in app.json**:
```json
{
  "expo": {
    "version": "2.1.0",  // Increment this
    "android": {
      "runtimeVersion": "2.1.0"  // Match the version
    }
  }
}
```

2. **Commit your changes**:
```bash
git add -A
git commit -m "Release v2.1.0: Your release description"
```

## Building the APK

### 1. Configure EAS (First Time Only)

When building for the first time, EAS will prompt you to:

- Create a project on Expo servers
- Generate Android keystore credentials
- Configure build settings

### 2. Build Command

```bash
eas build --platform android --profile preview
```

This command will:

- Upload your code to EAS servers
- Build the APK in the cloud
- Provide a URL to monitor build progress
- Generate a download link when complete

### 3. Build Options

```bash
# Clear cache for fresh build (recommended for new versions)
eas build --platform android --profile preview --clear-cache

# Non-interactive mode (after initial setup)
eas build --platform android --profile preview --no-wait
```

## Build Profiles

Build profiles are configured in `eas.json`:

- **preview**: Builds APK for testing
- **production**: Builds APK for release

## Downloading the APK

### Method 1: From Build Output

After build completes, EAS shows a download link in the output.

### Method 2: Using EAS CLI

```bash
# List recent builds to get artifact URL
eas build:list --platform android --limit 1

# Download using curl (replace URL with artifact URL from above)
curl -L -o spotyme-vX.X.X.apk "https://expo.dev/artifacts/eas/YOUR_BUILD_ID.apk"
```

### Method 3: From Expo Dashboard

Visit the build URL and download directly from the web interface.

## Releasing to GitHub

### Complete Release Process

#### 1. Create Release Notes

Create a file `RELEASE_NOTES_vX.X.X.md`:

```markdown
# SpotYme vX.X.X Release Notes

## ✨ New Features
- Feature 1
- Feature 2

## 🐛 Bug Fixes
- Fix 1
- Fix 2

## 🔧 Improvements
- Improvement 1
- Improvement 2

---

**Download**: [SpotYme vX.X.X APK](https://github.com/fiston-user/spotyme/releases/tag/vX.X.X)
**Backend Compatibility**: Requires backend v1.0.0 or higher
**Minimum Android**: 6.0 (API 24)
```

#### 2. Download the APK

```bash
# Example for v2.0.0
curl -L -o spotyme-v2.0.0.apk "ARTIFACT_URL_FROM_EAS_BUILD"
```

#### 3. Create GitHub Release

```bash
# Using GitHub CLI with release notes file
gh release create vX.X.X spotyme-vX.X.X.apk \
  --title "SpotYme vX.X.X - Brief Description" \
  --notes-file RELEASE_NOTES_vX.X.X.md

# Or with inline notes
gh release create vX.X.X spotyme-vX.X.X.apk \
  --title "SpotYme vX.X.X" \
  --notes "Release notes here"
```

### Quick Release Example

For version 2.1.0:

```bash
# 1. Update version in app.json
# 2. Commit changes
git add -A
git commit -m "Release v2.1.0: Bug fixes and improvements"

# 3. Build
eas build --platform android --profile preview --clear-cache

# 4. Wait for build to complete (10-20 mins)

# 5. Download APK
curl -L -o spotyme-v2.1.0.apk "URL_FROM_BUILD_OUTPUT"

# 6. Create release
gh release create v2.1.0 spotyme-v2.1.0.apk \
  --title "SpotYme v2.1.0 - Bug Fixes" \
  --notes "Bug fixes and performance improvements"
```

## Environment Configuration

The app uses API URL: `https://api.spotyme.space`

To change the API URL, update these files:

- `/app/login.tsx`
- `/app/callback.tsx`
- `/services/auth.ts`
- `/services/api.ts`
- `/services/apiClient.ts`
- `/services/apiService.ts`

## Common Build Issues

### 1. Missing Dependencies

```bash
# Fix Expo SDK version mismatches
npx expo install --fix
```

### 2. Native Project Issues

```bash
# Regenerate native projects
rm -rf android ios
npx expo prebuild --clean
```

### 3. Module Not Found Errors

```bash
# Clean install all dependencies
rm -rf node_modules
pnpm install
```

### 4. Build Fails with Cache Issues

```bash
# Always use --clear-cache for major releases
eas build --platform android --profile preview --clear-cache
```

## Version Numbering Guidelines

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, significant improvements
- **Patch (0.0.X)**: Bug fixes, small improvements

Examples:
- `1.0.0` → `2.0.0`: Major redesign or breaking changes
- `2.0.0` → `2.1.0`: New features added
- `2.1.0` → `2.1.1`: Bug fixes only

## Build Timeline

- **Initial setup**: 5-10 minutes
- **Build time**: 10-20 minutes
- **Download**: 1-2 minutes
- **GitHub release**: 2-3 minutes

## Monitoring Builds

### View Build Status

```bash
# List recent builds
eas build:list --platform android --limit 5
```

### View Build Logs

Visit the build URL provided after starting a build, or find it in your Expo dashboard.

## GitHub Release Management

### View Existing Releases

```bash
# List all releases
gh release list

# View specific release
gh release view v2.0.0
```

### Update Existing Release

```bash
# Edit release notes
gh release edit v2.0.0 --notes-file RELEASE_NOTES_v2.0.0.md

# Upload additional assets
gh release upload v2.0.0 additional-file.zip
```

### Delete Release (if needed)

```bash
# Delete a release
gh release delete v2.0.0 --yes
```

## Important Notes

1. **Keystore**: EAS manages the Android keystore. Keep credentials safe for app updates.
2. **Version Updates**: ALWAYS update version in `app.json` before production releases.
3. **Git Commits**: Commit all changes before building.
4. **API Backend**: Ensure backend at `https://api.spotyme.space` is running.
5. **CORS**: Backend must accept requests from mobile apps.
6. **Testing**: Always test APK on real device before releasing.
7. **Release Notes**: Create detailed release notes for users.

## Complete Build Checklist

- [ ] Update version in `app.json`
- [ ] Commit all changes to git
- [ ] Logged into EAS (`eas login`)
- [ ] Dependencies installed (`pnpm install`)
- [ ] Backend API running and accessible
- [ ] Run build command with `--clear-cache` for new versions
- [ ] Monitor build progress
- [ ] Download APK when complete
- [ ] Test APK on physical device
- [ ] Create release notes file
- [ ] Create GitHub release with `gh release create`
- [ ] Verify release is published on GitHub

## Support

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Build Errors**: Check build logs at the provided URL
- **Expo Status**: https://status.expo.dev/
- **GitHub CLI Docs**: https://cli.github.com/manual/

## Build Environment

Current configuration:

- Expo SDK: 53
- React Native: 0.79.5
- Android Min SDK: 24 (Android 6.0)
- Android Target SDK: 35
- GitHub Repository: https://github.com/fiston-user/spotyme

## Recent Releases

- **v2.0.0**: Authentication & UI Overhaul
- **v1.0.0**: Initial Release

## Quick Commands Reference

```bash
# Build
eas build --platform android --profile preview --clear-cache

# List builds
eas build:list --platform android --limit 5

# Download APK (replace URL)
curl -L -o spotyme-vX.X.X.apk "ARTIFACT_URL"

# Create release
gh release create vX.X.X spotyme-vX.X.X.apk \
  --title "SpotYme vX.X.X" \
  --notes-file RELEASE_NOTES_vX.X.X.md

# View releases
gh release list
```