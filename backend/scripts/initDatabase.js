require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { getDatabaseConfig } = require('../config/env');

const runInit = async () => {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSql
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean);

    const config = getDatabaseConfig();

    const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
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
