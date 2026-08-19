import { toast } from 'react-toastify';

let audioContext;

const playTone = (frequency, startTime, duration) => {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
};

export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext ||= new AudioContext();
    audioContext.resume();
    const now = audioContext.currentTime;
    playTone(784, now, 0.13);
    playTone(1047, now + 0.16, 0.2);
  } catch {
    // Browser audio permission is optional; visual notification remains available.
  }
};

export const announceNewItems = (messageOrType, count) => {
  playNotificationSound();
  const message = count === undefined ? messageOrType : `${count} yeni ${messageOrType} geldi.`;
  toast.info(message, { icon: '🔔', autoClose: 6000 });
};
