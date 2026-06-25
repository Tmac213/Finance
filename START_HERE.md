# 🚀 Start Here - Android Studio Setup

## Quick Start (3 Steps)

### 1️⃣ Build the Web App
```bash
npm run build
```

### 2️⃣ Sync to Android
```bash
npx capacitor sync android
```

### 3️⃣ Open in Android Studio
1. Open Android Studio
2. File > Open > Select the `android` folder
3. Wait for Gradle sync to complete

### 4️⃣ Start Backend Server (Required!)
```bash
cd backend
npm start
```
Keep this terminal open - the server must be running!

### 5️⃣ Run the App
1. In Android Studio, create/start an Android emulator (API 33+)
2. Click the green **Run** button (▶️)
3. Select your emulator
4. Wait for the app to install and launch

## ✅ What Should Happen

- App opens on the emulator
- You see the login screen
- You can create an account or log in
- Backend connects via `http://10.0.2.2:3001` (emulator's localhost)

## ❌ Common Issues

**"Gradle sync failed"**
→ Make sure Java 17 is installed and JAVA_HOME is set

**"Network error" when logging in**
→ Make sure the backend server is running (`cd backend && npm start`)

**"Build failed"**
→ Make sure you ran `npm run build` and `npx capacitor sync android` first

## 📚 More Details

- **Full Guide**: See `ANDROID_STUDIO_QUICKSTART.md`
- **Network Setup**: See `ANDROID_NETWORK_SETUP.md` (for real devices)
- **Troubleshooting**: Check Android Studio's Logcat for errors

## 🔄 After Making Code Changes

1. `npm run build` - Rebuild web app
2. `npx capacitor sync android` - Sync to Android
3. Run again in Android Studio (or use Live Reload)

---

**Ready? Start with step 1 above!** 🎯

