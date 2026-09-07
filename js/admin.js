/* ==========================================================================
   QueueLess — admin analytics logic
   ========================================================================== */

// Baseline mock analytics numbers (a real deployment would compute these
// server-side from the full order history; the prototype layers live data
// from localStorage on top of a realistic baseline).
const QL_ADMIN_BASELINE = {
  todaysOrders: 1248,
  revenue: 86420,
  avgWait: 11,
  peakHour: '1:00–1:30 PM',
  ordersByHour: [
    {h:'9 AM', v:6},{h:'10 AM', v:14},{h:'11 AM', v:22},{h:'12 PM', v:58},
    {h:'1 PM', v:96},{h:'2 PM', v:52},{h:'3 PM', v:24},{h:'4 PM', v:18}
  ],
  revenueByDay: [
    {d:'Mon', v:71200},{d:'Tue', v:68900},{d:'Wed', v:79500},{d:'Thu', v:74300},
    {d:'Fri', v:86420},{d:'Sat', v:41200},
  ],
  popular: [
    {name:'Veg Sandwich', orders:312},
    {name:'Samosa', orders:284},
    {name:'Cold Coffee', orders:261},
    {name:'Veg Maggi', orders:229},
    {name:'Masala Dosa', orders:198}
  ]
};

function qlAdminStats(){
  const orders = qlGetOrders();
  return {
    todaysOrders: QL_ADMIN_BASELINE.todaysOrders + orders.length,
    revenue: QL_ADMIN_BASELINE.revenue + orders.reduce((s,o)=>s+o.subtotal,0),
    avgWait: QL_ADMIN_BASELINE.avgWait,
    peakHour: QL_ADMIN_BASELINE.peakHour,
    cancelled: orders.filter(o=>o.status==='cancelled').length
  };
}
