import productStageBackgroundImage from '../assets/product-stage-background.webp';

export const PRODUCT_STAGE_BACKGROUND_IMAGE = productStageBackgroundImage;

const APP_BASES = ['parkdedemankartal/', 'api/'];

export const appBaseUrl = () => String(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

export const normalizePublicPath = (value = '') => {
  let path = String(value || '').trim();
  if (!path) return '';

  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname || '';
    } catch {
      return '';
    }
  }

  path = path.replace(/\\/g, '/').replace(/^\/+/, '');
  for (const base of APP_BASES) {
    if (path.toLowerCase().startsWith(base)) {
      path = path.slice(base.length);
    }
  }
  path = path.replace(/^\/+/, '');
  if (!path || path.includes('..')) return '';
  return path;
};

export const normalizeProductImagePath = (value = '') => {
  let path = normalizePublicPath(value);
  if (!path) return '';
  path = path.replace(/^(menu-products\/[^/]+)-v\d+(\.[a-z0-9]+)$/i, '$1$2');
  if (!path.includes('/')) {
    path = `menu-products/${path}`;
  }
  if (/^menu-products\//i.test(path)) {
    path = path.replace(/\.(png|jpe?g)$/i, '.webp');
  }
  return path;
};

export const publicAsset = (path = '') => {
  const relative = normalizePublicPath(path);
  return relative ? `${appBaseUrl()}${relative}` : '';
};

export const resolveProductImageUrl = (imageUrl) => {
  const path = normalizeProductImagePath(imageUrl);
  const apiBase = String(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  // Vite ayrı portta çalışırken yüklenen resimler API sunucusunda bulunur.
  if (path.startsWith('uploads/') && /^https?:\/\//i.test(apiBase)) {
    return `${apiBase.replace(/\/api$/i, '')}/${path}`;
  }
  return publicAsset(path);
};

export const applyPublicAssetCssVars = () => {
  const root = document.documentElement;
  root.style.setProperty('--hotel-lobby-image', `url("${publicAsset('park-dedeman-lobby.webp')}")`);
  root.style.setProperty('--hotel-entrance-image', `url("${publicAsset('park-dedeman-entrance.webp')}")`);
  root.style.setProperty('--product-stage-background', `url("${PRODUCT_STAGE_BACKGROUND_IMAGE}")`);
};
