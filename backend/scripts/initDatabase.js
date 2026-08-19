require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const runInit = async () => {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSql
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        for (const statement of statements) {
            await connection.query(statement);
        }
        console.log('Veritabanı şeması başarıyla oluşturuldu.');
    } finally {
        await connection.end();
    }
};

runInit().catch((error) => {
    console.error(`Veritabanı kurulum hatası: ${error.message}`);
    process.exitCode = 1;
});
