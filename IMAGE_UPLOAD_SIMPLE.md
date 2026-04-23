# Image Upload - Simple Explanation

## 🖼️ What Happens When You Send an Image?

### The Simple Version

```
You select photo → Upload to cloud → Save path in database → Friend sees photo
```

### The Detailed Version

```
Step 1: SELECT IMAGE
┌─────────────┐
│   📱 You    │
│             │
│  [📎] Click │ ← Click paperclip icon
│             │
│  📁 Choose  │ ← Select "vacation.jpg" (2.5 MB)
└─────────────┘

Step 2: UPLOAD TO CLOUD
┌─────────────┐
│   📱 You    │
└──────┬──────┘
       │
       │ Upload file
       │
       ▼
┌─────────────────────────────┐
│  ☁️ Supabase Storage        │
│                             │
│  📦 chat-media bucket       │
│     └─ dm/                  │
│        └─ your-id/          │
│           └─ friend-id/     │
│              └─ uuid.jpg ✓  │ ← File stored here
└─────────────────────────────┘

Step 3: SAVE PATH IN DATABASE
┌─────────────────────────────┐
│  💾 Database                │
│                             │
│  Message:                   │
│  - From: You                │
│  - To: Friend               │
│  - Image path: "dm/..."  ✓  │ ← Path saved
│  - Type: image              │
└─────────────────────────────┘

Step 4: FRIEND SEES IMAGE
┌─────────────┐
│  📱 Friend  │
│             │
│  Gets path  │ ← Reads "dm/your-id/friend-id/uuid.jpg"
│     ↓       │
│  Gets URL   │ ← Generates secure link
│     ↓       │
│  [🖼️ Image] │ ← Displays image
└─────────────┘
```

## 🔐 Why This Way?

### ❌ Bad Approach: Store Image IN Database

```
Database
├─ Message 1: "Hello"
├─ Message 2: [HUGE BINARY DATA 2.5 MB] ← Slow!
├─ Message 3: "How are you?"
```

**Problems:**
- Database gets huge and slow
- Expensive to store binary data
- Hard to optimize images
- Slow to load messages

### ✅ Good Approach: Store Image SEPARATELY

```
Database                    Storage
├─ Message 1: "Hello"      ├─ image1.jpg (2.5 MB)
├─ Message 2: "path/img"   ├─ image2.jpg (3.1 MB)
├─ Message 3: "How are?"   └─ video1.mp4 (15 MB)
```

**Benefits:**
- Database stays fast (only text)
- Storage optimized for files
- Can compress/resize images
- Cheaper and faster

## 🗂️ File Organization

### Where Images Are Stored

```
chat-media/                    ← Bucket (like a folder)
└─ dm/                         ← Direct messages
   └─ user-123/                ← Your ID
      └─ user-456/             ← Friend's ID
         ├─ abc-123.jpg        ← Image 1
         ├─ def-456.jpg        ← Image 2
         └─ ghi-789.mp4        ← Video
```

**Why this structure?**
- Organized by conversation
- Easy to find all media between two people
- Security: Only you and friend can access this folder

## 🔒 Security

### Who Can Access Images?

```
Your Image: dm/YOU/FRIEND/photo.jpg

✅ You can access     (you're the sender)
✅ Friend can access  (they're the recipient)
❌ Others CANNOT      (blocked by security rules)
```

**How it's secured:**
1. **Authentication** - Must be logged in
2. **Folder rules** - Can only access YOUR folders
3. **Signed URLs** - Temporary links that expire
4. **Encryption** - Files encrypted on server

## 🔗 Signed URLs Explained

### What is a Signed URL?

**Regular URL (insecure):**
```
https://storage.supabase.co/chat-media/dm/123/456/photo.jpg
❌ Anyone with this link can view
```

**Signed URL (secure):**
```
https://storage.supabase.co/chat-media/dm/123/456/photo.jpg?token=abc123xyz&expires=1234567890
✅ Only works if you're authenticated
✅ Expires after 1 hour
✅ Token validates your identity
```

