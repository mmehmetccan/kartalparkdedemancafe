import { toast } from 'react-toastify';
import { flashTabNotification } from './tabNotifier';

let audioContext;
let unlockBound = false;

const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ||= new AudioContextClass();
  return audioContext;
};

const playTone = (context, frequency, startTime, duration) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
};

/**
 * Tarayıcılar sese ilk kullanıcı hareketinden önce izin vermez; personel panelde
 * bir kez tıkladığında ses motoru kalıcı olarak açılır.
 */
export const enableNotificationSound = () => {
  if (unlockBound) return;
  unlockBound = true;
  const unlock = () => {
    void getAudioContext()?.resume();
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
};

export const playNotificationSound = () => {
  try {
    const context = getAudioContext();
    if (!context) return;
    void context.resume();
    const now = context.currentTime;
    playTone(context, 784, now, 0.13);
    playTone(context, 1047, now + 0.16, 0.2);
    playTone(context, 784, now + 0.42, 0.16);
  } catch {
    // Ses izni verilmemiş olabilir; görsel bildirim yine çalışır.
  }
};

export const announceNewItems = (message, { count = 1, tabMessage = message } = {}) => {
  playNotificationSound();
  flashTabNotification(tabMessage, count);
  toast.info(message, { icon: '🔔', autoClose: 6000 });
};
