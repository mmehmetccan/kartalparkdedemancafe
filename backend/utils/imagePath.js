const APP_BASES = ['parkdedemankartal/', 'api/'];

const normalizePublicPath = (value = '') => {
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
    if (!path || path.includes('..')) {
        return '';
    }
    return path;
};

const normalizeProductImagePath = (value = '') => {
    let path = normalizePublicPath(value);
    if (!path) return '';
    path = path.replace(/^(menu-products\/[^/]+)-v\d+(\.[a-z0-9]+)$/i, '$1$2');
    if (!path.includes('/')) {
        path = `menu-products/${path}`;
    }
    if (/^menu-products\//i.test(path)) {
        path = path.replace(/\.(png|jpe?g)$/i, '.webp');
    } else if (/^uploads\/products\/.+\.(png|jpe?g)$/i.test(path)) {
        const fs = require('fs');
        const nodePath = require('path');
        const webp = path.replace(/\.(png|jpe?g)$/i, '.webp');
        if (fs.existsSync(nodePath.join(__dirname, '..', webp))) {
            path = webp;
        }
    }
    return path;
};

module.exports = { normalizePublicPath, normalizeProductImagePath };
