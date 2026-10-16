import { api } from './api';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

const streamUrl = () => `${(api.defaults.baseURL || '/api').replace(/\/+$/, '')}/orders/stream`;

const parseFrame = (frame) => {
  let event = 'message';
  const data = [];
  frame.split('\n').forEach((line) => {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trim());
  });
  if (!data.length) return null;
  try {
    return { event, payload: JSON.parse(data.join('\n')) };
  } catch {
    return null;
  }
};

/**
 * Sipariş olaylarını canlı dinler. EventSource yerine fetch akışı kullanılır,
 * böylece oturum jetonu adres satırı yerine Authorization başlığıyla gider.
 */
export const subscribeToOrderStream = ({ token, onEvent, onStatus, onUnauthorized }) => {
  let controller = null;
  let retryTimer = null;
  let attempt = 0;
  let stopped = false;

  const scheduleReconnect = () => {
    if (stopped) return;
    const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
    attempt += 1;
    retryTimer = window.setTimeout(() => { void connect(); }, delay);
  };

  const readStream = async (body) => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done || stopped) return;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = frame.startsWith(':') ? null : parseFrame(frame);
        if (parsed) onEvent?.(parsed.event, parsed.payload);
        boundary = buffer.indexOf('\n\n');
      }
    }
  };

  const connect = async () => {
    if (stopped) return;
    controller = new AbortController();

    try {
      const response = await fetch(streamUrl(), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: controller.signal,
        cache: 'no-store'
      });

      if (response.status === 401 || response.status === 403) {
        stopped = true;
        onUnauthorized?.();
        return;
      }
      if (!response.ok || !response.body) throw new Error(`order_stream_${response.status}`);

      attempt = 0;
      onStatus?.('online');
      await readStream(response.body);
    } catch {
      // Ağ kesintileri beklenen durumdur; aşağıda yeniden bağlanılır.
    }

    if (stopped) return;
    onStatus?.('offline');
    scheduleReconnect();
  };

  void connect();

  return () => {
    stopped = true;
    window.clearTimeout(retryTimer);
    controller?.abort();
  };
};
