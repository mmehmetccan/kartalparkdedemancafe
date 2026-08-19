const { DEFAULT_LOCALE, translate } = require('../i18n/messages');

class AppError extends Error {
    constructor(messageKey, options = {}) {
        const {
            status = 400,
            messageParams = {},
            fallbackMessage,
            exposeMessage = false
        } = options;

        super(fallbackMessage || messageKey);
        this.name = 'AppError';
        this.status = status;
        this.messageKey = messageKey;
        this.messageParams = messageParams;
        this.fallbackMessage = fallbackMessage;
        this.exposeMessage = exposeMessage;
    }
}

const createAppError = (messageKey, options) => new AppError(messageKey, options);

const getLocale = (req) => req?.locale || DEFAULT_LOCALE;

const getMessage = (req, messageKey, messageParams = {}, fallbackMessage) => (
    fallbackMessage || translate(getLocale(req), messageKey, messageParams)
);

const withMessageMeta = (req, payload = {}, messageKey, messageParams = {}, fallbackMessage) => ({
    ...payload,
    message: getMessage(req, messageKey, messageParams, fallbackMessage),
    messageKey,
    messageParams
});

const sendMessage = (req, res, status, messageKey, messageParams = {}, payload = {}, fallbackMessage) => (
    res.status(status).json(withMessageMeta(req, payload, messageKey, messageParams, fallbackMessage))
);

const sendError = (req, res, status, messageKey, messageParams = {}, fallbackMessage, payload = {}) => (
    sendMessage(req, res, status, messageKey, messageParams, payload, fallbackMessage)
);

const sendAppError = (req, res, error, fallbackStatus, fallbackKey) => {
    if (error instanceof AppError) {
        return sendError(
            req,
            res,
            error.status,
            error.messageKey,
            error.messageParams,
            error.exposeMessage ? error.message : error.fallbackMessage
        );
    }

    return sendError(req, res, fallbackStatus, fallbackKey, {}, undefined, {
        errorDetail: error?.message || undefined
    });
};

module.exports = {
    AppError,
    createAppError,
    getMessage,
    sendAppError,
    sendError,
    sendMessage,
    withMessageMeta
};
