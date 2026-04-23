# Image Upload System - Complete Explanation

## 🎯 Overview

Your chat app uses **Supabase Storage** to handle images, videos, and audio files. Think of it like Google Drive or Dropbox, but built into your database.

## 📦 What is Supabase Storage?

**Supabase Storage** is a file storage service that:
- Stores files (images, videos, audio) separately from your database
- Generates secure URLs to access files
- Handles file permissions and security
- Optimizes file delivery (CDN-like)

**Why not store images directly in the database?**
- Images are large (1-5 MB each)
- Databases are optimized for text, not binary data
- Storage is cheaper and faster for files
- Easier to generate thumbnails and optimize

## 🗂️ Storage Structure

### Buckets (Like Folders)

Your app has 2 storage buckets:

```
Supabase Storage
├── avatars/              (Public bucket - 5 MB limit)
│   └── user-id/
│       └── avatar.jpg
│
└── chat-media/           (Private bucket - 20 MB limit)
    └── dm/
        └── sender-id/
            └── recipient-id/
                ├── uuid-123.jpg
                ├── uuid-456.mp4
                └── uuid-789.webm
```

### Bucket Settings

**avatars bucket:**
- **Public**: Anyone can view (no authentication needed)
- **Size limit**: 5 MB per file
- **Allowed types**: JPEG, PNG, GIF, WebP
- **Use case**: Profile pictures

**chat-media bucket:**
- **Private**: Only authenticated users can access
- **Size limit**: 20 MB per file
- **Allowed types**: Images, videos, audio
- **Use case**: Chat messages (photos, videos, voice notes)

## 🔄 Complete Image Upload Flow

### Step 1: User Selects Image

```jsx
// User clicks paperclip icon
<button onClick={() => dmFileInputRef.current?.click()}>
  <Paperclip />
</button>

// Hidden file input
<input
  ref={dmFileInputRef}
  type="file"
  accept="image/*,video/*"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleSendDirectMedia(file);
  }}
/>
```

**What happens:**
1. User clicks paperclip icon
2. Browser opens file picker
3. User selects image (e.g., `vacation.jpg`)
4. `handleSendDirectMedia(file)` is called

### Step 2: File Type Detection

```javascript
const inferredType = file.type.startsWith("image/")
  ? "image"
  : file.type.startsWith("video/")
    ? "video"
    : file.type.startsWith("audio/")
      ? "audio"
      : null;
```

**What happens:**
- Checks the file's MIME type (e.g., `image/jpeg`)
- Categorizes as: `image`, `video`, or `audio`
- Rejects unsupported types

### Step 3: Generate Unique File Path

```javascript
const ext = file.name.split(".").pop(); // "jpg"
const path = `dm/${user.id}/${dmTargetId}/${crypto.randomUUID()}.${ext}`;
// Result: "dm/user-123/user-456/a1b2c3d4-e5f6-7890.jpg"
```

**Why this structure?**
- `dm/` = Direct messages folder
- `user-123/` = Sender's ID (you)
- `user-456/` = Recipient's ID (your friend)
- `a1b2c3d4...` = Random UUID (prevents name collisions)
- `.jpg` = Original file extension

**Security benefit:**
- Only sender and recipient can access files in their folder
- Other users cannot guess or access your images

### Step 4: Upload to Supabase Storage

```javascript
const { error } = await supabase.storage
  .from("chat-media")           // Which bucket
  .upload(path, file, {         // Where and what
    contentType: file.type,     // MIME type (image/jpeg)
    upsert: false               // Don't overwrite existing files
  });
```

**What happens:**
1. File is uploaded to Supabase servers
2. Stored at: `chat-media/dm/user-123/user-456/uuid.jpg`
3. File is encrypted at rest
4. Returns success or error

### Step 5: Save Reference in Database

```javascript
const { data } = await supabase
  .from("direct_messages")
  .insert({
    sender_id: user.id,
    recipient_id: dmTargetId,
    media_path: path,              // "dm/user-123/user-456/uuid.jpg"
    media_type: "image",           // "image", "video", or "audio"
    media_mime: "image/jpeg"       // Full MIME type
  });
```

