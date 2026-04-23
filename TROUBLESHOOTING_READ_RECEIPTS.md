# Troubleshooting Read Receipts on Mobile

## 🔍 How to Debug

### Step 1: Open Browser Console on Your Phone

**On Android Chrome:**
1. Connect phone to computer via USB
2. On computer, open Chrome and go to `chrome://inspect`
3. Find your phone's browser and click "Inspect"
4. Look at the Console tab

**On iPhone Safari:**
1. Enable Web Inspector: Settings → Safari → Advanced → Web Inspector
2. Connect to Mac via USB
3. On Mac: Safari → Develop → [Your iPhone] → localhost
4. Look at Console tab

### Step 2: Check Console Logs

When you open a chat, you should see:
```
[Read Receipts] Marking messages as read for contact: <uuid>
[Read Receipts] Backend response: { success: true, markedCount: 3 }
```

When the other person opens the chat, you should see:
```
[Read Receipts] Real-time UPDATE received: { id: "...", read_at: "2026-04-23T..." }
[Read Receipts] Updating message read status: { id: "...", read_at: "..." }
```

### Step 3: Verify Database Migration

Run this in Supabase SQL Editor:
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'direct_messages' 
AND column_name IN ('read_at', 'delivered_at');
```

You should see:
```
column_name   | data_type
--------------+-------------------------
delivered_at  | timestamp with time zone
read_at       | timestamp with time zone
```

### Step 4: Check Existing Messages

Run this to see if messages have read_at data:
```sql
SELECT id, text, sender_id, recipient_id, read_at, created_at
FROM direct_messages
ORDER BY created_at DESC
LIMIT 10;
```

If `read_at` is NULL for all messages, they haven't been marked as read yet.

### Step 5: Manually Test Read Receipt

1. Send a message from Phone A to Phone B
2. On Phone B, open the chat
3. Check console logs on Phone B (should see "Marking messages as read")
4. Check console logs on Phone A (should see "Real-time UPDATE received")
5. Look at Phone A's screen - checkmarks should turn blue

## 🐛 Common Issues

### Issue 1: Checkmarks Not Visible
**Symptom:** No checkmarks appear at all

**Solution:** The checkmarks are now larger (14px) and have thicker strokes. Make sure you're looking at messages YOU sent (right side, pink bubbles).

### Issue 2: Checkmarks Stay Gray
**Symptom:** Checkmarks appear but never turn blue

**Possible causes:**
1. **Database migration not run** → Run the migration SQL
2. **Real-time not enabled** → Check Supabase Realtime settings
3. **Backend not running** → Check if http://localhost:3001 is accessible
4. **Network issue** → Check if phone can reach backend

### Issue 3: Backend Not Reachable from Phone
**Symptom:** Console shows "Backend failed, falling back to Supabase"

**Solution:** 
- If testing on same WiFi: Use your computer's local IP instead of localhost
- Update `client/.env`:
  ```
  VITE_API_BASE_URL=http://192.168.1.100:3001
  ```
  (Replace with your actual IP - run `ipconfig` on Windows or `ifconfig` on Mac/Linux)

### Issue 4: Real-time Updates Not Working
**Symptom:** Messages marked as read in database but UI doesn't update

**Check:**
1. Supabase Realtime is enabled for `direct_messages` table
2. Run this SQL to enable:
   ```sql
   alter publication supabase_realtime add table public.direct_messages;
   ```
3. Verify in Supabase Dashboard → Database → Replication

## 📱 Mobile-Specific Considerations

### Background Tab Behavior
- iOS Safari pauses JavaScript when tab is in background
- Android Chrome throttles real-time connections
- **Solution:** Keep app in foreground for real-time updates

### Network Switching
- Switching between WiFi and cellular can break WebSocket connections
- **Solution:** Supabase Realtime auto-reconnects, but may take 5-10 seconds

### Battery Saver Mode
- Some phones kill WebSocket connections to save battery
- **Solution:** Disable battery optimization for your browser

## 🧪 Test Scenarios

### Test 1: Basic Read Receipt
1. User A sends message to User B
2. User B opens chat
3. User A should see blue checkmarks within 2 seconds

### Test 2: Multiple Messages
1. User A sends 3 messages
2. User B opens chat
3. All 3 messages should show blue checkmarks

### Test 3: Offline → Online
1. User A sends message
2. User B is offline
3. User B comes online and opens chat
4. User A should see checkmarks turn blue

## 🔧 Manual Fix

If automatic marking doesn't work, you can manually mark messages as read:

```javascript
// In browser console on Phone B (recipient)
const contactId = 'paste-sender-uuid-here';
const response = await fetch(`http://localhost:3001/api/dm/${contactId}/read`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  }
});
console.log(await response.json());
```

## 📊 Verify It's Working

### Database Check
```sql
-- See which messages have been read
SELECT 
  sender_id,
  recipient_id,
  text,
  created_at,
  read_at,
  CASE 
    WHEN read_at IS NOT NULL THEN 'READ'
    ELSE 'UNREAD'
  END as status
FROM direct_messages
ORDER BY created_at DESC
LIMIT 20;
```

### Network Check
Open browser DevTools → Network tab:
- Look for `PATCH /api/dm/:contactId/read` requests
- Should return `200 OK` with `{ success: true, markedCount: N }`

## 🎯 Expected Behavior

### Sender's View (Person who sent message)
```
Your message text here          12:34 PM ✓✓
```
- Gray checkmarks = Delivered (message saved to database)
- Blue checkmarks = Read (recipient opened the chat)

### Recipient's View (Person who received message)
```
Their message text here         12:34 PM
```
- No checkmarks shown (you don't need to know when you read your own messages)

## 🚀 Next Steps

If still not working after all checks:
1. Share console logs from both phones
2. Share SQL query results
3. Check if Supabase Realtime is enabled in your project settings
4. Verify RLS policies allow updates to `read_at` column
