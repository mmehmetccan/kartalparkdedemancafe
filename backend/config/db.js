const mysql = require('mysql2/promise');

let pool;

const getPool = () => {
    if (!pool) {
        throw new Error('MySQL bağlantı havuzu henüz başlatılmadı.');
    }
    return pool;
};

const connectDB = async () => {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'kartalparkdedemancafe',
            waitForConnections: true,
            connectionLimit: 10,
            timezone: 'Z',
            dateStrings: false
        });

        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log(`MySQL Bağlantısı Başarılı: ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'kartalparkdedemancafe'}`);
    } catch (error) {
        console.error(`MySQL Hata: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB, getPool };
