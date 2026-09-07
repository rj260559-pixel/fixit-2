const Provider = require('../models/Provider');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;       // Indian 10-digit mobile
const PINCODE_RE = /^\d{6}$/;          // Indian 6-digit pincode

// GET /api/providers/search?categoryId=&subcategoryId=&city=&area=&pincode=&lng=&lat=&maxDistanceKm=
const searchProviders = async (req, res) => {
  try {
    const { categoryId, subcategoryId, city, area, pincode, lng, lat, maxDistanceKm } = req.query;

    const query = {
      isLive: true,
      'verification.status': 'approved'
    };

    if (categoryId) {
      query.$or = [
        { category: categoryId },
        { 'services.categoryId': categoryId }
      ];
    }

    if (subcategoryId) {
      query['services.subcategoryId'] = subcategoryId;
    }

    const locationFilters = [];
    if (city) {
      locationFilters.push({ 'location.city': new RegExp(String(city).trim(), 'i') });
    }
    if (area) {
      locationFilters.push({ 'location.area': new RegExp(String(area).trim(), 'i') });
    }
    if (pincode) {
      locationFilters.push({ 'location.pincode': new RegExp(`^${String(pincode).trim()}$`) });
    }

    if (locationFilters.length > 0) {
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: locationFilters }];
        delete query.$or;
      } else {
        query.$or = locationFilters;
      }
    }

    // Geo search takes priority when coordinates are given
    if (lng && lat) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: (parseFloat(maxDistanceKm) || 15) * 1000
        }
      };
    }

    const providers = await Provider.find(query)
      .populate('userId', 'name')
      .populate('category', 'name icon')
      .populate('services.categoryId', 'name icon')
      .populate('services.subcategoryId', 'name')
      .limit(50);

    res.json(providers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/providers/:id
const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('services.subcategoryId', 'name nameHi')
      .populate('services.categoryId', 'name nameHi icon')
      .populate('category', 'name nameHi icon')
      .populate('subcategory', 'name nameHi');

    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    provider.profileViews += 1;
    await provider.save();

    res.json(provider);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/providers/me  (logged-in provider's own profile)
const getMyProvider = async (req, res) => {
  const provider = await Provider.findOne({ userId: req.user._id })
    .populate('services.subcategoryId', 'name')
    .populate('services.categoryId', 'name')
    .populate('category', 'name icon')
    .populate('subcategory', 'name');
  res.json(provider);
};

// PUT /api/providers/me  (logged-in provider updates own profile)
const updateMyProvider = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });

    const editableFields = [
      'photo', 'businessName', 'about', 'experienceYears',
      'category', 'subcategory', 'location', 'services', 'availability'
    ];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) provider[field] = req.body[field];
    });

    await provider.save();
    res.json(provider);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/providers/register  (dedicated "Become a Provider" registration form)
const registerProvider = async (req, res) => {
  try {
    const {
      name, email, phone, password, confirmPassword,
      category, subcategory, city, area, pincode,
      experience, description, profilePhoto
    } = req.body;

    // ---- Required field validation ----
    const required = { name, email, phone, password, confirmPassword, category, subcategory, city, pincode };
    const missing = Object.entries(required).filter(([, v]) => !v || String(v).trim() === '').map(([k]) => k);
    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number' });
    }
    if (!PINCODE_RE.test(pincode)) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit pincode' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and Confirm Password do not match' });
    }

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email or phone already exists' });
    }

    // User model hashes the password automatically via its pre-save hook,
    // so the plain-text password never touches the Provider document.
    const user = await User.create({ name, email, phone, password, role: 'provider' });

    const provider = await Provider.create({
      userId: user._id,
      businessName: name,
      about: description || '',
      photo: profilePhoto || '',
      experienceYears: Number(experience) || 0,
      category,
      subcategory,
      location: { city, area: area || '', pincode },
      // Mirror the primary service into services[] so the existing
      // location/subcategory search (providerController.searchProviders) finds it.
      services: [{ categoryId: category, subcategoryId: subcategory, price: 0, priceUnit: 'fixed' }]
    });

    res.status(201).json({
      _id: provider._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: provider.isVerified,
      token: generateToken(user._id, user.role)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/providers/login
const loginProvider = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email, role: 'provider' });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const provider = await Provider.findOne({ userId: user._id });

    res.json({
      _id: provider?._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: provider?.isVerified || false,
      token: generateToken(user._id, user.role)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/providers/:id  (protected; a provider can only edit their own profile)
const updateProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    if (provider.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own provider profile' });
    }

    const editableFields = [
      'photo', 'businessName', 'about', 'experienceYears',
      'category', 'subcategory', 'location', 'services', 'availability'
    ];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) provider[field] = req.body[field];
    });

    await provider.save();
    res.json(provider);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  searchProviders,
  getProviderById,
  getMyProvider,
  updateMyProvider,
  registerProvider,
  loginProvider,
  updateProviderById
};