**Database record:**
```
┌─────────────────────────────────────────────────────────┐
│ direct_messages table                                   │
├─────────────────────────────────────────────────────────┤
│ id: uuid-message-123                                    │
│ sender_id: user-123                                     │
│ recipient_id: user-456                                  │
│ text: null                                              │
│ media_path: "dm/user-123/user-456/uuid.jpg" ← Path!    │
│ media_type: "image"                                     │
│ media_mime: "image/jpeg"                                │
│ created_at: 2026-04-23T12:34:56Z                        │
└─────────────────────────────────────────────────────────┘
```

**Why store the path?**
- Database stores metadata (who, when, what type)
- Storage stores actual file (binary data)
- Path links them together

### Step 6: Display Image (Optimistic Update)

```javascript
// Show image immediately (before upload completes)
const optimistic = {
  id: `local-${Date.now()}`,
  media_path: path,
  media_type: "image"
};
setDmMessages((prev) => [...prev, optimistic]);
```

**User experience:**
- Image appears instantly in chat
- Shows loading state while uploading
- Replaced with real message when upload completes

## 🔐 Security & Permissions

### Row Level Security (RLS) Policies

**Who can upload?**
```sql
-- Only authenticated users can upload
-- Only to their own folder (dm/YOUR_ID/...)
create policy "Users can upload chat media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = 'dm'
  and (storage.foldername(name))[2] = auth.uid()::text
);
```

**Who can view?**
```sql
-- Only sender or recipient can view
create policy "Users can view chat media they sent or received"
on storage.objects for select
to authenticated
using (
  bucket_id = 'chat-media'
  and (
    (storage.foldername(name))[2] = auth.uid()::text  -- You're the sender
    or (storage.foldername(name))[3] = auth.uid()::text  -- You're the recipient
  )
);
```

**What this means:**
- You can only upload to folders with YOUR user ID
- You can only view images YOU sent or received
- Other users cannot access your images
- Even if they guess the URL, RLS blocks them

## 🖼️ Displaying Images

### Step 1: Get Signed URL

```javascript
const resolveMediaUrl = async (mediaPath) => {
  const { data } = await supabase.storage
    .from("chat-media")
    .createSignedUrl(mediaPath, 60 * 60);  // Valid for 1 hour
  
  return data.signedUrl;
  // Returns: "https://supabase.co/storage/v1/object/sign/chat-media/dm/...?token=abc123"
};
```

**What is a signed URL?**
- A temporary URL that includes an authentication token
- Valid for 1 hour (3600 seconds)
- After 1 hour, URL expires and new one is generated
- Prevents unauthorized access

**Why not use direct URLs?**
- Direct URLs would expose files to anyone
- Signed URLs include authentication
- Can set expiration time
- Can revoke access

### Step 2: Cache URLs

```javascript
const [dmMediaUrls, setDmMediaUrls] = useState({});

// Cache the signed URL
setDmMediaUrls((prev) => ({ 
  ...prev, 
  [mediaPath]: signedUrl 
}));
```

**Why cache?**
- Avoid generating same URL multiple times
- Faster image loading
- Reduces API calls
- URLs valid for 1 hour anyway

### Step 3: Render Image

```jsx
{m.media_type === "image" && (
  mediaUrl ? (
    <img 
      src={mediaUrl} 
      alt="" 
      className="max-w-[260px] max-h-[320px] rounded-2xl"
      onClick={() => window.open(mediaUrl, "_blank")}
    />
  ) : (
    <div>Loading image…</div>
  )
)}
```

**Flow:**
1. Message loads with `media_path`
2. `resolveMediaUrl()` generates signed URL
3. URL cached in state
4. Image rendered with `<img src={signedUrl} />`
5. Click to open full-size in new tab

## 📊 Complete Data Flow Diagram

