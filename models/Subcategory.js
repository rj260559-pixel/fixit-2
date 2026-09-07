const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  name: {
    type: String,
    required: true
  },

  nameHi: String,

  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Subcategory', subcategorySchema);