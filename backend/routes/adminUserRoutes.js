const express = require('express');
const userRepository = require('../repositories/userRepository');
const { protectAdmin, allowRoles } = require('../middleware/authMiddleware');
const { createAppError, sendAppError, sendError, sendMessage } = require('../utils/apiResponse');

const router = express.Router();

const validateCredentials = (username, password) => {
    if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
        return createAppError('admin_users.username_invalid');
    }
    if (password.length < 8) {
        return createAppError('admin_users.password_invalid');
    }
    return null;
};

router.use(protectAdmin, allowRoles('admin'));

router.get('/', async (req, res) => {
    try {
        return res.json(await userRepository.findAll());
    } catch {
        return sendError(req, res, 500, 'admin_users.fetch_failed');
    }
});

router.post('/', async (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const validationError = validateCredentials(username, password);
    if (validationError) return sendAppError(req, res, validationError, 400, 'admin_users.create_failed');

    try {
        const role = ['admin', 'reception', 'chef'].includes(req.body.role) ? req.body.role : 'reception';
        const user = await userRepository.create({ username, password, role });
        return res.status(201).json(user);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return sendError(req, res, 409, 'admin_users.username_taken');
        }
        return sendAppError(req, res, error, 400, 'admin_users.create_failed');
    }
});

router.put('/:id/password', async (req, res) => {
    const password = String(req.body.password || '');
    if (password.length < 8) {
        return sendError(req, res, 400, 'admin_users.password_invalid');
    }

    try {
        const user = await userRepository.findById(req.params.id);
        if (!user) return sendError(req, res, 404, 'admin_users.not_found');

        await userRepository.updatePassword(user.id, password);
        return sendMessage(req, res, 200, 'admin_users.password_updated', { username: user.username });
    } catch {
        return sendError(req, res, 400, 'admin_users.password_update_failed');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const user = await userRepository.findById(req.params.id);
        if (!user) return sendError(req, res, 404, 'admin_users.not_found');
        if (String(user.id) === String(req.user.id)) {
            return sendError(req, res, 400, 'admin_users.cannot_delete_self');
        }
        if (user.role === 'admin' && await userRepository.countByRole('admin') <= 1) {
            return sendError(req, res, 400, 'admin_users.cannot_delete_last_admin');
        }

        await userRepository.remove(user.id);
        return sendMessage(req, res, 200, 'admin_users.deleted', { username: user.username });
    } catch {
        return sendError(req, res, 400, 'admin_users.delete_failed');
    }
});

module.exports = router;
