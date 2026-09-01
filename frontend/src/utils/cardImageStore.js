const PREFIX = 'cf_card_img_';

export function saveCardImage(userPhone, cardId, dataUrl) {
  if (!userPhone || !cardId || !dataUrl) return;
  try {
    localStorage.setItem(`${PREFIX}${userPhone}_${cardId}`, dataUrl);
  } catch (e) {
    console.warn('Could not cache card image locally', e);
  }
}

export function getCardImage(userPhone, cardId) {
  if (!userPhone || !cardId) return null;
  try {
    return localStorage.getItem(`${PREFIX}${userPhone}_${cardId}`);
  } catch (e) {
    return null;
  }
}
