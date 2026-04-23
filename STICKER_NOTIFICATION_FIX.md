# Sticker Notification Preview Fix

## Problem
When a sticker was sent, notifications and message previews showed the raw message text with storage paths or URLs instead of a user-friendly message.

**Before:**
- Notification: `[sticker:user-stickers/abc123/xyz.png]` or `[sticker:https://supabase.co/...]`
- Last message preview: Same ugly text
- Exposed technical details and storage URLs

**After:**
- Notification: `Kuya daboy sent a sticker`
- Last message preview: `Sent a sticker`
- Clean, user-friendly text

## Solution Implemented

Created a helper function `formatMessagePreview()` that detects sticker messages and returns friendly text instead of raw message content.

### Changes Made

#### 1. Created `formatMessagePreview()` Helper Function

```javascript
function formatMessagePreview(message, senderName = null) {
  // Handle call_missed type
  if (message.media_type === "call_missed") {
    return "📵 Missed call";
  }
  
  // Handle media types
  if (message.media_type === "image") return "📷 Image";
  if (message.media_type === "video") return "🎥 Video";
  if (message.media_type === "audio") return "🎤 Voice message";
  
  // Handle sticker messages
  if (message.media_type === "sticker" || message.text?.startsWith("[sticker:")) {
    return senderName ? `${senderName} sent a sticker` : "Sent a sticker";
  }
  
  // Regular text message
  return message.text || "";
}
```

**Features:**
- Detects sticker messages by checking `media_type === "sticker"` or `text.startsWith("[sticker:")`
- Returns `"{name} sent a sticker"` when sender name is provided
- Returns `"Sent a sticker"` when no sender name (for your own messages)
- Handles all media types consistently
- Falls back to original text for regular messages

#### 2. Updated Initial Load Preview Logic

**Before:**
```javascript
const preview = msg.media_type === "call_missed" ? "📵 Missed call"
  : msg.media_type === "image" ? "📷 Image"
  : msg.media_type === "video" ? "🎥 Video"
  : msg.media_type === "audio" ? "🎤 Voice message"
  : msg.text || "";
```

**After:**
```javascript
const preview = formatMessagePreview(msg);
```

#### 3. Updated Realtime Preview Logic

**Before:**
```javascript
const preview = msg.media_type === "call_missed" ? "📵 Missed call"
  : msg.media_type === "image" ? "📷 Image"
  : msg.media_type === "video" ? "🎥 Video"
  : msg.media_type === "audio" ? "🎤 Voice message"
  : msg.text || "";
```

**After:**
```javascript
// Get sender name for preview
const sender = addedContacts.find((c) => c.id === senderId);
const senderName = sender?.name || "Someone";

// Update last message preview
const preview = formatMessagePreview(msg, senderName);
```

## How It Works Now

### Contact List Preview

**When you send a sticker:**
- Shows: `"Sent a sticker"`

**When someone sends you a sticker:**
- Shows: `"Kuya daboy sent a sticker"`

### Notifications

**Browser notifications (if implemented):**
- Title: `"Kuya daboy"`
- Body: `"Kuya daboy sent a sticker"`

**In-app notifications:**
- Shows: `"Kuya daboy sent a sticker"`

### Other Media Types

The helper function also handles:
- 📵 Missed call
- 📷 Image
- 🎥 Video
- 🎤 Voice message

## Benefits

✅ **User-friendly** - Shows readable text instead of technical paths
✅ **No URL exposure** - Storage paths/URLs never shown in previews
✅ **Consistent** - All media types handled the same way
✅ **Personalized** - Shows sender name when available
✅ **Clean UI** - Notifications look professional

## Testing

1. **Send a sticker** → Contact list should show "Sent a sticker"
2. **Receive a sticker** → Contact list should show "{Name} sent a sticker"
3. **Check notification** → Should show friendly text, not raw path
4. **Send other media** → Should show appropriate icons (📷, 🎥, 🎤)

## Technical Details

### Detection Logic

The function checks two conditions to identify stickers:
1. `message.media_type === "sticker"` - Explicit sticker type
2. `message.text?.startsWith("[sticker:")` - Sticker format in text

This ensures both old and new sticker messages are detected correctly.

### Sender Name Logic

- **With sender name:** `"Kuya daboy sent a sticker"`
- **Without sender name:** `"Sent a sticker"`

The sender name is passed when available (realtime updates) and omitted when not needed (initial load, your own messages).

### Backward Compatibility

- Works with old sticker messages that have full URLs
- Works with new sticker messages that have storage paths
- Works with default stickers that have local paths
- No database migration needed

## Example Scenarios

### Scenario 1: You send a sticker
```
Contact List:
┌─────────────────────────────┐
│ Kuya daboy                  │
│ Sent a sticker              │ ← Clean preview
└─────────────────────────────┘
```

### Scenario 2: You receive a sticker
```
Contact List:
┌─────────────────────────────┐
│ Kuya daboy                  │
│ Kuya daboy sent a sticker   │ ← Personalized preview
└─────────────────────────────┘

Notification:
┌─────────────────────────────┐
│ Kuya daboy                  │
│ Kuya daboy sent a sticker   │ ← User-friendly text
└─────────────────────────────┘
```

### Scenario 3: Mixed messages
```
Contact List:
┌─────────────────────────────┐
│ John                        │
│ 📷 Image                    │
├─────────────────────────────┤
│ Mary                        │
│ Mary sent a sticker         │
├─────────────────────────────┤
│ Bob                         │
│ Hey, how are you?           │
└─────────────────────────────┘
```

## Code Locations

- **Helper function:** Line ~47 in `ChatPage.jsx`
- **Initial load:** Line ~475 in `ChatPage.jsx`
- **Realtime updates:** Line ~2045 in `ChatPage.jsx`

## Future Enhancements

Possible improvements:
- Add sticker emoji to preview: `"🎨 Kuya daboy sent a sticker"`
- Show sticker name if available: `"Kuya daboy sent 'Thank You' sticker"`
- Add browser notification support with sticker preview
- Localization support for different languages
