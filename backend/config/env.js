const WEAK_SECRETS = new Set([
    'secret',
    'gizli_anahtar_kelimen',
    'change-this-to-a-long-random-secret'
]);

const requireEnv = (key) => {
    const value = process.env[key];
    if (value === undefined || String(value).trim() === '') {
        throw new Error(`Eksik ortam değişkeni: ${key}. backend/.env dosyasını .env.example örneğine göre doldurun.`);
    }
    return String(value).trim();
};

const getDatabaseConfig = () => {
    const port = Number(requireEnv('DB_PORT'));
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error('DB_PORT geçerli bir port numarası olmalıdır.');
    }

    return {
        host: requireEnv('DB_HOST'),
        port,
        user: requireEnv('DB_USER'),
        password: requireEnv('DB_PASSWORD'),
        database: requireEnv('DB_NAME')
    };
};

const assertJwtSecret = () => {
    const secret = requireEnv('JWT_SECRET');
    if (secret.length < 32 || WEAK_SECRETS.has(secret)) {
        throw new Error('JWT_SECRET en az 32 karakterlik rastgele bir değer olmalıdır.');
    }
    return secret;
};

module.exports = { assertJwtSecret, getDatabaseConfig, requireEnv };
