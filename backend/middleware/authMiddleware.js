const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { sendError } = require('../utils/apiResponse');
const STAFF_ROLES = ['admin', 'reception', 'chef'];
const ROOM_NUMBER_PATTERN = /^[1-6]0(?:0[1-9]|1[0-2])$/;

const getBearerToken = (req) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) return null;
    return authorization.split(' ')[1];
};

const protectGuest = (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) {
        return sendError(req, res, 401, 'auth.guest_session_missing');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.roomNumber || decoded.role) {
            return sendError(req, res, 401, 'auth.guest_session_invalid');
        }

        const roomNumber = String(decoded.roomNumber).toLowerCase();
        if (roomNumber !== 'own' && !ROOM_NUMBER_PATTERN.test(roomNumber)) {
            return sendError(req, res, 401, 'auth.guest_room_invalid');
        }
        req.roomNumber = roomNumber;
        return next();
    } catch {
        return sendError(req, res, 401, 'auth.guest_session_expired');
    }
};

const protectAdmin = async (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) {
        return sendError(req, res, 401, 'auth.admin_session_missing');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.id || !STAFF_ROLES.includes(decoded.role)) {
            return sendError(req, res, 403, 'auth.staff_session_required');
        }

        const user = await userRepository.findById(decoded.id);
        if (!user) {
            return sendError(req, res, 401, 'auth.staff_account_missing');
        }

        if (!STAFF_ROLES.includes(user.role)) {
            return sendError(req, res, 403, 'auth.staff_access_missing');
        }

        req.user = user;
        return next();
    } catch {
        return sendError(req, res, 401, 'auth.admin_session_invalid');
    }
};

const allowRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return sendError(req, res, 403, 'auth.insufficient_role');
    }
    return next();
};

module.exports = { protectGuest, protectAdmin, allowRoles };
