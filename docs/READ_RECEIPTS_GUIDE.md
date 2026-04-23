# Read Receipts - User Guide

## What You'll See

### Message Status Indicators

When you send a message, you'll see small checkmarks next to the timestamp:

#### Delivered (Gray Checkmarks)
```
Your message                    12:34 PM ✓✓
```
- Two gray checkmarks mean the message was delivered to the server
- The recipient hasn't opened the chat yet

#### Read (Blue Checkmarks)
```
Your message                    12:34 PM ✓✓
```
- Two blue checkmarks mean the recipient has seen your message
- They opened the chat and your message was visible

### Where to Look
- Read receipts appear below your sent messages (pink bubbles on the right)
- They show the time sent + delivery/read status
- Received messages (left side) don't show read receipts

## How It Works

### Automatic Read Marking
- When someone opens your chat, all your messages are automatically marked as read
- This happens in real-time - you'll see the checkmarks turn blue instantly
- No action needed from the recipient

### Real-time Updates
- Status updates happen live without refreshing
- Uses Supabase Realtime for instant synchronization
- Works across all devices simultaneously

## Privacy

### What Others Can See
- Recipients can see when you've read their messages
- This is currently always enabled for all users
- Both parties have the same visibility

### What You Can See
- You can see when your messages are delivered and read
- You cannot see read status for messages you receive (only send)
- Timestamps show when messages were sent

## Technical Notes

### Database Storage
- Read status is stored in the `direct_messages` table
- `read_at` column tracks when a message was read
- Protected by Row Level Security (RLS) policies

### API Endpoint
- Backend: `PATCH /api/dm/:contactId/read`
- Marks all unread messages from a contact as read
- Called automatically when opening a chat

## Troubleshooting

### Checkmarks Not Appearing
1. Make sure you've run the database migration
2. Check that Supabase Realtime is enabled
3. Verify the `read_at` column exists in `direct_messages` table

### Checkmarks Not Turning Blue
1. Ensure the recipient has opened the chat
2. Check that real-time subscriptions are working
3. Verify both users have active connections

### Migration Command
```sql
-- Run in Supabase Dashboard → SQL Editor
-- File: supabase/migrations/20260423000000_add_read_receipts.sql
```

## Examples

### Scenario 1: Sending a Message
1. You type and send "Hello!"
2. Message appears with gray checkmarks ✓✓
3. When friend opens chat, checkmarks turn blue ✓✓

### Scenario 2: Receiving a Message
1. Friend sends you "Hi there!"
2. You see the message (no checkmarks on received messages)
3. Friend sees their message turn blue on their side

### Scenario 3: Multiple Messages
```
You: Hey!                       12:30 PM ✓✓ (blue)
You: How are you?               12:31 PM ✓✓ (blue)
You: Want to hang out?          12:32 PM ✓✓ (gray)
```
- First two messages were read
- Last message is delivered but not yet read
