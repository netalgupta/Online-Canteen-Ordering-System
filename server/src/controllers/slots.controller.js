const SystemSettings = require('../models/SystemSettings.model');
const Order = require('../models/Order.model');

const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const settings = await SystemSettings.getSettings();
    if (!settings.isKitchenOpen) {
      return res.json({ success: true, data: [] });
    }
    
    const { open, close } = settings.operatingHours;
    const duration = settings.slotDurationMinutes;
    const capacity = settings.slotCapacity;
    
    const slots = [];
    const openTime = new Date(targetDate);
    const [openH, openM] = open.split(':').map(Number);
    openTime.setHours(openH, openM, 0, 0);
    
    const closeTime = new Date(targetDate);
    const [closeH, closeM] = close.split(':').map(Number);
    closeTime.setHours(closeH, closeM, 0, 0);
    
    const now = new Date();
    
    let currentSlot = new Date(openTime);
    while (currentSlot < closeTime) {
      const endSlot = new Date(currentSlot.getTime() + duration * 60000);
      if (endSlot > closeTime) break;
      
      // if slot is in the past today, skip
      if (endSlot > now) {
        slots.push({
          id: currentSlot.getTime().toString(),
          start: new Date(currentSlot),
          end: new Date(endSlot),
          label: `${String(currentSlot.getHours()).padStart(2, '0')}:${String(currentSlot.getMinutes()).padStart(2, '0')} - ${String(endSlot.getHours()).padStart(2, '0')}:${String(endSlot.getMinutes()).padStart(2, '0')}`,
          capacity,
          booked: 0,
          available: capacity
        });
      }
      currentSlot = endSlot;
    }
    
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);
    
    const orders = await Order.find({
      'pickupSlot.start': { $gte: targetDate, $lte: targetDateEnd },
      status: { $nin: ['cancelled', 'rejected'] }
    });
    
    orders.forEach(o => {
      if (!o.pickupSlot || !o.pickupSlot.start) return;
      const stTime = o.pickupSlot.start.getTime();
      const slot = slots.find(s => s.start.getTime() === stTime);
      if (slot) {
        slot.booked += 1;
        slot.available = slot.capacity - slot.booked;
      }
    });
    
    res.json({ success: true, data: slots });
  } catch (err) { next(err); }
};

module.exports = { getAvailableSlots };
