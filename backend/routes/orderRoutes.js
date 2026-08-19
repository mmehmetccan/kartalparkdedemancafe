const express = require('express');
const orderRepository = require('../repositories/orderRepository');
const productRepository = require('../repositories/productRepository');
const { allowRoles, protectAdmin, protectGuest } = require('../middleware/authMiddleware');
const { createAppError, sendAppError, sendError } = require('../utils/apiResponse');

const router = express.Router();
const STAFF_ROLES = ['admin', 'reception', 'chef'];

const parseIsoDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatIsoDate = (date) => date.toISOString().slice(0, 10);
const plusDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const getDateRange = (query) => {
    const period = ['day', 'week', 'month', 'custom'].includes(query.period) ? query.period : 'month';
    const today = parseIsoDate(query.date) || parseIsoDate(new Date().toISOString().slice(0, 10));

    if (period === 'custom') {
        const start = parseIsoDate(query.start);
        const endDay = parseIsoDate(query.end);
        if (!start || !endDay || endDay < start) throw createAppError('orders.invalid_date_range');
        return { period, start, end: plusDays(endDay, 1), startDate: formatIsoDate(start), endDate: formatIsoDate(endDay) };
    }

    if (period === 'day') {
        return { period, start: today, end: plusDays(today, 1), startDate: formatIsoDate(today), endDate: formatIsoDate(today) };
    }

    if (period === 'week') {
        const weekStart = plusDays(today, -(today.getUTCDay() + 6) % 7);
        return { period, start: weekStart, end: plusDays(weekStart, 7), startDate: formatIsoDate(weekStart), endDate: formatIsoDate(plusDays(weekStart, 6)) };
    }

    const month = /^\d{4}-\d{2}$/.test(String(query.month || ''))
        ? query.month
        : formatIsoDate(today).slice(0, 7);
    const [year, monthNumber] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 1));
    return { period, start, end, startDate: formatIsoDate(start), endDate: formatIsoDate(plusDays(end, -1)) };
};

const buildOrderItems = async (requestedItems) => {
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
        throw createAppError('orders.empty_items');
    }

    const quantities = new Map();
    requestedItems.forEach(({ productId, quantity }) => {
        const parsedQuantity = Number(quantity);
        if (!productId || !Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 20) {
            throw createAppError('orders.invalid_items');
        }
        quantities.set(String(productId), (quantities.get(String(productId)) || 0) + parsedQuantity);
    });

    const productIds = [...quantities.keys()];
    const products = await productRepository.findByIds(productIds, { availableOnly: true });
    if (products.length !== productIds.length) {
        throw createAppError('orders.unavailable_product');
    }

    return products.map((product) => ({
        product: product._id,
        name: product.name,
        quantity: quantities.get(String(product._id)),
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice
    }));
};

router.post('/', protectGuest, async (req, res) => {
    const { items: requestedItems, paymentMethod } = req.body;
    if (!['Nakit', 'Kredi Kartı'].includes(paymentMethod)) {
        return sendError(req, res, 400, 'orders.invalid_payment_method');
    }

    try {
        const items = await buildOrderItems(requestedItems);
        const totalRevenue = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
        const totalCost = items.reduce((total, item) => total + item.costPrice * item.quantity, 0);
        const isOwnOrder = String(req.roomNumber).toLowerCase() === 'own';
        const order = await orderRepository.create({
            roomNumber: req.roomNumber,
            isOwnOrder,
            items,
            paymentMethod,
            totalRevenue,
            totalCost,
            totalProfit: totalRevenue - totalCost
        });
        return res.status(201).json(order);
    } catch (error) {
        return sendAppError(req, res, error, 400, 'orders.create_failed');
    }
});

router.get('/active', protectAdmin, allowRoles(...STAFF_ROLES), async (req, res) => {
    try {
        return res.json(await orderRepository.findActive());
    } catch {
        return sendError(req, res, 500, 'orders.active_fetch_failed');
    }
});

router.get('/history', protectAdmin, allowRoles(...STAFF_ROLES), async (req, res) => {
    try {
        const range = getDateRange(req.query);
        const orders = await orderRepository.findDeliveredHistory(range.start, range.end);
        return res.json({ ...range, orders });
    } catch (error) {
        return sendAppError(req, res, error, 400, 'orders.history_fetch_failed');
    }
});

router.get('/summary', protectAdmin, allowRoles('admin'), async (req, res) => {
    try {
        const range = getDateRange(req.query);
        const summary = await orderRepository.getSummary(range.start, range.end);
        return res.json({ ...range, ...summary });
    } catch (error) {
        return sendAppError(req, res, error, 400, 'orders.summary_fetch_failed');
    }
});

router.put('/:id/deliver', protectAdmin, allowRoles(...STAFF_ROLES), async (req, res) => {
    try {
        const order = await orderRepository.deliverPending(req.params.id);
        if (!order) return sendError(req, res, 404, 'orders.pending_not_found');
        return res.json(order);
    } catch {
        return sendError(req, res, 400, 'orders.deliver_failed');
    }
});

router.put('/:id/cancel', protectAdmin, allowRoles(...STAFF_ROLES), async (req, res) => {
    try {
        const order = await orderRepository.cancelPending(req.params.id);
        if (!order) return sendError(req, res, 404, 'orders.pending_not_found');
        return res.json(order);
    } catch {
        return sendError(req, res, 400, 'orders.cancel_failed');
    }
});

module.exports = router;
