const Category = require('../models/Category.model');
const FoodItem = require('../models/FoodItem.model');
const { emitToAll } = require('../services/socket.service');

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

const getItems = async (req, res, next) => {
  try {
    const { category, search, isVeg, availability } = req.query;
    let query = { isActive: true };

    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) query.category = cat._id;
      }
    }
    
    if (search) query.name = { $regex: search, $options: 'i' };
    if (isVeg !== undefined) query.isVeg = isVeg === 'true';
    if (availability) query.availability = availability;

    const items = await FoodItem.find(query).populate('category', 'name slug icon');
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

const getItemById = async (req, res, next) => {
  try {
    const item = await FoodItem.findOne({ _id: req.params.id, isActive: true }).populate('category', 'name slug icon');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};

const createItem = async (req, res, next) => {
  try {
    const item = new FoodItem(req.body);
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await FoodItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await FoodItem.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) { next(err); }
};

const updateItemAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    if (!['available', 'out_of_stock', 'temporarily_unavailable'].includes(availability)) {
      return res.status(400).json({ success: false, message: 'Invalid availability' });
    }
    
    const item = await FoodItem.findByIdAndUpdate(req.params.id, { availability }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    
    emitToAll('item:availability_changed', { itemId: item._id, availability, name: item.name });
    // Note: Emit heat change logic is mostly queue dependent, omitted for simple item availability change unless requested. Wait, requirement says "Also emit `queue:heat_changed` to all".
    const { getQueueHeat } = require('../services/queue.service');
    const heatData = await getQueueHeat();
    emitToAll('queue:heat_changed', heatData);

    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

module.exports = {
  getCategories, getItems, getItemById,
  createCategory, updateCategory, deleteCategory,
  createItem, updateItem, deleteItem, updateItemAvailability
};
