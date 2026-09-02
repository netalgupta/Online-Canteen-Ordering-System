const express = require('express');
const { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  cancelOrder, 
  getOrderQueue 
} = require('../controllers/order.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware, createOrder);
router.get('/my', authMiddleware, getMyOrders);
router.get('/:id', authMiddleware, getOrderById);
router.delete('/:id/cancel', authMiddleware, cancelOrder);
router.get('/:id/queue', authMiddleware, getOrderQueue);

module.exports = router;
