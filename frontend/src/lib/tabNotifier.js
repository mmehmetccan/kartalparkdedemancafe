const BLINK_INTERVAL_MS = 1100;
const ICON_SIZE = 64;

let baseTitle = null;
let baseIconHref = null;
let blinkTimer = null;
let listenersBound = false;
let showingAlert = false;
let unread = 0;
let alertText = '';

const iconLink = () => {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
};

const badgeIcon = (count) => {
  const canvas = document.createElement('canvas');
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.fillStyle = '#0f5132';
  context.beginPath();
  context.arc(32, 32, 31, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#e5484d';
  context.beginPath();
  context.arc(42, 22, 21, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#ffffff';
  context.font = 'bold 28px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(count > 9 ? '9+' : String(count), 42, 24);

  return canvas.toDataURL('image/png');
};

const paint = () => {
  document.title = showingAlert ? `(${unread}) ${alertText}` : baseTitle;
  const link = iconLink();
  if (!showingAlert) {
    link.href = baseIconHref;
    return;
  }
  const badge = badgeIcon(unread);
  if (badge) link.href = badge;
};

const isBeingWatched = () => document.visibilityState === 'visible' && document.hasFocus();

export const clearTabNotification = () => {
  if (blinkTimer) {
    window.clearInterval(blinkTimer);
    blinkTimer = null;
  }
  if (!unread) return;
  unread = 0;
  showingAlert = false;
  paint();
};

const bindListeners = () => {
  if (listenersBound) return;
  listenersBound = true;
  window.addEventListener('focus', clearTabNotification);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') clearTabNotification();
  });
};

/**
 * WhatsApp'taki gibi sekme başlığını yanıp söndürür ve favicon'a sayaç rozeti basar.
 * Sekmeye bakılıyorsa uyarı gösterilmez, odak geri geldiğinde otomatik temizlenir.
 */
export const flashTabNotification = (message, count = 1) => {
  if (isBeingWatched()) return;

  baseTitle ??= document.title;
  baseIconHref ??= iconLink().getAttribute('href') || '/favicon.svg';
  bindListeners();

  unread += Math.max(1, count);
  alertText = message || baseTitle;
  showingAlert = true;
  paint();

  if (blinkTimer) return;
  blinkTimer = window.setInterval(() => {
    showingAlert = !showingAlert;
    paint();
  }, BLINK_INTERVAL_MS);
};
