# Testing Fixed Dues Sync (Web → Mobile)

## Steps to Test

1. **Rebuild the app:**
   ```bash
   npm run build
   npx capacitor sync android
   ```

2. **On Web:**
   - Add a fixed due (e.g., "Rent", $1000, monthly, Jan 2024 - Dec 2024)
   - Open browser console (F12)
   - Look for sync logs

3. **On Mobile (Android Studio):**
   - Open Logcat
   - Filter by: `[Sync]` or `[FinanceContext]` or `[loadLocalData]`
   - Go to Fixed Dues page
   - Click "Refresh" button
   - Watch the logs

## What to Look For in Logs

### Expected Log Sequence:

1. `[Sync] Starting receiveAll for user: ...`
2. `[Sync] Fetching fixed dues from /api/fixed-dues...`
3. `[Sync] Received X fixed dues from server`
4. `[Sync] Sample fixed due from server: {...}` (shows the data structure)
5. `[Sync] Processing X fixed dues`
6. `[Sync] ✓ Adding NEW fixed due: ...` (for each new one)
7. `[Sync] Fixed dues complete: X added, Y updated, Z skipped`
8. `[Sync] Total fixed dues in local DB after sync: X`
9. `[FinanceContext] Reloading local data after sync...`
10. `[loadLocalData] Loading X fixed dues from database`
11. `[loadLocalData] Mapped X fixed dues to UI format`
12. `[loadLocalData] State updated with X fixed dues`

## Common Issues to Check

### Issue 1: "Received 0 fixed dues from server"
- **Cause**: Data not on server or wrong user ID
- **Fix**: Check if fixed due was actually saved on web, verify user is logged in with same account

### Issue 2: "Adding NEW fixed due" but count doesn't increase
- **Cause**: Database add might be failing
- **Fix**: Check for error logs, verify database schema

### Issue 3: "Total fixed dues in local DB: X" but "Loading 0 fixed dues"
- **Cause**: Data is in DB but being filtered out
- **Fix**: Check deleted flag, check user_id matching

### Issue 4: "State updated with X fixed dues" but UI shows 0
- **Cause**: React state not updating or component not re-rendering
- **Fix**: Check if component is using the state correctly

## Database Schema Check

The backend tries to insert `start_date` and `end_date`, but the schema might not have these columns. If you see SQL errors in backend logs, you may need to add these columns:

```sql
ALTER TABLE fixed_dues ADD COLUMN start_date DATE;
ALTER TABLE fixed_dues ADD COLUMN end_date DATE;
```

## Quick Debug Commands

**Check what's on server:**
```bash
curl -X GET http://localhost:3001/api/fixed-dues \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq
```

**Check backend logs:**
- Look for SQL errors
- Look for INSERT/UPDATE statements

