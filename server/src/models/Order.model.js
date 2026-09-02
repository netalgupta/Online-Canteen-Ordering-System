const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  specialInstructions: { type: String },
  preparationTime: { type: Number, required: true }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  pickupCode: { type: String, required: true, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['placed', 'received', 'accepted', 'preparing', 'ready', 'collected', 'rejected', 'cancelled', 'expired'],
    default: 'placed'
  },
  pickupSlot: {
    start: { type: Date },
    end: { type: Date }
  },
  orderType: {
    type: String,
    enum: ['takeaway', 'dine_in'],
    default: 'takeaway'
  },
  queuePosition: { type: Number },
  estimatedReadyTime: { type: Date },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  statusHistory: [statusHistorySchema],
  rejectionReason: { type: String },
  cancellationReason: { type: String },
  placedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  preparingAt: { type: Date },
  readyAt: { type: Date },
  collectedAt: { type: Date },
  expiredAt: { type: Date },
  idempotencyKey: { type: String, sparse: true, unique: true },
  qrCode: { type: String },
  specialInstructions: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
