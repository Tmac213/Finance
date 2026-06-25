# Android Studio Quick Start Guide

This guide will help you run the app in Android Studio with the emulator.

## Prerequisites

1. **Android Studio** installed (latest version recommended)
2. **Java 17** installed and configured
3. **Android SDK** with API level 33 (Android 13)
4. **Backend server** running (we'll start it in step 4)

## Step-by-Step Instructions

### Step 1: Build the Web App

First, you need to build the React/Vite web app so Capacitor can bundle it:

```bash
npm run build
```

This creates the `dist` folder with your compiled web app.

### Step 2: Sync Capacitor

Sync the web app to the Android project:

```bash
npx capacitor sync android
```

This copies the `dist` folder to `android/app/src/main/assets/public/` and updates native dependencies.

### Step 3: Open in Android Studio

1. Open **Android Studio**
2. Click **"Open"** or **"File > Open"**
3. Navigate to your project folder
4. Select the **`android`** folder (not the root project folder)
5. Click **"OK"**

Android Studio will:
- Sync Gradle files (this may take a few minutes on first open)
- Download dependencies if needed
- Index the project

### Step 4: Start the Backend Server

**IMPORTANT:** The app needs the backend server running to work!

Open a terminal and run:

```bash
cd backend
npm install  # if you haven't already
npm start
```

The server should start on `http://localhost:3001` (or the port specified in your `.env`).

**Note:** The Android emulator uses `10.0.2.2` to access `localhost` on your computer, which is already configured in the app.

### Step 5: Create/Start an Android Emulator

1. In Android Studio, click the **Device Manager** icon (phone icon) in the toolbar
2. Click **"Create Device"** if you don't have one yet
3. Select a device (e.g., Pixel 5)
4. Select a system image (API 33 or higher recommended)
5. Click **"Finish"**
6. Start the emulator by clicking the **Play** button next to it

### Step 6: Run the App

1. Make sure your emulator is running
2. In Android Studio, click the **Run** button (green play icon) or press `Shift + F10`
3. Select your emulator from the device list
4. Click **"OK"**

The app will build and install on the emulator. This may take a minute or two the first time.

## Testing Login/Signup

Once the app is running:

1. You should see the login screen
2. If you don't have an account, click **"Sign up"** to create one
3. Enter your email and password
4. The app will connect to `http://10.0.2.2:3001` (which is your localhost:3001)

## Troubleshooting

### "Gradle sync failed"
- Make sure Java 17 is installed: `java -version`
- Check that `JAVA_HOME` is set correctly
- Try: **File > Invalidate Caches / Restart**

### "Build failed"
- Make sure you ran `npm run build` first
- Make sure you ran `npx capacitor sync android`
- Check the **Build** tab in Android Studio for specific errors

### "App crashes on startup"
- Check **Logcat** in Android Studio for error messages
- Make sure the backend server is running
- Verify the API URL is correct (should be `http://10.0.2.2:3001` for emulator)

### "Network error" when trying to login
- Verify backend server is running: Open `http://localhost:3001/api/db-check` in your browser
- Check that the emulator can reach your computer (should work automatically with `10.0.2.2`)
- Check Logcat for network errors

### "Cannot find module" errors
- Run `npm install` in the project root
- Run `npx capacitor sync android` again

## Quick Commands Reference

```bash
# Build web app
npm run build

# Sync to Android
npx capacitor sync android

# Start backend (in backend folder)
cd backend && npm start

# Or use the combined command (builds and syncs)
npm run build && npx capacitor sync android
```

## Next Steps

Once everything is working:
- You can make changes to the React code
- Rebuild with `npm run build`
- Sync with `npx capacitor sync android`
- The app will hot-reload if you have Live Reload enabled in Android Studio

## Notes

- The emulator uses `10.0.2.2` to access `localhost` on your computer
- For real devices, you'll need to use your computer's IP address (see `ANDROID_NETWORK_SETUP.md`)
- The app is configured to allow cleartext HTTP traffic for development

