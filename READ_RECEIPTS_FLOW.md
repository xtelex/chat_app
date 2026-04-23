# Read Receipts - Complete Flow Diagram

## 📨 Message Sending Flow

```
┌─────────────┐
│  Person A   │ (Sender)
│   Phone     │
└──────┬──────┘
       │
       │ 1. Types "Hello!" and hits send
       │
       ▼
┌─────────────────────────────────────┐
│  handleSendDirectText()             │
│  - Creates optimistic message       │
│  - Shows gray checkmarks ✓✓         │
└──────┬──────────────────────────────┘
       │
       │ 2. POST /api/dm/:contactId
       │    { text: "Hello!" }
       │
       ▼
┌─────────────────────────────────────┐
│  Backend Server (Node.js)           │
│  - Validates auth token             │
│  - Inserts into database            │
└──────┬──────────────────────────────┘
       │
       │ 3. INSERT INTO direct_messages
       │    (sender_id, recipient_id, text)
       │    VALUES (A, B, "Hello!")
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Database                  │
│  ┌─────────────────────────────┐   │
│  │ direct_messages             │   │
│  ├─────────────────────────────┤   │
│  │ id: uuid-123                │   │
│  │ sender_id: A                │   │
│  │ recipient_id: B             │   │
│  │ text: "Hello!"              │   │
│  │ created_at: 2026-04-23...   │   │
│  │ read_at: NULL ← Not read yet│   │
│  └─────────────────────────────┘   │
└──────┬──────────────────────────────┘
       │
       │ 4. Supabase Realtime broadcasts
       │    INSERT event to all subscribers
       │
       ├──────────────────┬─────────────────┐
       │                  │                 │
       ▼                  ▼                 ▼
┌─────────────┐    ┌─────────────┐   ┌─────────────┐
│  Person A   │    │  Person B   │   │  Person B   │
│   Phone     │    │   Phone     │   │   Laptop    │
│             │    │             │   │             │
│ ✓✓ Gray     │    │ New message │   │ New message │
│ (delivered) │    │ notification│   │ notification│
└─────────────┘    └─────────────┘   └─────────────┘
```

## 👀 Message Reading Flow

```
┌─────────────┐
│  Person B   │ (Recipient)
│   Phone     │
└──────┬──────┘
       │
       │ 1. Opens chat with Person A
       │
       ▼
┌─────────────────────────────────────┐
│  loadDirectMessages(contactId)      │
│  - Fetches all messages             │
│  - Calls markMessagesAsReadForContact│
└──────┬──────────────────────────────┘
       │
       │ 2. PATCH /api/dm/:contactId/read
       │    (marks all unread messages as read)
       │
       ▼
┌─────────────────────────────────────┐
│  Backend Server                     │
│  - Finds all messages where:        │
│    sender_id = A                    │
│    recipient_id = B                 │
│    read_at IS NULL                  │
└──────┬──────────────────────────────┘
       │
       │ 3. UPDATE direct_messages
       │    SET read_at = NOW()
       │    WHERE sender_id = A
       │      AND recipient_id = B
       │      AND read_at IS NULL
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Database                  │
│  ┌─────────────────────────────┐   │
│  │ direct_messages             │   │
│  ├─────────────────────────────┤   │
│  │ id: uuid-123                │   │
│  │ sender_id: A                │   │
│  │ recipient_id: B             │   │
│  │ text: "Hello!"              │   │
│  │ created_at: 2026-04-23...   │   │
│  │ read_at: 2026-04-23... ✓    │   │
│  └─────────────────────────────┘   │
└──────┬──────────────────────────────┘
       │
       │ 4. Supabase Realtime broadcasts
       │    UPDATE event to all subscribers
       │
       ├──────────────────┬─────────────────┐
       │                  │                 │
       ▼                  ▼                 ▼
┌─────────────┐    ┌─────────────┐   ┌─────────────┐
│  Person A   │    │  Person B   │   │  Person A   │
│   Phone     │    │   Phone     │   │   Laptop    │
│             │    │             │   │             │
│ ✓✓ BLUE!    │    │ (no change) │   │ ✓✓ BLUE!    │
│ (read)      │    │             │   │ (read)      │
└─────────────┘    └─────────────┘   └─────────────┘
```

