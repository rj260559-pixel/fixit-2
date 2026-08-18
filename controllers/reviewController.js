const Review = require('../models/Review');
const Provider = require('../models/Provider');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');

// POST /api/reviews  (customer reviews after a completed booking)
const createReview = async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user._id });
    const booking = await Booking.findById(req.body.bookingId);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review a completed booking' });
    }

    const review = await Review.create({
      bookingId: booking._id,
      customerId: customer._id,
      providerId: booking.providerId,
      rating: req.body.rating,
      comment: req.body.comment
    });

    // Recalculate the provider's average rating from real data (no static numbers)
    const stats = await Review.aggregate([
      { $match: { providerId: booking.providerId } },
      { $group: { _id: '$providerId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Provider.findByIdAndUpdate(booking.providerId, {
        ratingAvg: Math.round(stats[0].avg * 10) / 10,
        ratingCount: stats[0].count
      });
    }

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews/provider/:providerId
const getProviderReviews = async (req, res) => {
  const reviews = await Review.find({ providerId: req.params.providerId, isReported: false })
    .populate({ path: 'customerId', populate: { path: 'userId', select: 'name' } })
    .sort('-createdAt');
  res.json(reviews);
};

module.exports = { createReview, getProviderReviews };
