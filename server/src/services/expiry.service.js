const cron = require('node-cron');
const Order = require('../models/Order.model');
const SystemSettings = require('../models/SystemSettings.model');
const { createNotification } = require('./notification.service');
const { emitToStudent, emitToStaff } = require('./socket.service');

const startExpiryJob = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const settings = await SystemSettings.getSettings();
      const expiryMinutes = settings.pickupWindowMinutes;
      const expiryThreshold = new Date(Date.now() - expiryMinutes * 60 * 1000);

      const expiredOrders = await Order.find({
        status: 'ready',
        readyAt: { $lt: expiryThreshold }
      });

      for (const order of expiredOrders) {
        order.status = 'expired';
        order.expiredAt = new Date();
        order.statusHistory.push({
          status: 'expired',
          note: `Auto-expired after ${expiryMinutes} minutes of being ready`
        });
        await order.save();

        await createNotification(
          order.student,
          'pickup_expiring',
          'Order Expired',
          `Your order ${order.orderNumber} has expired because it was not picked up within the allowed time window.`,
          order._id
        );

        emitToStudent(order.student, 'order:status_changed', order);
        emitToStaff('order:status_changed', order);
      }
    } catch (error) {
      console.error('Error running expiry job:', error);
    }
  });
};

module.exports = { startExpiryJob };