**How it works:**
1. You request image
2. Server checks: "Are you allowed to see this?"
3. If yes: Generate signed URL with token
4. URL valid for 1 hour
5. After 1 hour: Generate new URL

## 📊 What Gets Stored Where?

### Database (PostgreSQL)
```sql
direct_messages table:
- id: uuid-123
- sender_id: your-id
- recipient_id: friend-id
- text: null
- media_path: "dm/your-id/friend-id/uuid.jpg"  ← Just the path!
- media_type: "image"
- created_at: 2026-04-23...
```

**Size:** ~200 bytes per message

### Storage (Supabase Storage)
```
File: dm/your-id/friend-id/uuid.jpg
Content: [BINARY IMAGE DATA]
```

**Size:** 2.5 MB (actual image)

## 🎬 Real Example

### Sending "vacation.jpg"

```
1. You click paperclip
   └─> File picker opens

2. You select "vacation.jpg" (2.5 MB)
   └─> handleSendDirectMedia(file)

3. App generates unique name
   └─> "dm/user-123/user-456/a1b2c3d4-e5f6.jpg"

4. Upload to Supabase Storage
   └─> File stored in cloud

5. Save to database
   └─> media_path: "dm/user-123/user-456/a1b2c3d4-e5f6.jpg"

6. Friend's phone gets notification
   └─> "New message from You"

7. Friend opens chat
   └─> App reads media_path from database
   └─> Generates signed URL
   └─> Displays image
```

## 💰 Storage Costs

### Free Tier (Supabase)
- **Storage:** 1 GB
- **Bandwidth:** 2 GB/month
- **Rough estimate:** 500 images

### Example Usage
```
You send 10 images/day
= 300 images/month
= ~600 MB storage
= Within free tier ✅
```

### When to Upgrade
```
If you send 50+ images/day
OR have 1000+ images stored
→ Consider paid plan ($25/month)
→ Gets 100 GB storage
```

## 🔧 File Limits

### Current Limits
- **Max file size:** 20 MB
- **Allowed types:**
  - Images: JPG, PNG, GIF, WebP
  - Videos: MP4, WebM
  - Audio: WebM, OGG, MP3

### What Happens if File Too Large?
```
User selects 25 MB video
→ Upload fails
→ Shows error: "File too large"
→ User must compress or choose smaller file
```

## 🚀 Performance

### Why It's Fast

**Optimistic Updates:**
```
You send image
→ Shows immediately in YOUR chat (optimistic)
→ Uploads in background
→ Replaces with real message when done
```

**Caching:**
```
First time viewing image:
→ Generate signed URL (slow)
→ Cache URL for 1 hour
→ Next views use cached URL (fast)
```

**Lazy Loading:**
```
Chat loads 50 messages
→ Only generates URLs for visible images
→ Scroll down → Generate more URLs
→ Saves bandwidth and API calls
```

## 🐛 Troubleshooting

### Image Not Loading?

**Check 1: Is file uploaded?**
```sql
SELECT media_path FROM direct_messages WHERE id = 'message-id';
-- Should return: "dm/user-123/user-456/uuid.jpg"
```

**Check 2: Does file exist in storage?**
- Go to Supabase Dashboard
- Storage → chat-media bucket
- Navigate to dm/user-123/user-456/
- File should be there

**Check 3: Can you access it?**
```javascript
// In browser console
const { data } = await supabase.storage
  .from('chat-media')
  .createSignedUrl('dm/user-123/user-456/uuid.jpg', 3600);
console.log(data.signedUrl);
// Should return a URL
```

## 📚 Summary

**What you use:**
- **Supabase Storage** = Cloud file storage (like Dropbox)
- **chat-media bucket** = Folder for images/videos
- **Signed URLs** = Secure temporary links
- **Database** = Stores file paths (not actual files)

**Why it works:**
- Files stored separately from database
- Only participants can access
- Fast and scalable
- Secure with expiring URLs

**Key concept:**
```
Database stores PATH → Storage stores FILE
"dm/123/456/photo.jpg" → [ACTUAL IMAGE DATA]
```
