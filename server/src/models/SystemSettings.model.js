const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  kitchenCapacity: { type: Number, default: 5 },
  pickupWindowMinutes: { type: Number, default: 30 },
  peakHourStart: { type: String, default: '13:00' },
  peakHourEnd: { type: String, default: '14:00' },
  operatingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '21:00' }
  },
  slotDurationMinutes: { type: Number, default: 10 },
  slotCapacity: { type: Number, default: 15 },
  isKitchenOpen: { type: Boolean, default: true }
}, { timestamps: true });

systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
