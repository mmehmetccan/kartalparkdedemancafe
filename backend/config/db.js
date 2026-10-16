const mysql = require('mysql2/promise');
const { getDatabaseConfig } = require('./env');

let pool;

const getPool = () => {
    if (!pool) {
        throw new Error('MySQL bağlantı havuzu henüz başlatılmadı.');
    }
    return pool;
};

const connectDB = async () => {
    try {
        const config = getDatabaseConfig();

        pool = mysql.createPool({
            ...config,
            waitForConnections: true,
            connectionLimit: 10,
            timezone: 'Z',
            dateStrings: false
        });

        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log(`MySQL Bağlantısı Başarılı: ${config.host}:${config.port}/${config.database}`);
    } catch (error) {
        console.error(`MySQL Hata: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB, getPool };