## 🔄 Real-time Update Mechanism

### How Supabase Realtime Works

```
┌──────────────────────────────────────────────────────┐
│  Supabase Realtime (WebSocket Connection)           │
│                                                      │
│  1. Client subscribes to channel:                   │
│     channel(`dm_live:${userId}_${contactId}`)       │
│                                                      │
│  2. Listens for postgres_changes:                   │
│     - INSERT events (new messages)                  │
│     - UPDATE events (read receipts)                 │
│                                                      │
│  3. When database changes:                          │
│     Database → Postgres Trigger → Realtime Server   │
│     → WebSocket → All Connected Clients             │
│                                                      │
│  4. Client receives update:                         │
│     setDmMessages(prev => prev.map(m =>             │
│       m.id === msg.id                               │
│         ? { ...m, read_at: msg.read_at }            │
│         : m                                         │
│     ))                                              │
└──────────────────────────────────────────────────────┘
```

## 🎨 Visual Indicators

### Before Reading (Sender's View)
```
┌────────────────────────────────────┐
│                                    │
│              Your message here     │
│              12:34 PM ✓✓           │
│                       ↑            │
│                       Gray         │
│                       (Delivered)  │
└────────────────────────────────────┘
```

### After Reading (Sender's View)
```
┌────────────────────────────────────┐
│                                    │
│              Your message here     │
│              12:34 PM ✓✓           │
│                       ↑            │
│                       Blue         │
│                       (Read)       │
└────────────────────────────────────┘
```

## 🔐 Security & Privacy

### Row Level Security (RLS) Policies

```sql
-- Only participants can read messages
CREATE POLICY "Direct messages are readable by participants"
ON direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Only recipients can mark messages as read
CREATE POLICY "Recipients can mark messages as read"
ON direct_messages FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);
```

**What this means:**
- You can only see messages you sent or received
- You can only mark messages as "read" if they were sent TO you
- You cannot mark someone else's messages as read
- You cannot see messages between other people

## 📊 Database Schema

```
┌─────────────────────────────────────────────────────┐
│  Table: direct_messages                             │
├─────────────────────────────────────────────────────┤
│  id              UUID PRIMARY KEY                   │
│  created_at      TIMESTAMPTZ NOT NULL               │
│  sender_id       UUID → profiles(id)                │
│  recipient_id    UUID → profiles(id)                │
│  text            TEXT                                │
│  media_path      TEXT                                │
│  media_type      TEXT                                │
│  media_mime      TEXT                                │
│  delivered_at    TIMESTAMPTZ ← NEW!                 │
│  read_at         TIMESTAMPTZ ← NEW!                 │
└─────────────────────────────────────────────────────┘

Indexes:
- direct_messages_created_at_idx (created_at DESC)
- direct_messages_sender_idx (sender_id, created_at DESC)
- direct_messages_recipient_idx (recipient_id, created_at DESC)
- direct_messages_read_at_idx (recipient_id, read_at) WHERE read_at IS NULL
```

## 🧪 Testing Checklist

- [ ] Send message from Phone A → See gray checkmarks
- [ ] Open chat on Phone B → Message marked as read in database
- [ ] Phone A sees checkmarks turn blue within 2 seconds
- [ ] Works on WiFi
- [ ] Works on cellular data
- [ ] Works when switching networks
- [ ] Works with multiple messages
- [ ] Works when recipient is offline then comes online
- [ ] Console logs show correct flow
- [ ] Database shows correct read_at timestamps

## 🐛 Debug Commands

### Check if real-time is working
```javascript
// In browser console
const channel = supabase.channel('test')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'direct_messages' 
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

### Manually trigger read receipt
```javascript
// Mark all messages from a contact as read
const contactId = 'paste-uuid-here';
await fetch(`http://localhost:3001/api/dm/${contactId}/read`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

### Check message status
```sql
-- See all messages with read status
SELECT 
  text,
  created_at,
  read_at,
  CASE 
    WHEN read_at IS NOT NULL THEN '✓✓ Blue (Read)'
    ELSE '✓✓ Gray (Delivered)'
  END as status
FROM direct_messages
WHERE sender_id = 'your-user-id'
ORDER BY created_at DESC;
```
