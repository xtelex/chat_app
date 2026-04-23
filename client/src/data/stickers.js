// Sticker packs for the chat app
// Each sticker has an id, name, and image URL

export const stickerPacks = [
  {
    id: 'default',
    name: 'Default Pack',
    stickers: [
      {
        id: 'sticker-1',
        name: 'Surprised Face',
        url: '/stickers/sticker-1.png',
        emoji: '😮'
      },
      {
        id: 'sticker-2',
        name: 'Flex',
        url: '/stickers/sticker-2.png',
        emoji: '💪'
      },
      {
        id: 'sticker-3',
        name: 'Call Me',
        url: '/stickers/sticker-3.png',
        emoji: '🤙'
      },
      {
        id: 'sticker-4',
        name: 'Crazy Face',
        url: '/stickers/sticker-4.png',
        emoji: '🤪'
      },
      {
        id: 'sticker-5',
        name: 'Thank You',
        url: '/stickers/sticker-5.png',
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
