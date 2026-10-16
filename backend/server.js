require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./config/db');
const { assertJwtSecret } = require('./config/env');
const { localeMiddleware } = require('./middleware/localeMiddleware');
const { startBreakfastScheduler } = require('./services/breakfastScheduler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
for (const menuDir of [
    path.join(__dirname, '../frontend/public/menu-products'),
    path.join(__dirname, '../frontend/dist/menu-products'),
    path.join(__dirname, '../static/menu-products')
]) {
    if (fs.existsSync(menuDir)) app.use('/menu-products', express.static(menuDir));
}
app.use(localeMiddleware);

// Rotaları içeri aktar
const productRoutes = require('./routes/productRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const breakfastRoutes = require('./routes/breakfastRoutes'); 

// Rotaları kullan (Hatanın çıktığı yer buralardı)
app.use('/api/products', productRoutes);
app.use('/api/admin-users', adminUserRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/breakfast', breakfastRoutes); 

// Test rotası
app.get('/', (req, res) => {
    res.send('Kartal Park Dedeman Cafe API Çalışıyor!');
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        assertJwtSecret();
    } catch (error) {
        console.error(`Yapılandırma hatası: ${error.message}`);
        process.exit(1);
    }

    await connectDB();
    startBreakfastScheduler();
    app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda ayaklandı.`));
};

startServer();
