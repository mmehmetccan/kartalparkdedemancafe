const express = require('express');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { sendError } = require('../utils/apiResponse');

const router = express.Router();

router.post('/login', (req, res) => {
    const requestedRoom = String(req.body.roomNumber || '').trim();
    const roomNumber = requestedRoom.toLowerCase() === 'own' ? 'own' : requestedRoom;
    if (!roomNumber) return sendError(req, res, 400, 'auth.room_required');
    if (roomNumber !== 'own' && !/^[1-6]0(?:0[1-9]|1[0-2])$/.test(roomNumber)) {
        return sendError(req, res, 400, 'auth.room_invalid');
    }

    const expiresIn = '3h';
    const token = jwt.sign({ roomNumber }, process.env.JWT_SECRET, { expiresIn });

    res.json({
        token,
        roomNumber,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    });
});

router.post('/admin/login', async (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) {
        return sendError(req, res, 400, 'auth.credentials_required');
    }

    try {
        const user = await userRepository.findByUsername(username, { includePassword: true });
        if (user && userRepository.matchPassword(user, password)) {
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );
            return res.json({ token, username: user.username, role: user.role });
        }

        return res.status(401).json({
            message: req.t('auth.invalid_credentials'),
            messageKey: 'auth.invalid_credentials',
            messageParams: {}
        });
    } catch (error) {
        return res.status(500).json({
            message: req.t('auth.admin_login_failed'),
            messageKey: 'auth.admin_login_failed',
            messageParams: {},
            errorDetail: error?.message
        });
    }
});

module.exports = router;
