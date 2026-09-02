const Order = require('../models/Order.model');

const checkIdempotency = async (idempotencyKey) => {
  if (!idempotencyKey) return null;
  const existingOrder = await Order.findOne({ idempotencyKey });
  return existingOrder;
};

module.exports = { checkIdempotency };
