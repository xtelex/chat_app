# Read Receipts Troubleshooting Guide

## Issue: Blue Checkmarks Not Showing on Mobile

If read receipts (blue checkmarks) are still not working after the fixes, follow this troubleshooting guide.

## Step 1: Check Browser Console Logs

### On Mobile (Chrome Remote Debugging)
1. Connect Android phone via USB
2. Open `chrome://inspect` on desktop Chrome
3. Click "Inspect" next to your device
4. Open Console tab
5. Send a message and open the chat on the receiving phone
6. Look for `[Read Receipts]` logs

### Expected Logs (Recipient Side)
```
[Read Receipts] Chat opened, marking messages as read for: abc-123-def
[Read Receipts] User ID: xyz-789
[Read Receipts] Session token exists: true
[Read Receipts] Supabase exists: true
[Read Receipts] Calling backend API...
[Read Receipts] Backend response status: 200
[Read Receipts] Backend response: { success: true, markedCount: 3 }
[Read Receipts] ✅ Backend marked 3 messages as read
```

### Expected Logs (Sender Side)
```
[Read Receipts] Real-time UPDATE received: { id: 'msg-1', read_at: '2026-04-23T...' }
[Read Receipts] Updating message read status: { id: 'msg-1', read_at: '2026-04-23T...' }
```

## Step 2: Common Issues and Solutions

### Issue A: No `[Read Receipts]` Logs at All
**Cause:** JavaScript error preventing code from running

**Solution:**
1. Check console for errors (red text)
2. Look for errors before `[Read Receipts]` logs
3. Share error message for debugging

### Issue B: "Backend response status: 401"
**Cause:** Authentication token expired or invalid

**Solution:**
1. Log out and log back in
2. Check if `VITE_API_BASE_URL` is correct in `client/.env`
3. Verify backend is running (`npm run dev` in `server/`)

### Issue C: "Backend response status: 500"
**Cause:** Backend error or database issue

**Solution:**
1. Check backend console for errors
2. Verify Supabase credentials in `server/.env`
3. Check if `direct_messages` table exists

### Issue D: "✅ Backend marked 3 messages" but No Blue Checkmarks
**Cause:** Real-time subscription not receiving updates

**Solution:**
1. Check if Supabase Realtime is enabled (see Step 3)
2. Verify RLS policies allow reading `read_at` field
3. Check sender's console for UPDATE logs

### Issue E: "❌ Supabase error: permission denied"
**Cause:** RLS policies blocking update

**Solution:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Check `direct_messages` table policies
3. Ensure UPDATE policy allows setting `read_at` for recipient

## Step 3: Verify Supabase Realtime is Enabled

### Check in Supabase Dashboard
1. Go to **Database** → **Replication**
2. Find `direct_messages` table
3. Ensure **Realtime** is **enabled** (toggle should be ON)
4. If disabled, enable it and wait 30 seconds

### Check Publication
1. Go to **Database** → **Publications**
2. Find `supabase_realtime` publication
3. Ensure `direct_messages` table is included
4. If not, run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
```

## Step 4: Verify RLS Policies

### Check Read Policy
Run this query in SQL Editor:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'direct_messages' 
AND policyname LIKE '%read%';
```

Should return a policy that allows users to read messages where they are sender OR recipient.

### Check Update Policy
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'direct_messages' 
AND policyname LIKE '%update%';
```

Should return a policy that allows recipients to update `read_at` field.

### If Missing, Add This Policy
```sql
-- Allow recipients to mark messages as read
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON direct_messages;
CREATE POLICY "Recipients can mark messages as read"
ON direct_messages FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);
```

## Step 5: Test Backend Endpoint Directly

### Using curl (from terminal)
```bash
# Get your access token from browser console:
# localStorage.getItem('supabase.auth.token')

curl -X PATCH \
  'http://localhost:3001/api/dm/CONTACT_ID/read' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### Expected Response
```json
{
  "success": true,
  "markedCount": 3
}
```

### If Error
- 401: Token invalid, log in again
- 404: Backend route not found, check `server/routes/directMessageRoutes.js`
- 500: Database error, check backend console

## Step 6: Check Database Directly

