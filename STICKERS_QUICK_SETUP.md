# Stickers - Quick Setup Guide

## ⚡ 3-Minute Setup

### Step 1: Add Your Sticker Images (2 minutes)

1. **Save your 5 sticker images** from the screenshots you showed me

2. **Name them:**
   - `sticker-1.png` - Surprised face (hands up)
   - `sticker-2.png` - Flex pose (shirtless)
   - `sticker-3.png` - Call me (sunglasses, chain)
   - `sticker-4.png` - Crazy face (tongue out)
   - `sticker-5.png` - Thank you meme

3. **Put them in this folder:**
   ```
   client/public/stickers/
   ```

### Step 2: Test It! (1 minute)

1. **Restart dev server:**
   ```bash
   cd client
   npm run dev
   ```

2. **Open chat** at http://localhost:3000

3. **Look for sticker button:**
   - In message input area
   - Next to emoji button 😀
   - Looks like: 🎨

4. **Click sticker button** → Sticker picker opens

5. **Click a sticker** → Sends as message!

## 🎯 What You'll See

### Before Clicking Sticker Button
```
┌─────────────────────────────────────┐
│ [Type message...]        🎨 😀 📎  │
└─────────────────────────────────────┘
                           ↑
                    Sticker button
```

### After Clicking Sticker Button
```
┌─────────────────────────────────────┐
│ Stickers                            │
│ ┌────┬────┬────┬────┐              │
│ │ 😮 │ 💪 │ 🤙 │ 🤪 │ ← Your stickers│
│ ├────┼────┼────┼────┤              │
│ │ 🙏 │    │    │    │              │
│ └────┴────┴────┴────┘              │
└─────────────────────────────────────┘
```

### After Sending Sticker
```
┌─────────────────────────────────────┐
│                                     │
│                          [🎨]       │
│                          Sticker!   │
│                          12:34 PM   │
└─────────────────────────────────────┘
```

## 📁 Folder Structure

```
chat_app/
└── client/
    └── public/
        └── stickers/           ← Put images here!
            ├── sticker-1.png   ← Surprised face
            ├── sticker-2.png   ← Flex
            ├── sticker-3.png   ← Call me
            ├── sticker-4.png   ← Crazy face
            └── sticker-5.png   ← Thank you
```

## 🖼️ Image Requirements

- **Format:** PNG, JPG, GIF, or WebP
- **Size:** Recommended 512x512 pixels (square)
- **File size:** Under 500KB for fast loading
- **Background:** Transparent PNG works best

## ➕ How to Add More Stickers

### Quick Method:

1. **Add image file:**
   ```
   client/public/stickers/sticker-6.png
   ```

2. **Edit stickers config:**
   ```
   client/src/data/stickers.js
   ```

3. **Add this code:**
   ```javascript
   {
     id: 'sticker-6',
     name: 'Your Sticker Name',
     url: '/stickers/sticker-6.png',
     emoji: '😎'  // Fallback if image fails
   }
   ```

4. **Refresh page** - new sticker appears!

## 🐛 Troubleshooting

### Stickers not showing?

**Check 1:** Are images in the right folder?
```bash
# Run this in terminal:
ls client/public/stickers/

# Should show:
# sticker-1.png
# sticker-2.png
# etc.
```

**Check 2:** Restart dev server
```bash
# Stop server (Ctrl+C)
# Start again:
npm run dev
```

**Check 3:** Check browser console (F12)
- Look for 404 errors
- Should see: `GET /stickers/sticker-1.png 200 OK`

### Sticker button not showing?

**Check:** Is dev server running?
```bash
cd client
npm run dev
```

### Stickers show as emoji instead of images?

**Reason:** Images not found - using fallback emoji

**Fix:** 
1. Check image files exist
2. Check filenames match exactly
3. Restart dev server

## 📖 Full Documentation

For detailed explanation, see:
- `STICKERS_EXPLAINED.md` - Complete technical details
- `client/public/stickers/README.md` - Image guidelines

## 🎉 That's It!

You now have a working sticker feature! Just add your 5 images and start sending stickers! 🚀

**Quick recap:**
1. ✅ Add 5 images to `client/public/stickers/`
2. ✅ Name them `sticker-1.png` through `sticker-5.png`
3. ✅ Restart dev server
4. ✅ Click 🎨 button in chat
5. ✅ Send stickers!
