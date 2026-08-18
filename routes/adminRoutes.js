const express = require('express');
const router = express.Router();
const { listProviders, verifyProvider } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));

router.get('/providers', listProviders);
router.put('/providers/:id/verify', verifyProvider);

module.exports = router;
