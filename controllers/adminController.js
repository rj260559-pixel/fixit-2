const Provider = require('../models/Provider');

// GET /api/admin/providers?status=pending
const listProviders = async (req, res) => {
  const status = req.query.status || 'pending';
  const providers = await Provider.find({ 'verification.status': status })
    .populate('userId', 'name email phone');
  res.json(providers);
};

// PUT /api/admin/providers/:id/verify   body: { status: 'approved' | 'rejected', rejectionReason }
const verifyProvider = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ message: 'Provider not found' });

  provider.verification.status = req.body.status;
  provider.verification.rejectionReason = req.body.rejectionReason || '';
  if (req.body.status === 'approved') {
    provider.verification.verifiedAt = new Date();
    provider.isLive = true;
    provider.isVerified = true;
  } else {
    provider.isLive = false;
    provider.isVerified = false;
  }

  await provider.save();
  res.json(provider);
};

module.exports = { listProviders, verifyProvider };
