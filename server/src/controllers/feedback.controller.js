const Feedback = require('../models/Feedback.model');
const Order = require('../models/Order.model');

const createFeedback = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;
    
    if (!orderId || !rating) return res.status(400).json({ success: false, message: 'OrderId and rating are required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    
    const order = await Order.findOne({ _id: orderId, student: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (order.status !== 'collected') return res.status(400).json({ success: false, message: 'Can only give feedback for collected orders' });
    
    const existing = await Feedback.findOne({ order: orderId });
    if (existing) return res.status(400).json({ success: false, message: 'Feedback already submitted for this order' });
    
    const feedback = new Feedback({
      student: req.user._id,
      order: orderId,
      rating,
      comment
    });
    
    await feedback.save();
    res.status(201).json({ success: true, data: feedback });
  } catch (err) { next(err); }
};

module.exports = { createFeedback };
