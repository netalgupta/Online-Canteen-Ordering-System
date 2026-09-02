const QRCode = require('qrcode');

const generateOrderQR = async (orderNumber, pickupCode) => {
  try {
    const data = JSON.stringify({ orderNumber, pickupCode });
    const qrCodeDataUrl = await QRCode.toDataURL(data);
    return qrCodeDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    return null;
  }
};

module.exports = { generateOrderQR };
