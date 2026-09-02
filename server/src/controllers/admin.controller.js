const Order = require('../models/Order.model');
const User = require('../models/User.model');
const SystemSettings = require('../models/SystemSettings.model');
const Feedback = require('../models/Feedback.model');

const getAnalyticsOverview = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23,59,59,999);

    const todayOrders = await Order.countDocuments({ placedAt: { $gte: today, $lte: todayEnd } });
    
    const completedToday = await Order.find({ status: 'collected', collectedAt: { $gte: today, $lte: todayEnd } });
    const todayRevenue = completedToday.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = completedToday.length > 0 ? todayRevenue / completedToday.length : 0;
    
    const pendingOrders = await Order.countDocuments({ status: { $in: ['received', 'accepted'] } });
    const preparingOrders = await Order.countDocuments({ status: 'preparing' });
    const completedOrders = completedToday.length;
    const cancelledOrders = await Order.countDocuments({ status: { $in: ['cancelled', 'rejected'] }, placedAt: { $gte: today, $lte: todayEnd } });

    res.json({
      success: true,
      data: { todayOrders, todayRevenue, avgOrderValue, pendingOrders, preparingOrders, completedOrders, cancelledOrders }
    });
  } catch (err) { next(err); }
};

const getAnalyticsHourly = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23,59,59,999);

    const orders = await Order.find({ placedAt: { $gte: today, $lte: todayEnd } });
    
    const hourCounts = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;
    
    orders.forEach(o => {
      const h = new Date(o.placedAt).getHours();
      hourCounts[h]++;
    });

    const data = Object.keys(hourCounts).map(h => ({ hour: parseInt(h), count: hourCounts[h] }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getAnalyticsPopularItems = async (req, res, next) => {
  try {
    const orders = await Order.find();
    const itemStats = {};
    
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!itemStats[item.name]) {
          itemStats[item.name] = { name: item.name, totalQuantity: 0, totalRevenue: 0 };
        }
        itemStats[item.name].totalQuantity += item.quantity;
        itemStats[item.name].totalRevenue += item.quantity * item.price;
      });
    });

    const data = Object.values(itemStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
      
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getAnalyticsPerformance = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23,59,59,999);

    const acceptedOrders = await Order.find({ acceptedAt: { $gte: today, $lte: todayEnd } });
    const readyOrders = await Order.find({ readyAt: { $gte: today, $lte: todayEnd } });
    const collectedOrders = await Order.find({ collectedAt: { $gte: today, $lte: todayEnd } });
    
    const avgWaitTime = acceptedOrders.length > 0 
      ? acceptedOrders.reduce((sum, o) => sum + (o.acceptedAt - o.placedAt), 0) / acceptedOrders.length / 60000 
      : 0;
      
    const avgPrepTime = readyOrders.length > 0
      ? readyOrders.reduce((sum, o) => sum + (o.readyAt - o.preparingAt), 0) / readyOrders.length / 60000
      : 0;
      
    const avgTotalTime = collectedOrders.length > 0
      ? collectedOrders.reduce((sum, o) => sum + (o.collectedAt - o.placedAt), 0) / collectedOrders.length / 60000
      : 0;

    const allOrders = await Order.find({ placedAt: { $gte: today, $lte: todayEnd } });
    const hourCounts = {};
    allOrders.forEach(o => {
      const h = new Date(o.placedAt).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    let maxHour = -1;
    let maxCount = 0;
    for (const h in hourCounts) {
      if (hourCounts[h] > maxCount) {
        maxCount = hourCounts[h];
        maxHour = parseInt(h);
      }
    }
    const peakHour = maxHour >= 0 ? `${maxHour > 12 ? maxHour - 12 : maxHour} ${maxHour >= 12 ? 'PM' : 'AM'}` : 'N/A';

    res.json({ success: true, data: { avgWaitTime, avgPrepTime, avgTotalTime, peakHour } });
  } catch (err) { next(err); }
};

const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const query = role ? { role } : {};
    
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await User.countDocuments(query);
    
    res.json({ success: true, data: users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const update = {};
    if (role) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.getSettings();
    settings = await SystemSettings.findByIdAndUpdate(settings._id, req.body, { new: true });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

const getFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find().populate('student', 'name').populate('order', 'orderNumber');
    res.json({ success: true, data: feedback });
  } catch (err) { next(err); }
};

module.exports = {
  getAnalyticsOverview, getAnalyticsHourly, getAnalyticsPopularItems, getAnalyticsPerformance,
  getUsers, updateUser, getSettings, updateSettings, getFeedback
};
