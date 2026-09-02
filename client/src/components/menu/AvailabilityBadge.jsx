import React from 'react';
import Badge from './Badge';

const AvailabilityBadge = ({ status }) => {
  return <Badge variant="availability" status={status} text={
    status === 'available' ? 'Available' : 
    status === 'out_of_stock' ? 'Out of Stock' : 'Temp. Unavailable'
  } />;
};

export default AvailabilityBadge;
