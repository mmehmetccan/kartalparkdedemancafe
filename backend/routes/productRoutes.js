const express = require('express');
const productRepository = require('../repositories/productRepository');
const { protectAdmin, protectGuest, allowRoles } = require('../middleware/authMiddleware');
const { uploadProductImage } = require('../middleware/uploadMiddleware');
const { MENU_SECTIONS } = require('../config/menuCategories');
const { sendError, sendMessage } = require('../utils/apiResponse');

const router = express.Router();
const TRANSLATION_LOCALES = new Set(['en', 'de', 'ar', 'ru']);

const getLocalizedProduct = (product, locale) => {
    const selectedLocale = TRANSLATION_LOCALES.has(locale) ? locale : null;
    const translation = selectedLocale ? product.translations?.[selectedLocale] : null;

    return {
        ...product,
        baseName: product.name,
        baseDescription: product.description || '',
        name: translation?.name?.trim() || product.name,
        description: translation?.description?.trim() || product.description || ''
    };
};

const getProductValidationFallback = (req, error) => {
    if (req.locale === 'tr' && typeof error?.message === 'string') return error.message;
    return undefined;
};

router.get('/menu-sections', protectAdmin, allowRoles('admin', 'reception', 'chef'), (_req, res) => {
    return res.json(MENU_SECTIONS);
});

router.post('/upload-image', protectAdmin, allowRoles('admin', 'reception', 'chef'), (req, res) => {
    uploadProductImage(req, res, (error) => {
        if (error) {
            return sendError(req, res, 400, 'products.image_upload_failed', {}, error.message);
        }
        if (!req.file) {
            return sendError(req, res, 400, 'products.image_required');
        }
        return res.status(201).json({
            imageUrl: `/uploads/products/${req.file.filename}`
        });
    });
});

router.get('/', protectGuest, async (req, res) => {
    try {
        const products = await productRepository.findAvailable();
        return res.json(products.map((product) => getLocalizedProduct(product, req.locale)));
    } catch {
        return sendError(req, res, 500, 'products.fetch_failed');
    }
});

router.get('/admin/all', protectAdmin, allowRoles('admin', 'reception', 'chef'), async (req, res) => {
    try {
        return res.json(await productRepository.findAll());
    } catch {
        return sendError(req, res, 500, 'products.fetch_failed');
    }
});

router.post('/', protectAdmin, allowRoles('admin', 'reception', 'chef'), async (req, res) => {
    try {
        const product = await productRepository.create(req.body);
        return res.status(201).json(product);
    } catch (error) {
        return sendError(req, res, 400, 'products.validation_failed', {}, getProductValidationFallback(req, error));
    }
});

router.put('/:id', protectAdmin, allowRoles('admin', 'reception', 'chef'), async (req, res) => {
    try {
        const product = await productRepository.update(req.params.id, req.body);
        if (!product) return sendError(req, res, 404, 'products.not_found');
        return res.json(product);
    } catch (error) {
        return sendError(req, res, 400, 'products.validation_failed', {}, getProductValidationFallback(req, error));
    }
});

router.delete('/:id', protectAdmin, allowRoles('admin', 'reception', 'chef'), async (req, res) => {
    try {
        const deleted = await productRepository.remove(req.params.id);
        if (!deleted) return sendError(req, res, 404, 'products.not_found');
        return sendMessage(req, res, 200, 'products.deleted');
    } catch {
        return sendError(req, res, 400, 'products.delete_failed');
    }
});

module.exports = router;
