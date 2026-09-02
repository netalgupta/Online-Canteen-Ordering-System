const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  image: { type: String },
  isVeg: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 5 },
  availability: {
    type: String,
    enum: ['available', 'out_of_stock', 'temporarily_unavailable'],
    default: 'available'
  },
  isPopular: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('FoodItem', foodItemSchema);
