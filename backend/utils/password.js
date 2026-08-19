const crypto = require('crypto');

const hashPassword = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex');

const createPasswordHash = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    return `${salt}:${hashPassword(password, salt)}`;
};

const verifyPassword = (enteredPassword, storedPassword) => {
    const [salt, storedHash] = String(storedPassword || '').split(':');
    if (!salt || !storedHash) return false;

    const enteredHash = hashPassword(enteredPassword, salt);
    return crypto.timingSafeEqual(
        Buffer.from(storedHash, 'hex'),
        Buffer.from(enteredHash, 'hex')
    );
};

module.exports = { createPasswordHash, verifyPassword };