### Query Unread Messages
```sql
SELECT id, sender_id, recipient_id, text, read_at, created_at
FROM direct_messages
WHERE recipient_id = 'YOUR_USER_ID'
AND read_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Manually Mark as Read (Test)
```sql
UPDATE direct_messages
SET read_at = NOW()
WHERE recipient_id = 'YOUR_USER_ID'
AND sender_id = 'CONTACT_ID'
AND read_at IS NULL;
```

If this works but the app doesn't, the issue is in the app code or RLS policies.

## Step 7: Network Issues

### Check API Calls in Network Tab
1. Open browser DevTools → Network tab
2. Filter for "read"
3. Send a message and open chat on receiving phone
4. Look for `PATCH /api/dm/.../read` request

### Check Request
- **Status:** Should be 200
- **Headers:** Should have `Authorization: Bearer ...`
- **Response:** Should be `{ success: true, markedCount: N }`

### If Request Fails
- **Status 0 / Failed:** Network issue, check internet connection
- **Status 401:** Auth issue, log in again
- **Status 404:** Backend not running or wrong URL
- **Status 500:** Backend error, check server logs

## Step 8: Mobile-Specific Issues

### iOS Safari
- May not support visibility API fully
- Relies on focus event instead
- Check if focus event is firing:
```javascript
window.addEventListener('focus', () => {
  console.log('Window focused!');
});
```

### Android Chrome
- Should support visibility API
- Check if visibility change is firing:
```javascript
document.addEventListener('visibilitychange', () => {
  console.log('Visibility changed:', document.hidden);
});
```

### Mobile Browser Cache
- Clear browser cache and reload
- Try in incognito/private mode
- Force refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Step 9: Supabase Connection Issues

### Check Supabase Client
In browser console:
```javascript
console.log('Supabase:', window.supabase);
console.log('User:', window.supabase?.auth?.user());
```

Should show Supabase client and current user.

### Check Realtime Connection
```javascript
const channel = window.supabase.channel('test');
channel.subscribe((status) => {
  console.log('Channel status:', status);
});
```

Should log: `Channel status: SUBSCRIBED`

If not, Supabase realtime is not connecting.

## Step 10: Last Resort - Manual Refresh

If all else fails, add a manual refresh button to force check for read receipts.

### Add to ChatPage.jsx
```javascript
const forceRefreshReadReceipts = async () => {
  if (!dmTargetId) return;
  console.log('[Read Receipts] Manual refresh triggered');
  await markMessagesAsReadForContact(dmTargetId);
  
  // Also reload messages to get latest read_at values
  await loadDirectMessages(dmTargetId);
};
```

### Add Button to UI
```jsx
<button 
  onClick={forceRefreshReadReceipts}
  className="text-xs text-white/60 hover:text-white"
>
  Refresh Read Status
</button>
```

## Common Root Causes

### 1. Supabase Realtime Not Enabled
- **Symptom:** Messages marked as read in DB but UI doesn't update
- **Fix:** Enable realtime for `direct_messages` table

### 2. RLS Policies Too Restrictive
- **Symptom:** "permission denied" errors in console
- **Fix:** Update RLS policies to allow recipients to update `read_at`

### 3. Backend Not Running
- **Symptom:** All API calls fail with network errors
- **Fix:** Start backend with `npm run dev` in `server/`

### 4. Wrong API URL
- **Symptom:** 404 errors for all API calls
- **Fix:** Check `VITE_API_BASE_URL` in `client/.env`

### 5. Expired Auth Token
- **Symptom:** 401 errors for API calls
- **Fix:** Log out and log back in

### 6. Mobile Browser Lifecycle
- **Symptom:** Works on desktop but not mobile
- **Fix:** Already implemented with visibility API + focus events

## Debug Checklist

- [ ] Browser console shows `[Read Receipts]` logs
- [ ] Backend API returns 200 status
- [ ] Backend response shows `markedCount > 0`
- [ ] Supabase realtime is enabled for `direct_messages`
- [ ] RLS policies allow UPDATE on `read_at` field
- [ ] Sender's console shows UPDATE events
- [ ] Network tab shows successful PATCH requests
- [ ] Database shows `read_at` is set after opening chat
- [ ] Both phones have internet connection
- [ ] Both users are logged in with valid tokens

## Still Not Working?

If you've tried everything and it still doesn't work:

1. **Share console logs** - Copy all `[Read Receipts]` logs from both phones
2. **Share network logs** - Screenshot of Network tab showing API calls
3. **Share database state** - Run the SQL query to show unread messages
4. **Share RLS policies** - Export policies for `direct_messages` table

This will help identify the exact issue.
