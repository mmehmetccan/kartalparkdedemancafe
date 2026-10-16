import { publicAsset } from './publicAsset';

export const resolveProductMotionKey = (imageUrl = '') => String(imageUrl)
  .split(/[?#]/, 1)[0]
  .split('/').pop()
  .replace(/\.[^.]+$/, '')
  .replace(/-v\d+$/i, '')
  .toLowerCase();

export const resolveProductMotionCutout = (imageUrl = '') => {
  const key = resolveProductMotionKey(imageUrl);
  return key ? publicAsset(`menu-products/motion/${key}-cutout.webp`) : '';
};
