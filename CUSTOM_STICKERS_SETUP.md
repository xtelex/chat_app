# Custom Stickers Setup Guide

## What Was Added

I've added a custom sticker upload feature that allows users to upload their own stickers to the chat app. Here's what changed:

### 1. UI Changes (ChatPage.jsx)
- ✅ Added a **"+" button** in the sticker picker (dashed border circle with plus icon)
- ✅ Added hidden file input for image uploads
- ✅ Added "My Stickers" section below default stickers
- ✅ Added delete button (X) on hover for custom stickers
- ✅ Added loading spinner while uploading
- ✅ Added useEffect to load custom stickers on mount

### 2. Features
- Upload PNG, JPG, GIF, or WebP images (max 5MB)
- Images stored in Supabase Storage at `chat-media/user-stickers/{userId}/{uuid}.ext`
- Database tracks sticker metadata in `user_stickers` table
- Users can only see and manage their own custom stickers
- Click custom sticker to send (gets signed URL automatically)
- Hover and click X to delete custom stickers

## Setup Instructions

### Step 1: Run the Database Migration

You need to create the `user_stickers` table in your Supabase database.

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/20260423150000_add_user_stickers.sql`
5. Click **Run** or press `Ctrl+Enter`

You should see: "Success. No rows returned"

### Step 2: Test the Feature

1. Make sure your frontend is running: `cd client && npm run dev`
2. Open the chat app in your browser
3. Open a conversation with someone
4. Click the **sticker icon** (next to emoji picker)
5. You should see:
   - Your 5 default stickers (Image, Coco, Alden, Malupiton, Thank You)
   - A **"+" button** with a dashed border at the end
6. Click the **"+" button**
7. Select an image file (PNG, JPG, GIF, or WebP, max 5MB)
8. Wait for upload (you'll see a spinner)
9. Your custom sticker appears in "My Stickers" section
10. Click it to send, or hover and click X to delete

## How It Works

### Upload Flow
1. User clicks "+" button → file input opens
2. User selects image → `handleUploadCustomSticker()` runs
3. Image uploads to Supabase Storage: `chat-media/user-stickers/{userId}/{uuid}.ext`
4. Record saved to `user_stickers` table with metadata
5. `loadCustomStickers()` refreshes the list
6. Custom sticker appears in "My Stickers" section

### Send Flow
1. User clicks custom sticker
2. `getCustomStickerUrl()` gets signed URL (1-hour expiration)
3. `handleSendSticker()` sends message with format `[sticker:URL]`
4. Message displays as sticker image in chat

### Delete Flow
1. User hovers over custom sticker → X button appears
2. User clicks X → confirmation dialog
3. `handleDeleteCustomSticker()` removes from storage and database
4. Sticker removed from UI

## Storage Structure

```
Supabase Storage: chat-media bucket
├── dm/                          (direct message media)
│   └── {sender-id}/
│       └── {recipient-id}/
│           └── {uuid}.{ext}
└── user-stickers/               (custom stickers - NEW!)
    └── {user-id}/
        └── {uuid}.{ext}
```

## Database Schema

```sql
user_stickers table:
- id: uuid (primary key)
- created_at: timestamptz
- user_id: uuid (references profiles)
- name: text (1-50 chars)
- storage_path: text (e.g., "user-stickers/abc123/xyz.png")
- emoji_fallback: text (default '🎨')
```

## Security

- ✅ RLS policies: users can only see/manage their own stickers
- ✅ File validation: type (image/*) and size (5MB max)
- ✅ Signed URLs: 1-hour expiration for security
- ✅ Storage path isolation: each user has their own folder

## Troubleshooting

### "+" button not showing
- Check browser console for errors
- Make sure `Plus` icon is imported from `lucide-react` (already done)
- Refresh the page

### Upload fails
- Check file size (must be < 5MB)
- Check file type (PNG, JPG, GIF, WebP only)
- Check Supabase Storage bucket `chat-media` exists
- Check browser console for error messages

### Custom stickers not loading
- Make sure you ran the migration (Step 1)
- Check browser console for errors
- Check Supabase Dashboard → Table Editor → `user_stickers` table exists
- Check RLS policies are enabled

### Can't delete stickers
- Check browser console for errors
- Make sure you're the owner of the sticker
- Check Supabase Storage permissions

## Next Steps

After running the migration, the feature is ready to use! Users can now:
1. Upload their own custom stickers
2. Send custom stickers in chats
3. Delete custom stickers they no longer want

The default stickers (in `client/public/stickers/`) remain available to everyone.
