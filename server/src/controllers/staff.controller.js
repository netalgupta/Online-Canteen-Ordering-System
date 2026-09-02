const Order = require('../models/Order.model');
const FoodItem = require('../models/FoodItem.model');
const { calculateETA, recalculateAllQueuePositions, getQueueHeat: getHeat } = require('../services/queue.service');
const { createNotification } = require('../services/notification.service');
const { emitToStaff, emitToStudent, emitToAll } = require('../services/socket.service');

const getOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const orders = await Order.find(query).sort({ placedAt: 1 }).populate('items.foodItem').populate('student', 'name email');
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const order = await Order.findById(req.params.id).populate('items.foodItem').populate('student', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const validTransitions = {
      placed: ['received'],
      received: ['accepted', 'rejected'],
      accepted: ['preparing', 'rejected'],
      preparing: ['ready'],
      ready: ['collected']
    };

    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status transition from ${order.status} to ${status}` });
    }

    if (status === 'rejected') {
      if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });
      order.rejectionReason = reason;
    }

    order.status = status;
    order.statusHistory.push({ status, note: reason, updatedBy: req.user._id });

    if (status === 'accepted') order.acceptedAt = new Date();
    if (status === 'preparing') order.preparingAt = new Date();
    if (status === 'ready') order.readyAt = new Date();
    if (status === 'collected') order.collectedAt = new Date();

    await order.save();

    if (status === 'preparing') {
      const { estimatedReadyTime } = await calculateETA(order);
      order.estimatedReadyTime = estimatedReadyTime;
      await order.save();
    }

    if (['ready', 'collected', 'rejected'].includes(status)) {
      await recalculateAllQueuePositions();
    }

    // notifications
    const notifications = {
      accepted: { type: 'order_accepted', title: 'Order Accepted', msg: 'Your order has been accepted and will be prepared soon!' },
      preparing: { type: 'order_preparing', title: 'Order Preparing', msg: `Your order is now being prepared.` },
      ready: { type: 'order_ready', title: 'Order Ready', msg: `🔔 Your order #${order.orderNumber} is ready for pickup! Show your QR code.` },
      rejected: { type: 'order_rejected', title: 'Order Rejected', msg: `Your order was rejected. Reason: ${reason}` }
    };

    if (notifications[status]) {
      const n = notifications[status];
      await createNotification(order.student._id, n.type, n.title, n.msg, order._id);
    }

    emitToStudent(order.student._id, 'order:status_changed', order);
    emitToStaff('order:status_changed', order);
    
    if (['ready', 'collected', 'rejected'].includes(status)) {
      emitToAll('order:queue_updated', {});
    }

    const heatData = await getHeat();
    emitToAll('queue:heat_changed', heatData);

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

const verifyPickup = async (req, res, next) => {
  try {
    const { pickupCode } = req.body;
    if (!pickupCode) return res.status(400).json({ success: false, message: 'pickupCode required' });
    
    const order = await Order.findOne({ pickupCode: pickupCode.toUpperCase() }).populate('student', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Invalid pickup code' });
    if (order.status !== 'ready') return res.status(400).json({ success: false, message: 'Order is not ready for pickup', status: order.status });
    
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

const collectOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('student', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'ready') return res.status(400).json({ success: false, message: 'Order is not ready' });
    if (order.status === 'collected') return res.status(400).json({ success: false, message: 'Order already collected' });
    
    order.status = 'collected';
    order.collectedAt = new Date();
    order.statusHistory.push({ status: 'collected', updatedBy: req.user._id });
    await order.save();
    
    await recalculateAllQueuePositions();
    
    emitToStudent(order.student._id, 'order:status_changed', order);
    emitToStaff('order:status_changed', order);
    emitToAll('order:queue_updated', {});
    
    const heatData = await getHeat();
    emitToAll('queue:heat_changed', heatData);
    
    res.json({ success: true, message: 'Order collected' });
  } catch (err) { next(err); }
};

const getInventory = async (req, res, next) => {
  try {
    const items = await FoodItem.find().sort({ name: 1 }).populate('category', 'name');
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

const getQueueHeat = async (req, res, next) => {
  try {
    const heatData = await getHeat();
    res.json({ success: true, data: heatData });
  } catch (err) { next(err); }
};

module.exports = {
  getOrders, updateOrderStatus, verifyPickup, collectOrder, getInventory, getQueueHeat
};
