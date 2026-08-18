const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    address: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    }
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    savedAddresses: [addressSchema],
    favouriteProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Provider' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
