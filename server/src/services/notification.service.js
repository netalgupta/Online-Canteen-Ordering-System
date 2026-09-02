const Notification = require('../models/Notification.model');
const { emitToStudent } = require('./socket.service');

const createNotification = async (userId, type, title, message, relatedOrderId = null) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedOrder: relatedOrderId
    });

    emitToStudent(userId, 'notification:new', notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

module.exports = {
  createNotification
};
