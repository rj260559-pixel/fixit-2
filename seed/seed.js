const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const categoriesData = require('./categoriesData');

dotenv.config();

const run = async () => {
  await connectDB();

  console.log('Clearing existing categories & subcategories...');
  await Category.deleteMany();
  await Subcategory.deleteMany();

  for (let i = 0; i < categoriesData.length; i++) {
    const cat = categoriesData[i];
    const category = await Category.create({
      name: cat.name,
      nameHi: cat.nameHi,
      icon: cat.icon,
      order: i
    });

    for (const subName of cat.subcategories) {
      await Subcategory.create({ categoryId: category._id, name: subName });
    }

    console.log(`Seeded: ${cat.name} (${cat.subcategories.length} subcategories)`);
  }

  console.log(`\nDone! ${categoriesData.length} categories seeded.`);
  process.exit();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
