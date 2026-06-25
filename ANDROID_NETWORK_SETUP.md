# Android Network Setup Guide

## Issue Fixed
The login and signup functionality on Android has been fixed. The main issues were:
1. **API Path Mismatch**: The frontend was calling `/auth/login` but the backend expects `/api/auth/login`
2. **Network Configuration**: Improved Android network security configuration

## For Android Emulator
The app is configured to use `http://10.0.2.2:3001` by default, which works automatically for Android emulator.

## For Real Android Device

If you're testing on a **real Android device**, you need to configure the API URL to point to your development machine's IP address.

### Steps:

1. **Find your computer's IP address:**
   - Windows: Open Command Prompt and run `ipconfig`
   - Look for "IPv4 Address" (e.g., `192.168.1.100`)
   - Mac/Linux: Run `ifconfig` or `ip addr`

2. **Create a `.env` file** in the project root (if it doesn't exist):
   ```
   VITE_ANDROID_API_URL=http://YOUR_IP_ADDRESS:3001
   ```
   Example:
   ```
   VITE_ANDROID_API_URL=http://192.168.1.100:3001
   ```

3. **Make sure your backend server is running** and accessible:
   ```bash
   cd backend
   npm start
   ```
   The server should be listening on `0.0.0.0:3001` (which it does by default)

4. **Make sure your Android device and computer are on the same Wi-Fi network**

5. **Rebuild the app:**
   ```bash
   npm run build
   npx capacitor sync android
   ```

6. **Test the connection** - Try logging in or signing up

## Troubleshooting

### "Network error" message
- Verify the backend server is running: `http://localhost:3001/api/db-check`
- Check that your device and computer are on the same network
- Verify the IP address is correct
- Check Windows Firewall isn't blocking port 3001

### Still not working?
1. Try accessing the API from your device's browser: `http://YOUR_IP:3001/api/db-check`
2. If that works, the issue might be with the app configuration
3. Check Android Studio's Logcat for detailed error messages

## Notes
- The network security config allows cleartext HTTP traffic for development
- For production, you should use HTTPS
- The API base URL can be overridden via the `VITE_ANDROID_API_URL` environment variable

