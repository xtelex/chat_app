# Stickers Folder

## How to Add Stickers

1. Save your sticker images in this folder
2. Name them: `sticker-1.png`, `sticker-2.png`, etc.
3. Recommended size: 512x512 pixels (or similar square dimensions)
4. Supported formats: PNG, JPG, GIF, WebP

## Current Stickers

Based on the images you provided, save them as:

- `sticker-1.png` - Surprised face (hands up gesture)
- `sticker-2.png` - Flex pose (shirtless flex)
- `sticker-3.png` - Call me gesture (sunglasses, chain)
- `sticker-4.png` - Crazy face (tongue out, finger on forehead)
- `sticker-5.png` - Thank you meme (serious face with "THANK YOU NIGGA" text)

## How to Add More Stickers

1. Add image file to this folder (e.g., `sticker-6.png`)
2. Edit `client/src/data/stickers.js`
3. Add new sticker object:
   ```javascript
   {
     id: 'sticker-6',
     name: 'Your Sticker Name',
     url: '/stickers/sticker-6.png',
     emoji: '😎'
   }
   ```

## Tips

- Use transparent backgrounds (PNG) for best results
- Keep file sizes under 500KB for fast loading
- Square images work best (1:1 aspect ratio)
- Compress images before adding to reduce bandwidth
