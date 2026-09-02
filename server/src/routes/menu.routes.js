const express = require('express');
const { 
  getCategories, 
  getItems, 
  getItemById,
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
  updateItemAvailability
} = require('../controllers/menu.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/items', getItems);
router.get('/items/:id', getItemById);

router.post('/categories', authMiddleware, requireRole(['admin']), createCategory);
router.put('/categories/:id', authMiddleware, requireRole(['admin']), updateCategory);
router.delete('/categories/:id', authMiddleware, requireRole(['admin']), deleteCategory);

router.post('/items', authMiddleware, requireRole(['admin']), createItem);
router.put('/items/:id', authMiddleware, requireRole(['admin']), updateItem);
router.delete('/items/:id', authMiddleware, requireRole(['admin']), deleteItem);

router.patch('/items/:id/availability', authMiddleware, requireRole(['admin', 'staff']), updateItemAvailability);

module.exports = router;
