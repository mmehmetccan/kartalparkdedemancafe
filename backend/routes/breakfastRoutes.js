const express = require('express');
const crypto = require('crypto');
const breakfastRepository = require('../repositories/breakfastRepository');
const { allowRoles, protectAdmin } = require('../middleware/authMiddleware');
const { cancelOverdueBreakfasts, getHotelDateParts } = require('../services/breakfastScheduler');
const { createAppError, sendAppError, sendError } = require('../utils/apiResponse');

const router = express.Router();
const BREAKFAST_CREATORS = ['admin', 'reception'];
const BREAKFAST_OPERATORS = ['admin', 'reception', 'chef'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const dateAfter = (date, days) => {
    const result = new Date(`${date}T00:00:00.000Z`);
    result.setUTCDate(result.getUTCDate() + days);
    return result.toISOString().slice(0, 10);
};

const getDateRange = (query) => {
    const period = ['day', 'week', 'month'].includes(query.period) ? query.period : 'month';
    const selectedDate = DATE_PATTERN.test(String(query.date || '')) ? query.date : getHotelDateParts().date;
    if (period === 'day') return { period, startDate: selectedDate, endDate: selectedDate };
    if (period === 'week') {
        const selected = new Date(`${selectedDate}T00:00:00.000Z`);
        const startDate = dateAfter(selectedDate, -(selected.getUTCDay() + 6) % 7);
        return { period, startDate, endDate: dateAfter(startDate, 6) };
    }
    const month = /^\d{4}-\d{2}$/.test(String(query.month || '')) ? query.month : selectedDate.slice(0, 7);
    const [year, monthNumber] = month.split('-').map(Number);
    return { period, startDate: `${month}-01`, endDate: new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10) };
};

const validateInput = ({ roomNumber, guestCount, requestedTime, scheduledDate }) => {
    if (!roomNumber) throw createAppError('breakfast.room_required');
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) throw createAppError('breakfast.guest_count_invalid');
    if (!TIME_PATTERN.test(requestedTime)) throw createAppError('breakfast.requested_time_invalid');
    if (!DATE_PATTERN.test(scheduledDate)) throw createAppError('breakfast.date_invalid');
};

const ensureInitialDateAllowed = (scheduledDate, requestedTime) => {
    const hotelNow = getHotelDateParts();
    const tomorrow = dateAfter(hotelNow.date, 1);
    if (scheduledDate < hotelNow.date || scheduledDate > tomorrow) throw createAppError('breakfast.date_out_of_window');
    if (scheduledDate === hotelNow.date && (hotelNow.hour >= 14 || requestedTime <= `${String(hotelNow.hour).padStart(2, '0')}:00`)) {
        throw createAppError('breakfast.same_day_time_invalid');
    }
};

router.post('/', protectAdmin, allowRoles(...BREAKFAST_CREATORS), async (req, res) => {
    const roomNumber = String(req.body.roomNumber || '').trim();
    const note = String(req.body.note || '').trim();
    const guestCount = Number(req.body.guestCount);
    const requestedTime = String(req.body.requestedTime || '').trim();
    const scheduledDate = String(req.body.scheduledDate || '').trim();
    const days = Number(req.body.days || 1);
    try {
        validateInput({ roomNumber, guestCount, requestedTime, scheduledDate });
        ensureInitialDateAllowed(scheduledDate, requestedTime);
        if (!Number.isInteger(days) || days < 1 || days > 30) throw createAppError('breakfast.days_invalid');
        const planId = crypto.randomUUID();
        const records = Array.from({ length: days }, (_, index) => ({
            roomNumber,
            note,
            guestCount,
            requestedTime,
            scheduledDate: dateAfter(scheduledDate, index),
            planId
        }));
        const breakfasts = await breakfastRepository.createMany(records);
        return res.status(201).json({ breakfasts, planId });
    } catch (error) {
        return sendAppError(req, res, error, 400, 'breakfast.create_failed');
    }
});

router.get('/active', protectAdmin, allowRoles(...BREAKFAST_OPERATORS), async (req, res) => {
    try {
        await cancelOverdueBreakfasts();
        const { date } = getHotelDateParts();
        return res.json(await breakfastRepository.findActive(date));
    } catch {
        return sendError(req, res, 500, 'breakfast.active_fetch_failed');
    }
});

router.put('/:id', protectAdmin, allowRoles(...BREAKFAST_CREATORS), async (req, res) => {
    const roomNumber = String(req.body.roomNumber || '').trim();
    const note = String(req.body.note || '').trim();
    const guestCount = Number(req.body.guestCount);
    const requestedTime = String(req.body.requestedTime || '').trim();
    const scheduledDate = String(req.body.scheduledDate || '').trim();
    try {
        validateInput({ roomNumber, guestCount, requestedTime, scheduledDate });
        const breakfast = await breakfastRepository.updatePending(req.params.id, {
            roomNumber,
            note,
            guestCount,
            requestedTime,
            scheduledDate
        });
        if (!breakfast) return sendError(req, res, 404, 'breakfast.editable_not_found');
        return res.json(breakfast);
    } catch (error) {
        return sendAppError(req, res, error, 400, 'breakfast.update_failed');
    }
});

router.put('/:id/deliver', protectAdmin, allowRoles(...BREAKFAST_OPERATORS), async (req, res) => {
    try {
        await cancelOverdueBreakfasts();
        const breakfast = await breakfastRepository.deliverPending(req.params.id);
        if (!breakfast) return sendError(req, res, 404, 'breakfast.pending_not_found');
        return res.json(breakfast);
    } catch {
        return sendError(req, res, 400, 'breakfast.deliver_failed');
    }
});

router.get('/history', protectAdmin, allowRoles(...BREAKFAST_OPERATORS), async (req, res) => {
    try {
        const range = getDateRange(req.query);
        const breakfasts = await breakfastRepository.findHistory(range.startDate, range.endDate);
        return res.json({ ...range, breakfasts });
    } catch (error) {
        return sendAppError(req, res, error, 400, 'breakfast.history_fetch_failed');
    }
});

module.exports = router;
