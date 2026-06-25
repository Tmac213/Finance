# JWT Authentication Troubleshooting

## Issue: "JsonWebTokenError: invalid signature"

This error occurs when JWT tokens stored in the browser don't match the JWT_SECRET configured on the server.

## Common Causes

1. **Stale tokens in browser storage** - Old tokens signed with a different JWT_SECRET
2. **JWT_SECRET mismatch** - Frontend and backend using different secrets
3. **Expired tokens** - Tokens that have passed their expiration date

## Solutions

### Solution 1: Automatic Handling (New!)

**The app now automatically handles invalid tokens!** When a 401 error is detected:
- The app automatically clears the invalid token from storage
- You are redirected to the login page
- Simply log in again to get a fresh token

**Note:** If you're still seeing the error after this update, try Solution 2 below.

### Solution 2: Manual Clear Browser Storage

If automatic handling doesn't work, manually clear the stored authentication tokens:

1. Open your browser's Developer Tools (F12)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** in the left sidebar
4. Select your app's domain (usually `http://localhost:5173` or similar)
5. Delete the following keys:
   - `auth.token`
   - `auth.user`
6. Refresh the page and log in again

**Or use the browser console:**
```javascript
localStorage.removeItem('auth.token');
localStorage.removeItem('auth.user');
location.reload();
```

### Solution 2: Verify JWT_SECRET Configuration

1. Check that your `.env` file in the `backend` directory has `JWT_SECRET` set:
   ```env
   JWT_SECRET=dev-secret-change-in-production
   ```

2. Restart the backend server after changing JWT_SECRET:
   ```bash
   cd backend
   node server.js
   ```

3. **Important**: If you change `JWT_SECRET`, all existing tokens become invalid. Users will need to log in again.

### Solution 3: Generate a Secure JWT_SECRET

For production, generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then update your `.env` file with the generated secret.

## Verification

After clearing storage and restarting the server:

1. The server should log: `[Backend] JWT_SECRET configured: Yes (using environment variable)`
2. Log in again through the frontend
3. New tokens will be signed with the current JWT_SECRET
4. Authentication errors should stop

## Prevention

- Always use the same `JWT_SECRET` across server restarts
- Don't change `JWT_SECRET` without notifying users (they'll need to re-authenticate)
- In production, use a strong, randomly generated secret stored securely

