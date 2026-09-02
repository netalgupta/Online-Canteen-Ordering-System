const Order = require('../models/Order.model');
const SystemSettings = require('../models/SystemSettings.model');
const { emitToAll } = require('./socket.service');

// Calculate prep time for an order's items
const calculateOrderPrepTime = (items) => {
  if (!items || items.length === 0) return 5;
  const times = items.map(item => {
    const prepTime = item.preparationTime || (item.foodItem && item.foodItem.preparationTime) || 5;
    return prepTime * Math.min(item.quantity, 3);
  });
  const maxTime = Math.max(...times);
  const extraTime = times.filter(t => t < maxTime).reduce((sum, t) => sum + t * 0.2, 0);
  return Math.ceil(maxTime + extraTime);
};

// Calculate ETA for an order
const calculateETA = async (order) => {
  const settings = await SystemSettings.getSettings();
  const { kitchenCapacity, peakHourStart, peakHourEnd } = settings;
  
  const ordersAhead = await Order.find({
    status: { $in: ['received', 'accepted', 'preparing'] },
    placedAt: { $lt: order.placedAt },
    _id: { $ne: order._id }
  }).populate('items.foodItem');
  
  const myPrepTime = calculateOrderPrepTime(order.items);
  
  const position = ordersAhead.length;
  
  const batchGroups = [];
  for (let i = 0; i < ordersAhead.length; i += kitchenCapacity) {
    const batch = ordersAhead.slice(i, i + kitchenCapacity);
    const batchMaxTime = Math.max(...batch.map(o => calculateOrderPrepTime(o.items)));
    batchGroups.push(batchMaxTime);
  }
  const timeFromQueue = batchGroups.reduce((a, b) => a + b, 0);
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
  const isPeakHour = currentTimeStr >= peakHourStart && currentTimeStr <= peakHourEnd;
  const multiplier = isPeakHour ? 1.4 : 1.0;
  
  const totalMinutes = Math.max(3, Math.ceil((timeFromQueue + myPrepTime) * multiplier));
  
  const eta = new Date(Date.now() + totalMinutes * 60 * 1000);
  return { estimatedReadyTime: eta, estimatedWaitMinutes: totalMinutes };
};

// Calculate queue position for a new order
const calculateQueuePosition = async (newOrder) => {
  const count = await Order.countDocuments({
    status: { $in: ['received', 'accepted', 'preparing'] },
    placedAt: { $lt: newOrder.placedAt },
    _id: { $ne: newOrder._id }
  });
  return count + 1;
};

// Get heat indicator
const getQueueHeat = async () => {
  const settings = await SystemSettings.getSettings();
  const activeCount = await Order.countDocuments({
    status: { $in: ['received', 'accepted', 'preparing'] }
  });
  const ratio = activeCount / (settings.kitchenCapacity * 2);
  let heat, label, color;
  if (ratio < 0.4) {
    heat = 'low'; label = 'Low'; color = 'green';
  } else if (ratio < 0.8) {
    heat = 'moderate'; label = 'Moderate'; color = 'yellow';
  } else {
    heat = 'high'; label = 'High'; color = 'red';
  }
  return { heat, label, color, activeCount, ratio };
};

// Recalculate queue positions for all active orders
const recalculateAllQueuePositions = async () => {
  const activeOrders = await Order.find({
    status: { $in: ['placed', 'received', 'accepted', 'preparing'] }
  }).sort({ placedAt: 1 });
  
  for (let i = 0; i < activeOrders.length; i++) {
    const order = activeOrders[i];
    const position = i + 1;
    const { estimatedReadyTime, estimatedWaitMinutes } = await calculateETA(order);
    await Order.findByIdAndUpdate(order._id, {
      queuePosition: position,
      estimatedReadyTime
    });
  }
  
  // Optionally, we could broadcast a heat change event here
  const heatData = await getQueueHeat();
  emitToAll('queue:heat_changed', heatData);
  
  return activeOrders.length;
};

module.exports = {
  calculateOrderPrepTime,
  calculateETA,
  calculateQueuePosition,
  getQueueHeat,
  recalculateAllQueuePositions
};
