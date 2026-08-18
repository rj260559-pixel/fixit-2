const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameHi: String,
  icon: { type: String, default: '🔧' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
});

module.exports = mongoose.model('Category', categorySchema);
