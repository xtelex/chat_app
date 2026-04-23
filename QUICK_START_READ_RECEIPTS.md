# Quick Start - Read Receipts (5 Minutes)

## ⚡ Fast Setup

### 1. Run This SQL (2 minutes)
Copy and paste into **Supabase Dashboard → SQL Editor**:

```sql
-- Add read receipt columns
alter table public.direct_messages
add column if not exists delivered_at timestamptz,
add column if not exists read_at timestamptz;

-- Add index for performance
create index if not exists direct_messages_read_at_idx 
on public.direct_messages (recipient_id, read_at) 
where read_at is null;

-- Allow recipients to mark messages as read
drop policy if exists "Recipients can mark messages as read" 
on public.direct_messages;

create policy "Recipients can mark messages as read"
on public.direct_messages for update to authenticated
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

-- Enable realtime
alter publication supabase_realtime 
add table public.direct_messages;

-- Refresh schema
select pg_notify('pgrst', 'reload schema');
```

Click **Run** → Wait 10 seconds → Done! ✅

### 2. Restart Your Servers (1 minute)

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client  
npm run dev
```

### 3. Test It! (2 minutes)

1. Open http://localhost:3000 in two browser windows
2. Log in as two different users
3. Send a message from User A to User B
4. See gray checkmarks ✓✓ on User A's screen
5. Open the chat on User B's screen
6. Watch checkmarks turn blue ✓✓ on User A's screen!

## 📱 Test on Phone

### Quick Method (Same WiFi)

1. Find your computer's IP:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
   Look for something like `192.168.1.100`

2. On your phone, visit:
   ```
   http://192.168.1.100:3000
   ```

3. Send messages and watch checkmarks change!

## ✅ Verify It's Working

### Check 1: Database
```sql
SELECT text, read_at FROM direct_messages ORDER BY created_at DESC LIMIT 5;
```
Should show `read_at` timestamps for messages you've opened.

### Check 2: Console
Open browser DevTools → Console → Should see:
```
[Read Receipts] Marking messages as read for contact: ...
[Read Receipts] Backend response: { success: true, markedCount: 3 }
```

### Check 3: Visual
Send a message → See ✓✓ (gray) → Recipient opens chat → See ✓✓ (blue)

## 🐛 Not Working?

### Problem: No checkmarks at all
**Fix:** Checkmarks only show on messages YOU sent (right side, pink bubbles)

### Problem: Checkmarks stay gray
**Fix:** Make sure you ran the SQL migration above

### Problem: SQL error
**Fix:** The table might already have these columns. That's OK! Just continue.

### Problem: Can't reach from phone
**Fix:** Make sure phone and computer are on same WiFi network

## 📖 Full Documentation

For detailed explanations, see:
- `READ_RECEIPTS_SUMMARY.md` - Complete overview
- `READ_RECEIPTS_FLOW.md` - Visual diagrams
- `TROUBLESHOOTING_READ_RECEIPTS.md` - Detailed debugging

## 🎉 That's It!

You now have WhatsApp-style read receipts! 

**Gray ✓✓** = Delivered  
**Blue ✓✓** = Read

Enjoy! 🚀
