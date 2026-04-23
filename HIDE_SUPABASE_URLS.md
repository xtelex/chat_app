# Hide Supabase URLs from Shared Links

## Problem
When users sent stickers, the full Supabase signed URL was being saved in the message text and appeared in the "Shared Links" section, exposing your Supabase storage URLs.

Example of exposed URL:
```
https://ourputwjamzibukfarom.supabase.co/storage/v1/object/sign/...
```

## Solution Implemented

Changed the sticker system to **store storage paths** instead of full URLs in messages.

### What Changed

#### 1. Message Format
**Before:**
```
[sticker:https://ourputwjamzibukfarom.supabase.co/storage/v1/object/sign/chat-media/user-stickers/...]
```

**After:**
```
[sticker:user-stickers/abc123/xyz.png]  ← Custom sticker (storage path)
[sticker:/stickers/image.png]           ← Default sticker (local path)
```

#### 2. Updated `handleSendSticker()` Function
- Now accepts a path instead of a URL
- Detects if it's a local sticker (`/stickers/...`) or custom sticker (storage path)
- Saves only the path to the database, never the full URL

```javascript
// Old way
handleSendSticker("https://supabase.co/storage/...") ❌

// New way
handleSendSticker("user-stickers/abc123/xyz.png") ✅
handleSendSticker("/stickers/image.png") ✅
```

#### 3. Created `StickerMessage` Component
A new component that handles displaying stickers properly:

- **Detects the type** of sticker path:
  - Local sticker (`/stickers/...`) → uses path directly
  - Storage path (`user-stickers/...`) → fetches signed URL
  - Old URL (`https://...`) → uses URL directly (backward compatibility)

- **Fetches signed URL on-the-fly** when displaying custom stickers
- **Shows loading state** while fetching URL
- **Handles errors** gracefully with fallback emoji

```javascript
function StickerMessage({ message, supabase, getCustomStickerUrl }) {
  // Extracts path from message
  // Determines if it's local, storage path, or URL
  // Fetches signed URL if needed
  // Displays the sticker
}
```

#### 4. Updated Custom Sticker Click Handler
Changed from passing URL to passing storage path:

**Before:**
```javascript
onClick={async () => {
  const url = await getCustomStickerUrl(sticker.storage_path);
  if (url) handleSendSticker(url); // ❌ Sends URL
}}
```

**After:**
```javascript
onClick={() => {
  handleSendSticker(sticker.storage_path); // ✅ Sends path
}}
```

## How It Works Now

### Sending a Sticker

1. **Default Sticker:**
   - User clicks sticker → sends `[sticker:/stickers/image.png]`
   - Path saved to database
   - No Supabase URL involved

2. **Custom Sticker:**
   - User clicks custom sticker → sends `[sticker:user-stickers/abc123/xyz.png]`
   - Storage path saved to database
   - No Supabase URL involved

### Displaying a Sticker

1. **StickerMessage component** extracts the path from `[sticker:path]`
2. **Checks the path type:**
   - Local path (`/stickers/...`) → use directly
   - Storage path (`user-stickers/...`) → fetch signed URL
   - Old URL (`https://...`) → use directly (backward compatibility)
3. **Displays the image** using the appropriate URL
4. **URL is temporary** and only exists in memory, never saved

### Shared Links Section

- **Before:** Showed Supabase URLs like `https://ourputwjamzibukfarom.supa...`
- **After:** Shows nothing (no URLs in messages)

## Benefits

✅ **No Supabase URLs exposed** in messages or shared links
✅ **More secure** - signed URLs are temporary, paths are permanent
✅ **Cleaner data** - messages contain simple paths, not long URLs
✅ **Backward compatible** - old messages with URLs still work
✅ **Better privacy** - storage URLs are hidden from users

## Testing

1. **Send a default sticker** → should work normally
2. **Send a custom sticker** → should work normally
3. **Check "Shared Links" section** → should be empty (no Supabase URLs)
4. **View old sticker messages** → should still display correctly
5. **Refresh page** → stickers should still load

## Technical Details

### Storage Paths
- **Default stickers:** `/stickers/image-removebg-preview.png` (local files)
- **Custom stickers:** `user-stickers/{userId}/{uuid}.ext` (Supabase Storage)

### URL Generation
- **Display time only:** Signed URLs are generated when rendering messages
- **1-hour expiration:** URLs expire after 1 hour (Supabase default)
- **Automatic refresh:** New URL fetched when message is displayed again

### Message Structure
```javascript
{
  id: "msg-123",
  text: "[sticker:user-stickers/abc123/xyz.png]",  // ✅ Path only
  media_type: "sticker",
  // ... other fields
}
```

## Migration Notes

- **Old messages** with full URLs will still work (backward compatibility)
- **New messages** will use paths only
- **No database migration needed** - change is in application logic only
- **Gradual transition** - old URLs will naturally phase out as new messages are sent

## Security Improvements

1. **URLs not stored** - reduces exposure risk
2. **Temporary URLs** - signed URLs expire after 1 hour
3. **Path-based access** - requires authentication to generate URLs
4. **No URL leakage** - URLs don't appear in shared links or message history
