# Fixed Dues Sync Fix

## Problem
Fixed dues added on web were not appearing on mobile devices.

## Root Causes Identified

1. **Sync logic issue**: When receiving fixed dues from server, if a local record was marked as "dirty" (unsent changes), it wouldn't update from server, even if the server had newer data.

2. **No foreground sync**: The app wasn't syncing when it came to the foreground, so users had to wait for the periodic sync (every 5 seconds).

3. **Missing logging**: No visibility into what was happening during sync, making debugging difficult.

## Fixes Applied

### 1. Improved Sync Logic (`src/lib/dexiesync.ts`)
- **Better handling of dirty records**: When a fixed due exists on the server but is marked dirty locally, it now marks it as synced (since server already has it)
- **Added console logging**: Now logs when fixed dues are received, added, or updated during sync
- **Proper deletion handling**: Ensures deleted fixed dues are properly handled

### 2. Enhanced Sync Triggers (`src/contexts/FinanceContext.tsx`)
- **Foreground sync**: App now syncs when it comes to foreground (visibility change)
- **Focus sync**: App syncs when window gains focus
- **Reduced sync interval**: Changed from 1 second to 5 seconds to reduce API calls while still being responsive
- **Better logging**: Added logging to track when sync happens

## How It Works Now

1. **Adding on Web**:
   - Fixed due is saved locally with `dirty: 1, synced: 0`
   - `syncData()` is called which triggers `syncAll()`
   - `sendAll()` sends the fixed due to the server
   - Server saves it
   - `receiveAll()` confirms it's on the server

2. **Receiving on Mobile**:
   - Every 5 seconds, `receiveAll()` fetches all fixed dues from server
   - When app comes to foreground, sync happens immediately
   - New fixed dues from server are added to local database
   - `loadLocalData()` refreshes the UI with new data

## Testing

To verify the fix works:

1. **On Web**: Add a fixed due
2. **On Mobile**: 
   - Wait up to 5 seconds, OR
   - Switch away from the app and come back (triggers immediate sync)
   - The fixed due should appear

## Debugging

Check the browser console (web) or Logcat (Android) for sync logs:
- `[Sync] Received X fixed dues from server`
- `[Sync] Adding new fixed due from server: ...`
- `[FinanceContext] Refreshing data from remote...`
- `[FinanceContext] Sync stats: ...`

## Manual Sync

Users can also manually trigger sync from the Settings page:
- Click "Receive" button to fetch latest data from server
- Click "Send" button to send local changes to server

