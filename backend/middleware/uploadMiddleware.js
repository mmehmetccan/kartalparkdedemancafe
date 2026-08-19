const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadsDir),
    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
        const safeExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension) ? extension : '.jpg';
        callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExtension}`);
    }
});

const uploadProductImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
            callback(null, true);
            return;
        }
        callback(new Error('Yalnızca JPEG, PNG, WEBP veya GIF görselleri yüklenebilir.'));
    }
}).single('image');

module.exports = {
    uploadsDir,
    uploadProductImage
};
