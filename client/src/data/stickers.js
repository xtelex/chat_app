// Sticker packs for the chat app
// Each sticker has an id, name, and image URL

export const stickerPacks = [
  {
    id: 'default',
    name: 'Default Pack',
    stickers: [
      {
        id: 'sticker-1',
        name: 'Image',
        url: '/stickers/image-removebg-preview.png',
        emoji: '😮'
      },
      {
        id: 'sticker-2',
        name: 'Coco',
        url: '/stickers/coco-removebg-preview.png',
        emoji: '💪'
      },
      {
        id: 'sticker-3',
        name: 'Alden',
        url: '/stickers/alden-removebg-preview.png',
        emoji: '🤙'
      },
      {
        id: 'sticker-4',
        name: 'Malupiton',
        url: '/stickers/malupiton-removebg-preview.png',
        emoji: '🤪'
      },
      {
        id: 'sticker-5',
        name: 'Thank You',
        url: '/stickers/034.png',
        emoji: '🙏'
      }
    ]
  }
];

// Get all stickers from all packs
export const getAllStickers = () => {
  return stickerPacks.flatMap(pack => pack.stickers);
};

// Get sticker by ID
export const getStickerById = (id) => {
  const allStickers = getAllStickers();
  return allStickers.find(sticker => sticker.id === id);
};
