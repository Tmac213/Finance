# Diagnostic Steps for Fixed Dues Sync Issue

## Step 1: Verify Database Schema

**Check if the migration was run:**

```sql
DESCRIBE fixed_dues;
```

You should see `start_date` and `end_date` columns. If not, run:

```sql
ALTER TABLE fixed_dues ADD COLUMN start_date DATE NULL;
ALTER TABLE fixed_dues ADD COLUMN end_date DATE NULL;
```

## Step 2: Check Backend Logs

**When adding a fixed due on web, check backend console for:**

1. `[Backend] Creating fixed due: ...` - Should appear
2. `[Backend] Fixed due ... created successfully` - Should appear
3. Any SQL errors like "Unknown column 'start_date'" - This means migration wasn't run

## Step 3: Verify Data is on Server

**Test the API directly:**

```bash
# Get your auth token from browser localStorage or network tab
curl -X GET http://localhost:3001/api/fixed-dues \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq
```

**Or check backend logs:**
- Look for `[Backend] Found X fixed dues for user ...`
- If it shows 0, the data wasn't saved

## Step 4: Check Web Console

**On web (after adding fixed due):**

Open browser console (F12) and look for:
- `[Sync] Sending new fixed due to server: ...`
- `[Sync] Fixed dues sync complete: X sent, Y updated, Z deleted`
- Any error messages

## Step 5: Check Mobile Logs

**On mobile (Android Studio Logcat):**

Filter by `[Sync]` or `[FinanceContext]` and look for:
- `[Sync] Starting receiveAll for user: ...`
- `[Sync] Received X fixed dues from server`
- `[Sync] ✓ Adding NEW fixed due: ...`
- `[loadLocalData] Loading X fixed dues from database`
- `[loadLocalData] State updated with X fixed dues`

## Step 6: Common Issues and Fixes

### Issue: "Unknown column 'start_date' in 'field list'"
**Fix:** Run the database migration (see Step 1)

### Issue: Backend shows "Fixed due created successfully" but GET returns 0
**Possible causes:**
- Wrong user_id
- Data was deleted
- Database transaction rolled back

### Issue: Mobile receives 0 fixed dues from server
**Check:**
- Are you logged in with the same account on both web and mobile?
- Does the GET endpoint return data? (see Step 3)
- Check user IDs match

### Issue: Mobile receives data but UI doesn't update
**Check:**
- Look for `[loadLocalData]` logs
- Check if `setFixedDues` is being called
- Verify component is using `fixedDues` from context

## Step 7: Manual Sync Test

**On mobile:**
1. Go to Settings page
2. Click "Receive" button to manually trigger sync
3. Watch Logcat for sync activity
4. Check if fixed dues appear

## Quick Fix Checklist

- [ ] Database migration run (start_date and end_date columns exist)
- [ ] Backend server restarted after code changes
- [ ] Backend logs show "Fixed due created successfully"
- [ ] GET /api/fixed-dues returns the fixed dues
- [ ] Web console shows sync completed
- [ ] Mobile logs show fixed dues received
- [ ] Mobile logs show loadLocalData called
- [ ] Same user account on both web and mobile

