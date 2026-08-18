const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    photo: { type: String, default: '' },
    businessName: { type: String, default: '' },
    about: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },

    // Primary service picked at registration time (also mirrored into `services[]`
    // below so existing search-by-subcategory queries keep working unchanged).
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },

    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: { type: String, default: '' },
      area: { type: String, default: '' },
      city: { type: String, default: '' },
      pincode: { type: String, default: '' },
      serviceRadiusKm: { type: Number, default: 10 }
    },

    services: [
      {
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
        price: { type: Number, default: 0 },
        priceUnit: { type: String, enum: ['fixed', 'per_hour', 'per_visit'], default: 'fixed' }
      }
    ],

    availability: {
      workingDays: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '18:00' },
      isAvailableNow: { type: Boolean, default: true }
    },

    verification: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      documents: [{ docType: String, url: String }],
      rejectionReason: String,
      verifiedAt: Date
    },

    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },

    isLive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false } // mirrors verification.status === 'approved'
  },
  { timestamps: true }
);

providerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Provider', providerSchema);
