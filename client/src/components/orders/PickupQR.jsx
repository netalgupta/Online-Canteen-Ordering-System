import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const PickupQR = ({ orderNumber, pickupCode, isReady }) => {
  const qrValue = JSON.stringify({ orderNumber, pickupCode });

  return (
    <div className={`flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border-2 transition-colors ${isReady ? 'border-green-500' : 'border-gray-100'}`}>
      {isReady && (
        <div className="w-full bg-green-100 text-green-800 text-center py-2 px-4 rounded-t-lg font-bold text-sm mb-6 -mt-6">
          🎉 Ready for Pickup!
        </div>
      )}
      
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-inner">
        <QRCodeSVG 
          value={qrValue}
          size={160}
          level="H"
          includeMargin={false}
          fgColor={isReady ? "#166534" : "#111827"} 
        />
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Pickup Code</p>
        <p className="text-4xl font-mono font-bold tracking-widest text-gray-900">{pickupCode}</p>
      </div>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Show this to the counter staff to collect your order
      </p>
    </div>
  );
};

export default PickupQR;
