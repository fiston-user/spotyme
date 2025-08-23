# SpotYme Build Guide

This guide explains how to build and release the SpotYme Android APK using Expo Application Services (EAS).

## Prerequisites

1. **Node.js & npm/pnpm** installed
2. **Expo account** (create at https://expo.dev)
3. **EAS CLI** installed globally
4. **GitHub CLI** (optional, for releases)

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
# Clear cache for fresh build
eas build --platform android --profile preview --clear-cache

# Non-interactive mode (after initial setup)
eas build --platform android --profile preview --no-wait
```

## Build Profiles

Build profiles are configured in `eas.json`:

- **preview**: Builds APK for testing
- **production**: Builds APK for release

## Environment Configuration

The app uses a hardcoded API URL: `https://api.spotyme.space`

To change the API URL, update these files:

- `/app/login.tsx`
- `/app/callback.tsx`
- `/services/auth.ts`
- `/services/api.ts`

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

## Releasing to GitHub

### 1. Download APK

After build completes, download the APK from the EAS build page.

### 2. Create GitHub Release

```bash
# Using GitHub CLI
gh release create v1.0.0 spotyme-v1.0.0.apk \
  --title "SpotYme v1.0.0" \
  --notes "Release notes here"
```

### 3. Manual Release

Alternatively, create a release through GitHub web interface:

1. Go to Releases → Create new release
2. Create a tag (e.g., v1.0.0)
3. Upload the APK file
4. Add release notes
5. Publish release

## Build Timeline

- **Initial setup**: 5-10 minutes
- **Build time**: 10-20 minutes
- **Download**: 1-2 minutes

## Monitoring Builds

### View Build Status

```bash
eas build:list --platform android --limit 5
```

### View Build Logs

Visit the build URL provided after starting a build, or find it in your Expo dashboard.

## Important Notes

1. **Keystore**: EAS manages the Android keystore. Keep credentials safe for app updates.
2. **Version Updates**: Update version in `app.json` before production releases.
3. **API Backend**: Ensure backend at `https://api.spotyme.space` is running.
4. **CORS**: Backend must accept requests from mobile apps (currently set to accept all origins).

## Quick Build Checklist

- [ ] Logged into EAS (`eas login`)
- [ ] Dependencies installed (`pnpm install`)
- [ ] Code changes committed to git
- [ ] Backend API running and accessible
- [ ] Run build command (`eas build --platform android --profile preview`)
- [ ] Download APK when complete
- [ ] Test APK on device
- [ ] Create GitHub release if needed

## Support

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Build Errors**: Check build logs at the provided URL
- **Expo Status**: https://status.expo.dev/

## Build Environment

Current configuration:

- Expo SDK: 53
- React Native: 0.79.5
- Android Min SDK: 24 (Android 6.0)
- Android Target SDK: 35
