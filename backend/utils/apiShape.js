const parseJson = (value, fallback = null) => {
    if (value == null) return fallback;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const mapTimestamps = (row) => ({
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

const mapUser = (row, { includePassword = false } = {}) => {
    if (!row) return null;
    const user = {
        _id: row.id,
        id: row.id,
        username: row.username,
        role: row.role,
        ...mapTimestamps(row)
    };
    if (includePassword) user.password = row.password;
    return user;
};

const mapProduct = (row) => {
    if (!row) return null;
    return {
        _id: row.id,
        name: row.name,
        category: row.category,
        menuSection: row.menu_section || null,
        menuSubsection: row.menu_subsection || null,
        description: row.description || '',
        intensity: row.intensity == null ? undefined : Number(row.intensity),
        sellingPrice: Number(row.selling_price),
        costPrice: Number(row.cost_price),
        imageUrl: row.image_url || '',
        translations: parseJson(row.translations, {}),
        isAvailable: Boolean(row.is_available),
        ...mapTimestamps(row)
    };
};

const mapOrder = (row) => {
    if (!row) return null;
    const items = parseJson(row.items, []).map((item) => ({
        product: item.product,
        name: item.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        costPrice: Number(item.costPrice)
    }));

    return {
        _id: row.id,
        roomNumber: row.room_number,
        isOwnOrder: Boolean(row.is_own_order),
        items,
        paymentMethod: row.payment_method,
        status: row.status,
        totalRevenue: Number(row.total_revenue),
        totalCost: Number(row.total_cost),
        totalProfit: Number(row.total_profit),
        deliveredAt: row.delivered_at,
        cancelledAt: row.cancelled_at,
        ...mapTimestamps(row)
    };
};

const mapBreakfast = (row) => {
    if (!row) return null;
    const scheduledDate = row.scheduled_date instanceof Date
        ? row.scheduled_date.toISOString().slice(0, 10)
        : String(row.scheduled_date).slice(0, 10);

    return {
        _id: row.id,
        roomNumber: row.room_number,
        note: row.note || '',
        guestCount: Number(row.guest_count),
        requestedTime: row.requested_time,
        scheduledDate,
        planId: row.plan_id || null,
        status: row.status,
        deliveredAt: row.delivered_at,
        cancelledAt: row.cancelled_at,
        cancellationReason: row.cancellation_reason || '',
        ...mapTimestamps(row)
    };
};

module.exports = {
    mapUser,
    mapProduct,
    mapOrder,
    mapBreakfast
};