```
┌─────────────┐
│   User      │
│   Phone     │
└──────┬──────┘
       │
       │ 1. Selects image (vacation.jpg, 2.5 MB)
       │
       ▼
┌─────────────────────────────────────┐
│  handleSendDirectMedia()            │
│  - Detects type: "image"            │
│  - Generates path: dm/A/B/uuid.jpg  │
└──────┬──────────────────────────────┘
       │
       │ 2. Upload file
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Storage                   │
│  ┌───────────────────────────────┐  │
│  │ chat-media bucket             │  │
│  │ └─ dm/                        │  │
│  │    └─ user-A/                 │  │
│  │       └─ user-B/              │  │
│  │          └─ uuid.jpg (2.5 MB) │  │
│  └───────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │
       │ 3. Save metadata
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Database                  │
│  ┌───────────────────────────────┐  │
│  │ direct_messages table         │  │
│  ├───────────────────────────────┤  │
│  │ media_path: dm/A/B/uuid.jpg   │  │
│  │ media_type: image             │  │
│  │ sender_id: A                  │  │
│  │ recipient_id: B               │  │
│  └───────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │
       │ 4. Realtime broadcast
       │
       ├──────────────┬───────────────┐
       │              │               │
       ▼              ▼               ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│  User A   │  │  User B   │  │  User B   │
│  Phone    │  │  Phone    │  │  Laptop   │
│           │  │           │  │           │
│ Image     │  │ New image │  │ New image │
│ sent ✓    │  │ received  │  │ received  │
└───────────┘  └─────┬─────┘  └─────┬─────┘
                     │              │
                     │ 5. Request signed URL
                     │
                     ▼
              ┌─────────────────────────┐
              │  resolveMediaUrl()      │
              │  - Generates signed URL │
              │  - Caches for 1 hour    │
              └─────┬───────────────────┘
                    │
                    │ 6. Display image
                    │
                    ▼
              ┌─────────────────────────┐
              │  <img src={signedUrl}>  │
              │  [Image displayed]      │
              └─────────────────────────┘
```

## 🎥 Video & Audio

Same process, just different file types:

**Video:**
```jsx
<video src={mediaUrl} controls className="rounded-2xl" />
```

**Audio (Voice Notes):**
```jsx
<audio src={mediaUrl} controls className="w-full" />
```

## 💾 Storage Costs

**Supabase Free Tier:**
- 1 GB storage
- 2 GB bandwidth per month
- Unlimited API requests

**Rough estimates:**
- 1 image (2 MB) = 2 MB storage
- 500 images = 1 GB (free tier limit)
- Each view = 2 MB bandwidth
- 1000 views = 2 GB (free tier limit)

**Paid tier ($25/month):**
- 100 GB storage
- 200 GB bandwidth
- ~50,000 images
- ~100,000 views

## 🔧 Configuration

### File Size Limits

**Current limits:**
- Avatars: 5 MB
- Chat media: 20 MB

**To change:**
```sql
update storage.buckets
set file_size_limit = 52428800  -- 50 MB in bytes
where id = 'chat-media';
```

### Allowed File Types

**Current types:**
- Images: JPEG, PNG, GIF, WebP
- Videos: MP4, WebM
- Audio: WebM, OGG, MP3

**To add more:**
```sql
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',  -- Added MOV
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/wav'  -- Added WAV
]
where id = 'chat-media';
```

## 🐛 Common Issues

### Issue: "Failed to upload"
**Cause:** File too large or wrong type
**Solution:** Check file size and MIME type

### Issue: "Image not loading"
**Cause:** Signed URL expired or RLS policy blocking
**Solution:** Refresh page to generate new signed URL

### Issue: "Permission denied"
**Cause:** User not authenticated or trying to access someone else's image
**Solution:** Check authentication and folder structure

## 🚀 Optimizations

### Current optimizations:
- ✅ Signed URLs cached for 1 hour
- ✅ Optimistic updates (instant UI feedback)
- ✅ Lazy loading (URLs generated on-demand)

### Possible improvements:
- [ ] Image compression before upload
- [ ] Thumbnail generation
- [ ] Progressive image loading
- [ ] CDN integration
- [ ] Automatic format conversion (WebP)

## 📚 Summary

**What you use:**
- **Supabase Storage** - File storage service (like AWS S3)
- **chat-media bucket** - Private folder for images/videos/audio
- **Signed URLs** - Temporary authenticated links to files
- **RLS policies** - Security rules controlling access

**How it works:**
1. User selects image → Upload to Supabase Storage
2. Save file path in database → Link storage to message
3. Generate signed URL → Temporary authenticated link
4. Display image → `<img src={signedUrl} />`
5. URL expires after 1 hour → Generate new one if needed

**Why this approach:**
- Secure (only participants can access)
- Scalable (storage separate from database)
- Fast (CDN-like delivery)
- Cost-effective (pay for what you use)
