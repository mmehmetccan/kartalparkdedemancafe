const { DEFAULT_LOCALE, SUPPORTED_LOCALES, translate } = require('../i18n/messages');

const normalizeLocale = (value) => {
    const normalized = String(value || '').trim().toLowerCase().replace('_', '-');
    if (!normalized) return null;
    const [language] = normalized.split('-');
    return SUPPORTED_LOCALES.includes(language) ? language : null;
};

const parseAcceptLanguage = (headerValue) => String(headerValue || '')
    .split(',')
    .map((part) => {
        const [tag, qualityPart] = part.trim().split(';');
        const quality = qualityPart?.startsWith('q=') ? Number(qualityPart.slice(2)) : 1;
        return { locale: normalizeLocale(tag), quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((item) => item.locale)
    .sort((a, b) => b.quality - a.quality);

const resolveLocale = (req) => {
    const explicitLocale = normalizeLocale(req.headers['x-locale'] || req.query?.lang || req.body?.lang);
    if (explicitLocale) return explicitLocale;
    const accepted = parseAcceptLanguage(req.headers['accept-language']);
    return accepted[0]?.locale || DEFAULT_LOCALE;
};

const localeMiddleware = (req, res, next) => {
    req.locale = resolveLocale(req);
    req.t = (messageKey, messageParams = {}) => translate(req.locale, messageKey, messageParams);
    next();
};

module.exports = { localeMiddleware, resolveLocale };
