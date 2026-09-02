const Order = require('../models/Order.model');
const FoodItem = require('../models/FoodItem.model');
const SystemSettings = require('../models/SystemSettings.model');
const { generateOrderQR } = require('../utils/qrcode.util');
const { checkIdempotency } = require('../utils/idempotency.util');
const { calculateQueuePosition, calculateETA, getQueueHeat, recalculateAllQueuePositions } = require('../services/queue.service');
const { createNotification } = require('../services/notification.service');
const { emitToStaff, emitToStudent, emitToAll } = require('../services/socket.service');

const customAlphabet = (alphabet, size) => {
  let res = '';
  while (size--) res += alphabet[(Math.random() * alphabet.length) | 0];
  return res;
};

const createOrder = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can place orders' });

    const settings = await SystemSettings.getSettings();
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    if (!settings.isKitchenOpen || currentTime < settings.operatingHours.open || currentTime > settings.operatingHours.close) {
      return res.status(400).json({ success: false, message: 'Canteen is currently closed' });
    }

    const { items, pickupSlotId, orderType, idempotencyKey, specialInstructions } = req.body;

    if (idempotencyKey) {
      const existing = await checkIdempotency(idempotencyKey);
      if (existing) return res.json({ success: true, data: existing });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const reqItem of items) {
      const foodItem = await FoodItem.findById(reqItem.foodItemId);
      if (!foodItem || !foodItem.isActive) return res.status(400).json({ success: false, message: `Item not found` });
      if (foodItem.availability !== 'available') return res.status(400).json({ success: false, message: `${foodItem.name} is currently ${foodItem.availability}` });

      orderItems.push({
        foodItem: foodItem._id,
        name: foodItem.name,
        price: foodItem.price,
        quantity: reqItem.quantity,
        specialInstructions: reqItem.specialInstructions,
        preparationTime: foodItem.preparationTime
      });
      subtotal += foodItem.price * reqItem.quantity;
    }

    const total = subtotal;

    // Use a counter or simple random + count padded for orderNumber
    const count = await Order.countDocuments();
    const orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
    const pickupCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);
    
    const qrCode = await generateOrderQR(orderNumber, pickupCode);

    const newOrder = new Order({
      orderNumber,
      pickupCode,
      student: req.user._id,
      items: orderItems,
      status: 'placed',
      orderType: orderType || 'takeaway',
      subtotal,
      total,
      idempotencyKey,
      qrCode,
      specialInstructions,
      statusHistory: [{ status: 'placed' }]
    });

    await newOrder.save();

    // immediately received
    newOrder.status = 'received';
    newOrder.statusHistory.push({ status: 'received' });
    
    const queuePosition = await calculateQueuePosition(newOrder);
    const { estimatedReadyTime } = await calculateETA(newOrder);
    
    newOrder.queuePosition = queuePosition;
    newOrder.estimatedReadyTime = estimatedReadyTime;
    await newOrder.save();

    await createNotification(
      req.user._id,
      'order_received',
      'Order Received!',
      `Your order ${orderNumber} has been received. Queue position: ${queuePosition}`,
      newOrder._id
    );

    const populatedOrder = await Order.findById(newOrder._id).populate('items.foodItem').populate('student', 'name email');

    emitToStaff('order:new', populatedOrder);
    emitToStudent(req.user._id, 'order:status_changed', populatedOrder);
    
    const heatData = await getQueueHeat();
    emitToAll('queue:heat_changed', heatData);

    res.status(201).json({ success: true, data: populatedOrder });
  } catch (err) { next(err); }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ student: req.user._id }).sort({ placedAt: -1 }).populate('items.foodItem');
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.foodItem').populate('student', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (req.user.role === 'student' && String(order.student._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (String(order.student) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    if (!['received', 'accepted'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order that is already being prepared' });
    }
    
    order.status = 'cancelled';
    order.cancellationReason = req.body.reason || 'Cancelled by student';
    order.statusHistory.push({ status: 'cancelled', note: order.cancellationReason, updatedBy: req.user._id });
    await order.save();
    
    await recalculateAllQueuePositions();
    
    await createNotification(
      req.user._id,
      'order_cancelled',
      'Order Cancelled',
      `Your order ${order.orderNumber} has been cancelled.`,
      order._id
    );
    
    emitToStudent(req.user._id, 'order:status_changed', order);
    emitToStaff('order:status_changed', order);
    emitToAll('order:queue_updated', {}); // Simplified
    
    const heatData = await getQueueHeat();
    emitToAll('queue:heat_changed', heatData);
    
    res.json({ success: true, message: 'Order cancelled', data: order });
  } catch (err) { next(err); }
};

const getOrderQueue = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const { estimatedWaitMinutes } = await calculateETA(order);
    const heatData = await getQueueHeat();
    
    res.json({
      success: true,
      data: {
        queuePosition: order.queuePosition,
        estimatedReadyTime: order.estimatedReadyTime,
        estimatedWaitMinutes,
        heat: heatData.heat
      }
    });
  } catch (err) { next(err); }
};

module.exports = {
  createOrder, getMyOrders, getOrderById, cancelOrder, getOrderQueue
};
