# APK Distribution & Updates Guide

## Overview
This guide explains how to build once, share your APK with others, and push updates without rebuilding.

## One-Time Build Process

### Step 1: Build the APK (Do this once)
```bash
npx eas build --profile preview --platform android
```

This command will:
- Queue a build on EAS servers
- Create an APK file
- Give you a download link when complete (build takes ~10-20 minutes)

### Step 2: Share the APK
Once the build completes:
1. Download the APK from the link EAS provides
2. Share the APK file with others via:
   - Google Drive
   - Dropbox
   - Direct file transfer
   - WhatsApp
   - Email
   - Or any file sharing method

### Step 3: Install on Devices
Recipients should:
1. Enable "Install from Unknown Sources" in Android settings
2. Download and tap the APK file
3. Follow installation prompts

## Updating Your App (No Rebuild Needed!)

After you've built and distributed the APK, you can push code updates instantly:

### Method 1: Automatic Updates
Just make your code changes, then run:
```bash
npx eas update --branch preview --message "Your update description"
```

The next time users open the app, it will automatically download and apply the update!

### Method 2: Publish from Current Code
```bash
npx eas update --auto
```

## What Can Be Updated Without Rebuilding?
✅ **Yes - Can update via OTA:**
- JavaScript/TypeScript code changes
- React components
- App logic
- UI changes
- Bug fixes
- New features (that don't require new native modules)

❌ **No - Requires new build:**
- Adding new native dependencies (like new `expo-*` packages)
- Changing app icon
- Changing splash screen
- Updating `app.json` configuration
- Changing permissions

## Commands Reference

### Build a new APK (when needed)
```bash
npx eas build --profile preview --platform android
```

### Push an update (after changes)
```bash
npx eas update --branch preview --message "Fixed login bug"
```

### Check current updates
```bash
npx eas update:list --branch preview
```

### View all your builds
```bash
npx eas build:list
```

## Workflow Example

1. **Initial Setup (Once)**
   ```bash
   npx eas build --profile preview --platform android
   # Wait 10-20 minutes for build
   # Download APK
   # Share with team/users
   ```

2. **Daily Development (Fast!)  **
   ```bash
   # Make code changes in your editor
   # Test locally with: npx expo start
   
   # When ready to update users:
   npx eas update --branch preview --message "Added new features"
   ```

3. **Major Updates (Occasionally)**
   If you add a new native package:
   ```bash
   npx expo install expo-camera  # Example
   npx eas build --profile preview --platform android
   # Share new APK
   ```

## Tips

- **Version Numbers**: Increment `version` in `app.json` before building
- **Testing**: Always test updates locally before publishing
- **Rollback**: You can rollback to previous updates if needed
- **Channels**: Use different channels (preview, production) for different user groups
- **Updates Take Effect**: On next app restart (usually within minutes)

## Current Setup

- **Build Profile**: `preview`
- **Update Channel**: `preview`
- **Distribution**: Internal (no Play Store)
- **Build Type**: APK (easy sharing)
- **Runtime Version**: Follows app version

## Next Steps

1. Wait for current build to complete
2. Download and test the APK
3. Share with your team
4. Make code changes
5. Push updates with `eas update`
