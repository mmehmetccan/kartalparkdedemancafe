require('dotenv').config();
const { connectDB, getPool } = require('../config/db');
const userRepository = require('../repositories/userRepository');

const seedAdmin = async () => {
    const username = String(process.env.ADMIN_USERNAME || '').trim();
    const password = String(process.env.ADMIN_PASSWORD || '');
    if (!username || !password) {
        throw new Error('ADMIN_USERNAME ve ADMIN_PASSWORD .env dosyasında tanımlı olmalıdır.');
    }

    await connectDB();
    const user = await userRepository.upsertAdmin({ username, password, role: 'admin' });
    console.log(`Yönetici hesabı hazır: ${user.username}`);
    await getPool().end();
};

seedAdmin().catch((error) => {
    console.error(`Yönetici ekleme hatası: ${error.message}`);
    process.exitCode = 1;
});
