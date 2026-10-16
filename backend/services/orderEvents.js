const HEARTBEAT_MS = 25_000;

const clients = new Set();
let heartbeat = null;

const write = (client, chunk) => {
    try {
        client.write(chunk);
        return true;
    } catch {
        clients.delete(client);
        return false;
    }
};

const startHeartbeat = () => {
    if (heartbeat) return;
    heartbeat = setInterval(() => {
        clients.forEach((client) => write(client, ': ping\n\n'));
    }, HEARTBEAT_MS);
    // Kalp atışı zamanlayıcısı sunucunun kapanmasını engellememeli.
    heartbeat.unref?.();
};

const stopHeartbeat = () => {
    if (!heartbeat || clients.size) return;
    clearInterval(heartbeat);
    heartbeat = null;
};

const sendEvent = (client, event, payload) =>
    write(client, `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);

const register = (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        // Ters vekil sunucular akışı tamponlamasın.
        'X-Accel-Buffering': 'no'
    });
    res.flushHeaders?.();

    clients.add(res);
    startHeartbeat();
    sendEvent(res, 'ready', { connectedAt: new Date().toISOString() });

    const close = () => {
        clients.delete(res);
        stopHeartbeat();
    };
    req.on('close', close);
    req.on('error', close);
};

const broadcast = (event, payload) => {
    clients.forEach((client) => sendEvent(client, event, payload));
};

const orderCreated = (order) => broadcast('order:created', order);
const orderRemoved = (order, reason) => broadcast('order:removed', { _id: order._id, reason });

module.exports = { register, broadcast, orderCreated, orderRemoved, clientCount: () => clients.size };
