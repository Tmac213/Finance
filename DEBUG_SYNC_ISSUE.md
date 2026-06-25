# Debugging Fixed Dues Sync Issue

## Steps to Debug

### 1. Check if Data is on Server

**On Web (after adding a fixed due):**
1. Open browser console (F12)
2. Check for logs like:
   - `[Sync] Sending fixed due to server: ...`
   - `[Sync] Fixed dues sync complete: X sent`

**Verify on Server:**
- Check backend logs to see if the POST request was received
- Or test the API directly:
  ```bash
  curl -X GET http://localhost:3001/api/fixed-dues \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```

### 2. Check Mobile App Sync

**In Android Studio Logcat:**
1. Filter by "ReactNativeJS" or "chromium"
2. Look for these logs:
   - `[Sync] Starting receiveAll for user: ...`
   - `[Sync] Fetching fixed dues from server...`
   - `[Sync] Received X fixed dues from server`
   - `[Sync] Adding new fixed due from server: ...`
   - `[FinanceContext] Refreshing data from remote...`
   - `[loadLocalData] Loading X fixed dues from database`

### 3. Manual Refresh

**On Mobile:**
1. Go to Fixed Dues page
2. Click the "Refresh" button (top right)
3. Watch Logcat for sync activity
4. Check if fixed dues appear

### 4. Check Database

**On Mobile (via Logcat):**
- Look for logs showing how many fixed dues are in the database
- Check if `loadLocalData` is being called after sync

### 5. Common Issues

**Issue: No logs appearing**
- Sync might not be running
- Check if user is logged in
- Check if `navigator.onLine` is true
- Check if API_BASE_URL is correct

**Issue: "Received 0 fixed dues from server"**
- Data might not be on server
- Check if user IDs match
- Check backend logs

**Issue: "Adding new fixed due" but it doesn't appear**
- Check `loadLocalData` logs
- Check if data is being filtered out (deleted flag)
- Check if UI is updating

**Issue: Sync runs but data doesn't update**
- Check if `loadLocalData` is called after `receiveAll`
- Check if state is being updated
- Try manual refresh button

## Quick Test

1. **Add fixed due on web**
2. **Check web console** - should see sync logs
3. **On mobile, click Refresh button**
4. **Check Logcat** - should see:
   - `[Sync] Starting receiveAll`
   - `[Sync] Received X fixed dues`
   - `[Sync] Adding new fixed due`
   - `[loadLocalData] Loading X fixed dues`
5. **Fixed due should appear**

## If Still Not Working

1. **Check API URL**: Make sure mobile is using correct API URL
   - Emulator: `http://10.0.2.2:3001`
   - Real device: Your computer's IP

2. **Check Authentication**: Make sure token is being sent
   - Look for "Authorization" header in API requests

3. **Check Network**: Make sure mobile can reach backend
   - Try accessing `http://10.0.2.2:3001/api/db-check` from mobile browser

4. **Check User ID**: Make sure same user is logged in on both
   - User IDs must match for sync to work

