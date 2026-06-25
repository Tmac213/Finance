# Mobile Connectivity Guide (Android)

## 1. Configure API Address (Critical)

You are likely testing on a Real Device, which cannot access `localhost` or `10.0.2.2`. You must use your computer's local IP address.

1.  **Find your IP:**
    *   Open terminal.
    *   Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux).
    *   Look for "IPv4 Address". It usually looks like `192.168.1.X` or `10.0.0.X`.

2.  **Create Config File:**
    *   Create a file named `.env.local` in the project root folder.
    *   Add this line (replace X with your actual numbers):
        ```
        VITE_ANDROID_API_URL=http://192.168.1.15:3001
        ```

## 2. Rebuild and Sync

After creating `.env.local`, you MUST run these commands to update the app on your phone:

```bash
npm run build
npx cap sync android
```

## 3. Run and Verify

1.  Open the project in Android Studio.
2.  Run the app on your device.
3.  **Look at the black DEBUG INFO box on the Login screen.**
    *   It should say `API URL: http://192.168.1.15:3001` (your IP).
    *   If it still says `10.0.2.2`, the update didn't work. Try running the build commands again.
