const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');

// GET /api/categories
const getCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('order');
  res.json(categories);
};

// GET /api/categories/:categoryId/subcategories
const getSubcategories = async (req, res) => {
  const subcategories = await Subcategory.find({
    categoryId: req.params.categoryId,
    isActive: true
  });
  res.json(subcategories);
};

module.exports = { getCategories, getSubcategories };
