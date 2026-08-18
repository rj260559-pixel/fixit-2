const express = require('express');
const router = express.Router();
const {
  searchProviders,
  getProviderById,
  getMyProvider,
  updateMyProvider,
  registerProvider,
  loginProvider,
  updateProviderById
} = require('../controllers/providerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// NOTE: /search, /me, /register, /login must be declared BEFORE /:id,
// otherwise Express will treat them as an :id value.
router.post('/register', registerProvider);
router.post('/login', loginProvider);
router.get('/search', searchProviders);
router.get('/me', protect, authorize('provider'), getMyProvider);
router.put('/me', protect, authorize('provider'), updateMyProvider);
router.get('/:id', getProviderById);
router.put('/:id', protect, authorize('provider'), updateProviderById);

module.exports = router;
