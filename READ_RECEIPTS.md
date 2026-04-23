# Read Receipts Feature

## Overview
This feature allows users to see if their messages have been delivered or read by the recipient.

## How It Works

### Visual Indicators
- **Double gray checkmarks (✓✓)**: Message has been delivered but not yet read
- **Double blue checkmarks (✓✓)**: Message has been read by the recipient
- Timestamp shows when the message was sent

### Database Schema
The `direct_messages` table now includes:
- `delivered_at`: Timestamp when message was delivered (currently auto-set on insert)
- `read_at`: Timestamp when message was read by recipient

### Backend API
New endpoint: `PATCH /api/dm/:contactId/read`
- Marks all unread messages from a contact as read
- Returns count of messages marked as read

### Frontend Behavior
1. **Auto-mark as read**: When a user opens a chat, all messages from that contact are automatically marked as read
2. **Real-time updates**: Read status updates in real-time using Supabase Realtime
3. **Visual feedback**: Sent messages show delivery/read status with checkmark indicators

## Setup Instructions

### 1. Run the Migration
In Supabase Dashboard → SQL Editor, run:
```sql
-- File: supabase/migrations/20260423000000_add_read_receipts.sql
```

Or if using Supabase CLI:
```bash
supabase db push
```

### 2. Restart Services
The backend and frontend will automatically pick up the new fields. No code changes needed beyond what's already implemented.

### 3. Verify
1. Open a chat with a contact
2. Send a message
3. You should see double gray checkmarks (delivered)
4. When the recipient opens the chat, checkmarks turn blue (read)

## Technical Details

### Real-time Updates
- Uses Supabase `postgres_changes` to listen for UPDATE events on `direct_messages`
- Updates are pushed to both sender and recipient in real-time
- No polling required

### Privacy Considerations
- Read receipts are always enabled (no opt-out currently)
- Only participants in a conversation can see read status
- Read status is stored server-side and enforced by RLS policies

## Future Enhancements
- [ ] Add user setting to disable read receipts
- [ ] Show "delivered" vs "sent" status separately
- [ ] Add read receipts for group messages
- [ ] Show exact read time on hover/tap
