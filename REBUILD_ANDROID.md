# Rebuilding Android Project

## Steps to Rebuild Android Project

The Android directory is currently locked by another process (likely Android Studio or Gradle daemon).

### Step 1: Close Android Studio
1. Close Android Studio completely
2. Make sure no Gradle daemon processes are running

### Step 2: Delete Android Directory
Run this command in PowerShell (as Administrator if needed):
```powershell
Remove-Item -Path "android" -Recurse -Force
```

Or manually delete the `android` folder from Windows Explorer.

### Step 3: Rebuild the Project
Once the directory is deleted, run these commands:

```bash
# Build the web app
npm run build

# Add Android platform
npx cap add android

# Sync the project
npx cap sync android
```

### Step 4: Open in Android Studio
```bash
npx cap open android
```

## Alternative: Force Delete (if Step 2 fails)

If the directory is still locked, try:

1. **Kill Gradle processes:**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*gradle*"} | Stop-Process -Force
   ```

2. **Kill Java processes (be careful - this will close all Java apps):**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*java*"} | Stop-Process -Force
   ```

3. **Then try deleting again:**
   ```powershell
   Remove-Item -Path "android" -Recurse -Force
   ```

## After Rebuilding

Once the Android project is recreated:
1. Open Android Studio
2. Open the `android` folder
3. Let Gradle sync complete
4. Build and run the app

