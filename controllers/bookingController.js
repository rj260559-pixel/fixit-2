const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Provider = require('../models/Provider');
const Review = require('../models/Review');

// POST /api/bookings  (customer creates a service request)
const createBooking = async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) return res.status(400).json({ message: 'Customer profile not found' });

    const booking = await Booking.create({
      customerId: customer._id,
      providerId: req.body.providerId,
      subcategoryId: req.body.subcategoryId,
      scheduledDate: req.body.scheduledDate,
      scheduledTime: req.body.scheduledTime,
      address: req.body.address,
      location: req.body.location,
      problemDescription: req.body.problemDescription
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/my  (works for logged-in customer OR provider)
const getMyBookings = async (req, res) => {
  try {
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      // const bookings = await Booking.find({ customerId: customer._id })
      //   .populate({ path: 'providerId', populate: { path: 'userId', select: 'name' } })
      //   .populate('subcategoryId', 'name')
      //   .sort('-createdAt');
      // return res.json(bookings);
      const bookings = await Booking.find({ customerId: customer._id })
  .populate({ path: 'providerId', populate: { path: 'userId', select: 'name' } })
  .populate('subcategoryId', 'name')
  .sort('-createdAt');

const bookingsWithReview = await Promise.all(
  bookings.map(async (booking) => {
    const hasReview = await Review.exists({
      bookingId: booking._id
    });

    return {
      ...booking.toObject(),
      hasReview: !!hasReview
    };
  })
);

return res.json(bookingsWithReview);
    }

    if (req.user.role === 'provider') {
      const provider = await Provider.findOne({ userId: req.user._id });
      const bookings = await Booking.find({ providerId: provider._id })
        .populate({ path: 'customerId', populate: { path: 'userId', select: 'name phone' } })
        .populate('subcategoryId', 'name')
        .sort('-createdAt');
      return res.json(bookings);
    }

    res.status(403).json({ message: 'Not allowed for this role' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/bookings/:id/status  (provider accepts/updates a booking)
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const allowedStatuses = ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    booking.status = req.body.status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createBooking, getMyBookings, updateBookingStatus };
