const express = require('express');
const { 
  getOrders, 
  updateOrderStatus, 
  verifyPickup, 
  collectOrder, 
  getInventory, 
  getQueueHeat
} = require('../controllers/staff.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware, requireRole(['staff', 'admin']));

router.get('/orders', getOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/pickup/verify', verifyPickup);
router.patch('/pickup/:orderId/collect', collectOrder);
router.get('/inventory', getInventory);
router.get('/queue/heat', getQueueHeat);

module.exports = router;
