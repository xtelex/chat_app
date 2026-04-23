# Custom Stickers Image Loading Fix

## Problem
Custom stickers were showing as broken images (IMG_90 icon) instead of displaying the actual uploaded image.

## Root Cause
The code was trying to load custom stickers using a **public URL** format:
```javascript
src={`${VITE_SUPABASE_URL}/storage/v1/object/public/chat-media/${sticker.storage_path}`}
```

But custom stickers are stored in a **private bucket** that requires **signed URLs** for access.

## Solution Implemented

### 1. Added State for Signed URLs
```javascript
const [customStickerUrls, setCustomStickerUrls] = useState({}); // { stickerId: signedUrl }
```

This stores the signed URL for each custom sticker so we don't have to fetch it every time.

### 2. Updated `loadCustomStickers()` Function
Now when loading custom stickers from the database, it also fetches signed URLs for each one:

```javascript
const loadCustomStickers = async () => {
  // ... fetch stickers from database ...
  
  // Load signed URLs for each sticker
  const urls = {};
  for (const sticker of data) {
    const signedUrl = await getCustomStickerUrl(sticker.storage_path);
    if (signedUrl) {
      urls[sticker.id] = signedUrl;
    }
  }
  setCustomStickerUrls(urls);
};
```

### 3. Updated Display Logic
Changed the image display to use the signed URL from state:

**Before:**
```javascript
<img src={`${VITE_SUPABASE_URL}/storage/v1/object/public/chat-media/${sticker.storage_path}`} />
```

**After:**
```javascript
{stickerUrl ? (
  <img src={stickerUrl} alt={sticker.name} />
) : (
  <div className="animate-pulse">
    <span>{sticker.emoji_fallback || '🎨'}</span>
  </div>
)}
```

### 4. Added Loading State
While the signed URL is being fetched, shows a pulsing placeholder with the emoji fallback.

### 5. Updated Upload Function
After uploading a new sticker, immediately fetches its signed URL and adds it to state:

```javascript
// Get signed URL for the new sticker
const signedUrl = await getCustomStickerUrl(path);
if (signedUrl) {
  setCustomStickerUrls((prev) => ({ ...prev, [data.id]: signedUrl }));
}
```

### 6. Updated Delete Function
When deleting a sticker, also removes its URL from state:

```javascript
setCustomStickerUrls((prev) => {
  const newUrls = { ...prev };
  delete newUrls[stickerId];
  return newUrls;
});
```

### 7. Fixed Storage Path
Changed from `stickers/${userId}/...` to `user-stickers/${userId}/...` to match the migration documentation.

## How It Works Now

### Upload Flow:
1. User clicks "+" → selects image
2. Image uploads to `chat-media/user-stickers/{userId}/{uuid}.ext`
3. Record saved to database
4. Signed URL fetched immediately
5. Sticker displays correctly in "My Stickers"

### Display Flow:
1. Component loads → `loadCustomStickers()` runs
2. Fetches sticker metadata from database
3. Fetches signed URL for each sticker (1-hour expiration)
4. Stores URLs in `customStickerUrls` state
5. Images display using signed URLs

### Send Flow:
1. User clicks custom sticker
2. Gets signed URL from state (or fetches if missing)
3. Sends message with format `[sticker:URL]`
4. Message displays as sticker image

## Why Signed URLs?

Supabase Storage has two types of buckets:
- **Public buckets**: Anyone can access files directly via URL
- **Private buckets**: Requires authentication via signed URLs

The `chat-media` bucket is **private** for security, so all custom stickers need signed URLs to display.

Signed URLs:
- ✅ Expire after 1 hour (configurable)
- ✅ Require authentication to generate
- ✅ Prevent unauthorized access
- ✅ Can be revoked

## Testing

After this fix:
1. Upload a custom sticker → should display correctly immediately
2. Refresh page → custom stickers should still display
3. Click custom sticker → should send correctly
4. Delete custom sticker → should remove from UI

## Error Handling

If a signed URL fails to load:
- Shows emoji fallback (🎨 or custom emoji)
- Logs error to console
- User can still delete the broken sticker

If image fails to load:
- `onError` handler shows emoji fallback
- Prevents broken image icon from showing
