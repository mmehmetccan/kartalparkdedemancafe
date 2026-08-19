const breakfastRepository = require('../repositories/breakfastRepository');

const HOTEL_TIME_ZONE = process.env.HOTEL_TIME_ZONE || 'Europe/Istanbul';

const getHotelDateParts = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: HOTEL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
};

const cancelOverdueBreakfasts = async (now = new Date()) => {
    const { date, hour } = getHotelDateParts(now);
    return breakfastRepository.cancelOverdue({ date, hour, now });
};

const startBreakfastScheduler = () => {
    const run = () => cancelOverdueBreakfasts().catch((error) => console.error('Kahvaltı iptal görevi hatası:', error.message));
    run();
    return setInterval(run, 60 * 1000);
};

module.exports = { cancelOverdueBreakfasts, getHotelDateParts, startBreakfastScheduler };
