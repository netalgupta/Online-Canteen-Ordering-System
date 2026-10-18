/* ==========================================================================
   QueueLess — Siddhi Services Canteen menu data
   Source: Siddhi Services Canteen printed rate card.
   Prep times are placeholder estimates supplied for the prototype.
   One representative Unsplash stock image is shared by each category.
   ========================================================================== */

const QL_CAPACITY = 15;
const QL_PICKUP_SLOT_CAPACITY = 10;
const QL_MENU_VERSION = 'siddhi-services-v6-four-counters';

const QL_CATEGORY_IMAGES = 
{
  'Hot Items': 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600&q=80',
  'Snacks': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  'Fast Items': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80',
  'Dosa Items': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80',
  'Special Uttappa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80',
  'Sandwiches Item': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
  'Grilled Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
  'Chaat Items': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  'Noodles': 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&q=80',
  'Special Rice': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  'Gravy Items': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
  'Choupsey': 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&q=80',
  'Rice Items': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  'Soup': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  'Lunch Items': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  'Juices': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80',
  'Frankie Counter': 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=600&q=80',
  'Desserts': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&q=80',
  'Packaged Snacks': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&q=80',
};

function qlGetItemImage(item){ return QL_CATEGORY_IMAGES[item.category] || QL_CATEGORY_IMAGES['Snacks']; }


/* Pickup counters: every item is routed to the physical counter that serves it. */
const QL_COUNTERS = {
  C1: { id:'C1', name:'Packaged Snacks & Ice Cream', short:'Snacks & Ice Cream', categories:['Packaged Snacks','Desserts'] },
  C2: { id:'C2', name:'Frankie & Juice', short:'Frankie & Juice', categories:['Frankie Counter','Juices'] },
  C3: { id:'C3', name:'Chaat Counter', short:'Chaat · Sev Puri & Pani Puri', categories:['Chaat Items'] },
  C4: { id:'C4', name:'Main Canteen · Meals & Everything Else', short:'Main Canteen', categories:[] }
};
function qlGetItemCounter(item){
  const cat = item?.category || '';
  if(QL_COUNTERS.C1.categories.includes(cat)) return QL_COUNTERS.C1;
  if(QL_COUNTERS.C2.categories.includes(cat)) return QL_COUNTERS.C2;
  return QL_COUNTERS.C4;
}
function qlGetCounter(id){ return QL_COUNTERS[id] || QL_COUNTERS.C4; }

const QL_MENU_SEED = [
  { id:'m1', name:'Tea', category:'Hot Items', price:16, prepTimeMinutes:3, veg:true, available:true, popular:true, desc:'Tea from Siddhi Services Canteen.' },
  { id:'m2', name:'Coffee', category:'Hot Items', price:20, prepTimeMinutes:3, veg:true, available:true, popular:false, desc:'Coffee from Siddhi Services Canteen.' },
  { id:'m3', name:'Hot Milk', category:'Hot Items', price:28, prepTimeMinutes:3, veg:true, available:true, popular:false, desc:'Hot Milk from Siddhi Services Canteen.' },
  { id:'m4', name:'Tea (Half)', category:'Hot Items', price:10, prepTimeMinutes:3, veg:true, available:true, popular:false, desc:'Tea (Half) from Siddhi Services Canteen.' },
  { id:'m5', name:'Tea (Staff)', category:'Hot Items', price:9, prepTimeMinutes:3, veg:true, available:true, popular:false, desc:'Tea (Staff) from Siddhi Services Canteen.' },
  { id:'m6', name:'Samosa Pav', category:'Snacks', price:22, prepTimeMinutes:6, veg:true, available:true, popular:true, desc:'Samosa Pav from Siddhi Services Canteen.' },
  { id:'m7', name:'Vada Pav', category:'Snacks', price:22, prepTimeMinutes:6, veg:true, available:true, popular:true, desc:'Vada Pav from Siddhi Services Canteen.' },
  { id:'m8', name:'Samosa Plate', category:'Snacks', price:42, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Samosa Plate from Siddhi Services Canteen.' },
  { id:'m9', name:'Pav', category:'Snacks', price:6, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Pav from Siddhi Services Canteen.' },
  { id:'m10', name:'Butter Pav', category:'Snacks', price:13, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Butter Pav from Siddhi Services Canteen.' },
  { id:'m11', name:'Batata Wada', category:'Snacks', price:38, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Batata Wada from Siddhi Services Canteen.' },
  { id:'m12', name:'Samosa Usal', category:'Snacks', price:59, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Samosa Usal from Siddhi Services Canteen.' },
  { id:'m13', name:'Vada Usal', category:'Snacks', price:53, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Vada Usal from Siddhi Services Canteen.' },
  { id:'m14', name:'Vada Usal (Single)', category:'Snacks', price:32, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Vada Usal (Single) from Siddhi Services Canteen.' },
  { id:'m15', name:'Samosa Usal (Single)', category:'Snacks', price:32, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Samosa Usal (Single) from Siddhi Services Canteen.' },
  { id:'m16', name:'Vada Samosa Usal', category:'Snacks', price:59, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Vada Samosa Usal from Siddhi Services Canteen.' },
  { id:'m17', name:'Dahi Somasa', category:'Snacks', price:53, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Dahi Somasa from Siddhi Services Canteen.' },
  { id:'m18', name:'Usal Pav', category:'Snacks', price:40, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Usal Pav from Siddhi Services Canteen.' },
  { id:'m19', name:'Misal Pav', category:'Snacks', price:55, prepTimeMinutes:6, veg:true, available:true, popular:true, desc:'Misal Pav from Siddhi Services Canteen.' },
  { id:'m20', name:'Bread Pakoda', category:'Snacks', price:44, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Bread Pakoda from Siddhi Services Canteen.' },
  { id:'m21', name:'Idli Sambar', category:'Snacks', price:44, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Idli Sambar from Siddhi Services Canteen.' },
  { id:'m22', name:'Medu Vada Sambar', category:'Snacks', price:53, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Medu Vada Sambar from Siddhi Services Canteen.' },
  { id:'m23', name:'Idli Wada', category:'Snacks', price:53, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Idli Wada from Siddhi Services Canteen.' },
  { id:'m24', name:'Dahi Idli', category:'Snacks', price:58, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Dahi Idli from Siddhi Services Canteen.' },
  { id:'m25', name:'Butter Idli', category:'Snacks', price:58, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Butter Idli from Siddhi Services Canteen.' },
  { id:'m26', name:'Idli Fry', category:'Snacks', price:55, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Idli Fry from Siddhi Services Canteen.' },
  { id:'m27', name:'Dahi Misal Pav', category:'Snacks', price:74, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Dahi Misal Pav from Siddhi Services Canteen.' },
  { id:'m28', name:'Upma / Poha', category:'Snacks', price:37, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Upma / Poha from Siddhi Services Canteen.' },
  { id:'m29', name:'Potato Chips with Lassi', category:'Fast Items', price:58, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Potato Chips with Lassi from Siddhi Services Canteen.' },
  { id:'m30', name:'Potato Toast with Lassi', category:'Fast Items', price:58, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Potato Toast with Lassi from Siddhi Services Canteen.' },
  { id:'m31', name:'Sabudana Vada / Khichdi', category:'Fast Items', price:58, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Sabudana Vada / Khichdi from Siddhi Services Canteen.' },
  { id:'m32', name:'Alu Jira', category:'Fast Items', price:58, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Alu Jira from Siddhi Services Canteen.' },
  { id:'m33', name:'Sada Dosa', category:'Dosa Items', price:47, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Sada Dosa from Siddhi Services Canteen.' },
  { id:'m34', name:'Butter Sada Dosa', category:'Dosa Items', price:68, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Butter Sada Dosa from Siddhi Services Canteen.' },
  { id:'m35', name:'Cheese Sada Dosa', category:'Dosa Items', price:84, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Cheese Sada Dosa from Siddhi Services Canteen.' },
  { id:'m36', name:'Masala Dosa', category:'Dosa Items', price:68, prepTimeMinutes:10, veg:true, available:true, popular:true, desc:'Masala Dosa from Siddhi Services Canteen.' },
  { id:'m37', name:'Cheese Masala Dosa', category:'Dosa Items', price:65, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Cheese Masala Dosa from Siddhi Services Canteen.' },
  { id:'m38', name:'Mysore Sada Dosa', category:'Dosa Items', price:89, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Mysore Sada Dosa from Siddhi Services Canteen.' },
  { id:'m39', name:'Mysore Masala Dosa', category:'Dosa Items', price:84, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Mysore Masala Dosa from Siddhi Services Canteen.' },
  { id:'m40', name:'Cheese Mysore Sada', category:'Dosa Items', price:89, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Cheese Mysore Sada from Siddhi Services Canteen.' },
  { id:'m41', name:'Cheese Mysore Masala', category:'Dosa Items', price:105, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Cheese Mysore Masala from Siddhi Services Canteen.' },
  { id:'m42', name:'Chinese Sada Dosa', category:'Dosa Items', price:58, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Chinese Sada Dosa from Siddhi Services Canteen.' },
  { id:'m43', name:'Chinese Dosa (Noodles)', category:'Dosa Items', price:89, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Chinese Dosa (Noodles) from Siddhi Services Canteen.' },
  { id:'m44', name:'Cheese Chinese Dosa', category:'Dosa Items', price:116, prepTimeMinutes:10, veg:true, available:true, popular:false, desc:'Cheese Chinese Dosa from Siddhi Services Canteen.' },
  { id:'m45', name:'Sada Uttappa', category:'Special Uttappa', price:58, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Sada Uttappa from Siddhi Services Canteen.' },
  { id:'m46', name:'Butter Sada Uttappa', category:'Special Uttappa', price:74, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Butter Sada Uttappa from Siddhi Services Canteen.' },
  { id:'m47', name:'Cheese Uttappa', category:'Special Uttappa', price:95, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Cheese Uttappa from Siddhi Services Canteen.' },
  { id:'m48', name:'Onion Uttappa', category:'Special Uttappa', price:63, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Onion Uttappa from Siddhi Services Canteen.' },
  { id:'m49', name:'Cheese Onion Uttappa', category:'Special Uttappa', price:95, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Cheese Onion Uttappa from Siddhi Services Canteen.' },
  { id:'m50', name:'Masala Uttappa', category:'Special Uttappa', price:63, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Masala Uttappa from Siddhi Services Canteen.' },
  { id:'m51', name:'Cheese Masala Uttappa', category:'Special Uttappa', price:100, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Cheese Masala Uttappa from Siddhi Services Canteen.' },
  { id:'m52', name:'Tomato Uttappa', category:'Special Uttappa', price:63, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Tomato Uttappa from Siddhi Services Canteen.' },
  { id:'m53', name:'Cheese Tomato Uttappa', category:'Special Uttappa', price:95, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Cheese Tomato Uttappa from Siddhi Services Canteen.' },
  { id:'m54', name:'Four Test Uttappa', category:'Special Uttappa', price:79, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Four Test Uttappa from Siddhi Services Canteen.' },
  { id:'m55', name:'Tomato Omelette', category:'Special Uttappa', price:68, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Tomato Omelette from Siddhi Services Canteen.' },
  { id:'m56', name:'Bread Butter', category:'Sandwiches Item', price:37, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Bread Butter from Siddhi Services Canteen.' },
  { id:'m57', name:'Toast Bread Butter', category:'Sandwiches Item', price:46, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Toast Bread Butter from Siddhi Services Canteen.' },
  { id:'m58', name:'Veg Sandwich', category:'Sandwiches Item', price:42, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Veg Sandwich from Siddhi Services Canteen.' },
  { id:'m59', name:'Veg Cheese Sandwich', category:'Sandwiches Item', price:95, prepTimeMinutes:7, veg:true, available:true, popular:true, desc:'Veg Cheese Sandwich from Siddhi Services Canteen.' },
  { id:'m60', name:'Veg Cheese Toast Sandwich', category:'Sandwiches Item', price:105, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Veg Cheese Toast Sandwich from Siddhi Services Canteen.' },
  { id:'m61', name:'Cheese Sandwich (Only)', category:'Sandwiches Item', price:84, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Cheese Sandwich (Only) from Siddhi Services Canteen.' },
  { id:'m62', name:'Tomato Sandwich', category:'Sandwiches Item', price:42, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Tomato Sandwich from Siddhi Services Canteen.' },
  { id:'m63', name:'Cheese Club Sandwich', category:'Sandwiches Item', price:116, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Cheese Club Sandwich from Siddhi Services Canteen.' },
  { id:'m64', name:'Veg Toast Sandwich', category:'Sandwiches Item', price:68, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Veg Toast Sandwich from Siddhi Services Canteen.' },
  { id:'m65', name:'Only Cheese Toast Sandwich', category:'Sandwiches Item', price:105, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Only Cheese Toast Sandwich from Siddhi Services Canteen.' },
  { id:'m66', name:'Chinese Toast Sandwich', category:'Sandwiches Item', price:76, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Chinese Toast Sandwich from Siddhi Services Canteen.' },
  { id:'m67', name:'Club Sandwich', category:'Sandwiches Item', price:86, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Club Sandwich from Siddhi Services Canteen.' },
  { id:'m68', name:'Cheese Chinese Toast Sandwich', category:'Sandwiches Item', price:116, prepTimeMinutes:7, veg:true, available:true, popular:false, desc:'Cheese Chinese Toast Sandwich from Siddhi Services Canteen.' },
  { id:'m69', name:'Grilled Sandwich', category:'Grilled Sandwich', price:89, prepTimeMinutes:8, veg:true, available:true, popular:false, desc:'Grilled Sandwich from Siddhi Services Canteen.' },
  { id:'m70', name:'Veg Cheese Grilled Sandwich', category:'Grilled Sandwich', price:116, prepTimeMinutes:8, veg:true, available:true, popular:false, desc:'Veg Cheese Grilled Sandwich from Siddhi Services Canteen.' },
  { id:'m71', name:'Chinese Grill Sandwich', category:'Grilled Sandwich', price:89, prepTimeMinutes:8, veg:true, available:true, popular:false, desc:'Chinese Grill Sandwich from Siddhi Services Canteen.' },
  { id:'m72', name:'Veg Chinese Cheese Grilled Sandwich', category:'Grilled Sandwich', price:116, prepTimeMinutes:8, veg:true, available:true, popular:false, desc:'Veg Chinese Cheese Grilled Sandwich from Siddhi Services Canteen.' },
  { id:'m73', name:'Bhel Puri', category:'Chaat Items', price:42, prepTimeMinutes:5, veg:true, available:true, popular:true, desc:'Bhel Puri from Siddhi Services Canteen.' },
  { id:'m74', name:'Sev Puri', category:'Chaat Items', price:42, prepTimeMinutes:5, veg:true, available:true, popular:false, desc:'Sev Puri from Siddhi Services Canteen.' },
  { id:'m75', name:'Dahi Potato Puri', category:'Chaat Items', price:68, prepTimeMinutes:5, veg:true, available:true, popular:false, desc:'Dahi Potato Puri from Siddhi Services Canteen.' },
  { id:'m76', name:'Bombay Puri', category:'Chaat Items', price:74, prepTimeMinutes:5, veg:true, available:true, popular:false, desc:'Bombay Puri from Siddhi Services Canteen.' },
  { id:'m77', name:'Sukha Bhel', category:'Chaat Items', price:42, prepTimeMinutes:5, veg:true, available:true, popular:false, desc:'Sukha Bhel from Siddhi Services Canteen.' },
  { id:'m78', name:'Cheese Bhel', category:'Chaat Items', price:89, prepTimeMinutes:5, veg:true, available:true, popular:false, desc:'Cheese Bhel from Siddhi Services Canteen.' },
  { id:'m79', name:'Hakka Noodles', category:'Noodles', price:97, prepTimeMinutes:11, veg:true, available:true, popular:true, desc:'Hakka Noodles from Siddhi Services Canteen.' },
  { id:'m80', name:'Schezwan Noodles', category:'Noodles', price:105, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Schezwan Noodles from Siddhi Services Canteen.' },
  { id:'m81', name:'Singapore Noodles', category:'Noodles', price:105, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Singapore Noodles from Siddhi Services Canteen.' },
  { id:'m82', name:'Manchow Noodles', category:'Noodles', price:105, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Manchow Noodles from Siddhi Services Canteen.' },
  { id:'m83', name:'Manchurian Noodles', category:'Noodles', price:105, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Manchurian Noodles from Siddhi Services Canteen.' },
  { id:'m84', name:'Triple Schezwan Noodles', category:'Noodles', price:110, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Triple Schezwan Noodles from Siddhi Services Canteen.' },
  { id:'m85', name:'Chinese Bhel', category:'Noodles', price:89, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Chinese Bhel from Siddhi Services Canteen.' },
  { id:'m86', name:'Chinese Cheese Bhel', category:'Noodles', price:126, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Chinese Cheese Bhel from Siddhi Services Canteen.' },
  { id:'m87', name:'Tomato Rice (with Dahi)', category:'Special Rice', price:89, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Tomato Rice (with Dahi) from Siddhi Services Canteen.' },
  { id:'m88', name:'Lemon Rice', category:'Special Rice', price:74, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Lemon Rice from Siddhi Services Canteen.' },
  { id:'m89', name:'Paneer Chilly Rice', category:'Special Rice', price:131, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Paneer Chilly Rice from Siddhi Services Canteen.' },
  { id:'m90', name:'Veg Biryani Rice', category:'Special Rice', price:105, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Veg Biryani Rice from Siddhi Services Canteen.' },
  { id:'m91', name:'Paneer Biryani Rice', category:'Special Rice', price:131, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Paneer Biryani Rice from Siddhi Services Canteen.' },
  { id:'m92', name:'Veg Manchurian', category:'Gravy Items', price:74, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Veg Manchurian from Siddhi Services Canteen.' },
  { id:'m93', name:'Veg Chilly', category:'Gravy Items', price:74, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Veg Chilly from Siddhi Services Canteen.' },
  { id:'m94', name:'Veg Garlic', category:'Gravy Items', price:74, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Veg Garlic from Siddhi Services Canteen.' },
  { id:'m95', name:'Paneer Chilly', category:'Gravy Items', price:121, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Paneer Chilly from Siddhi Services Canteen.' },
  { id:'m96', name:'Idli Chilly', category:'Gravy Items', price:74, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Idli Chilly from Siddhi Services Canteen.' },
  { id:'m97', name:'Idli Manchurian', category:'Gravy Items', price:74, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Idli Manchurian from Siddhi Services Canteen.' },
  { id:'m98', name:'American Choupsey', category:'Choupsey', price:86, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'American Choupsey from Siddhi Services Canteen.' },
  { id:'m99', name:'Schezwan Choupsey', category:'Choupsey', price:86, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Schezwan Choupsey from Siddhi Services Canteen.' },
  { id:'m100', name:'Chinese Choupsey', category:'Choupsey', price:86, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Chinese Choupsey from Siddhi Services Canteen.' },
  { id:'m101', name:'Fried Rice', category:'Rice Items', price:100, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Fried Rice from Siddhi Services Canteen.' },
  { id:'m102', name:'Schezwan Rice', category:'Rice Items', price:105, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Schezwan Rice from Siddhi Services Canteen.' },
  { id:'m103', name:'Singapore Rice', category:'Rice Items', price:105, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Singapore Rice from Siddhi Services Canteen.' },
  { id:'m104', name:'Manchow Rice', category:'Rice Items', price:105, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Manchow Rice from Siddhi Services Canteen.' },
  { id:'m105', name:'Manchurian Rice', category:'Rice Items', price:110, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Manchurian Rice from Siddhi Services Canteen.' },
  { id:'m106', name:'Triple Schezwan Rice', category:'Rice Items', price:110, prepTimeMinutes:11, veg:true, available:true, popular:false, desc:'Triple Schezwan Rice from Siddhi Services Canteen.' },
  { id:'m107', name:'Manchow Soup', category:'Soup', price:79, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Manchow Soup from Siddhi Services Canteen.' },
  { id:'m108', name:'Tomato Soup', category:'Soup', price:79, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Tomato Soup from Siddhi Services Canteen.' },
  { id:'m109', name:'Veg Clear Soup', category:'Soup', price:79, prepTimeMinutes:6, veg:true, available:true, popular:false, desc:'Veg Clear Soup from Siddhi Services Canteen.' },
  { id:'m110', name:'Chappati Bhaji', category:'Lunch Items', price:68, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Chappati Bhaji from Siddhi Services Canteen.' },
  { id:'m111', name:'Chappati Paneer Bhaji', category:'Lunch Items', price:86, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Chappati Paneer Bhaji from Siddhi Services Canteen.' },
  { id:'m112', name:'Puri Sada Bhaji', category:'Lunch Items', price:68, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Puri Sada Bhaji from Siddhi Services Canteen.' },
  { id:'m113', name:'Puri Paneer Bhaji', category:'Lunch Items', price:89, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Puri Paneer Bhaji from Siddhi Services Canteen.' },
  { id:'m114', name:'Potato Bhaji', category:'Lunch Items', price:53, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Potato Bhaji from Siddhi Services Canteen.' },
  { id:'m115', name:'Paneer Bhaji (Full)', category:'Lunch Items', price:89, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Paneer Bhaji (Full) from Siddhi Services Canteen.' },
  { id:'m116', name:'Sada Bhaji (Full)', category:'Lunch Items', price:63, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Sada Bhaji (Full) from Siddhi Services Canteen.' },
  { id:'m117', name:'Paneer Bhaji (Half)', category:'Lunch Items', price:44, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Paneer Bhaji (Half) from Siddhi Services Canteen.' },
  { id:'m118', name:'Sada Bhaji (Half)', category:'Lunch Items', price:44, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Sada Bhaji (Half) from Siddhi Services Canteen.' },
  { id:'m119', name:'Veg Raita', category:'Lunch Items', price:37, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Veg Raita from Siddhi Services Canteen.' },
  { id:'m120', name:'Dahi (Curd)', category:'Lunch Items', price:32, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Dahi (Curd) from Siddhi Services Canteen.' },
  { id:'m121', name:'Puri Plate', category:'Lunch Items', price:26, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Puri Plate from Siddhi Services Canteen.' },
  { id:'m122', name:'Single Chappati', category:'Lunch Items', price:8, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Single Chappati from Siddhi Services Canteen.' },
  { id:'m123', name:'Dal Fry', category:'Lunch Items', price:42, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Dal Fry from Siddhi Services Canteen.' },
  { id:'m124', name:'Lunch', category:'Lunch Items', price:84, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Lunch from Siddhi Services Canteen.' },
  { id:'m125', name:'Lunch with Pulav', category:'Lunch Items', price:97, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Lunch with Pulav from Siddhi Services Canteen.' },
  { id:'m126', name:'Lunch with Jeera Rice', category:'Lunch Items', price:97, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Lunch with Jeera Rice from Siddhi Services Canteen.' },
  { id:'m127', name:'Dal Rice', category:'Lunch Items', price:53, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Dal Rice from Siddhi Services Canteen.' },
  { id:'m128', name:'Dal Fry Rice', category:'Lunch Items', price:79, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Dal Fry Rice from Siddhi Services Canteen.' },
  { id:'m129', name:'Dal Rice with Bhaji', category:'Lunch Items', price:76, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Dal Rice with Bhaji from Siddhi Services Canteen.' },
  { id:'m130', name:'Plain Dahi Rice', category:'Lunch Items', price:76, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Plain Dahi Rice from Siddhi Services Canteen.' },
  { id:'m131', name:'Dahi Masala Rice', category:'Lunch Items', price:89, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Dahi Masala Rice from Siddhi Services Canteen.' },
  { id:'m132', name:'Jeera Rice with Sambar', category:'Lunch Items', price:74, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Jeera Rice with Sambar from Siddhi Services Canteen.' },
  { id:'m133', name:'Jeera Rice with Sada Bhaji', category:'Lunch Items', price:84, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Jeera Rice with Sada Bhaji from Siddhi Services Canteen.' },
  { id:'m134', name:'Jeera Rice with Paneer Bhaji', category:'Lunch Items', price:100, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Jeera Rice with Paneer Bhaji from Siddhi Services Canteen.' },
  { id:'m135', name:'Pulav Rice with Sambar', category:'Lunch Items', price:86, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Pulav Rice with Sambar from Siddhi Services Canteen.' },
  { id:'m136', name:'Jeera Rice with Dal Fry', category:'Lunch Items', price:89, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Jeera Rice with Dal Fry from Siddhi Services Canteen.' },
  { id:'m137', name:'Pulav Rice with Sada Bhaji', category:'Lunch Items', price:91, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Pulav Rice with Sada Bhaji from Siddhi Services Canteen.' },
  { id:'m138', name:'Pulav Rice with Paneer Bhaji', category:'Lunch Items', price:100, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Pulav Rice with Paneer Bhaji from Siddhi Services Canteen.' },
  { id:'m139', name:'Pulav Rice with Dal Fry', category:'Lunch Items', price:86, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Pulav Rice with Dal Fry from Siddhi Services Canteen.' },
  { id:'m140', name:'Jeera Rice with Raita', category:'Lunch Items', price:100, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Jeera Rice with Raita from Siddhi Services Canteen.' },
  { id:'m141', name:'Masala Rice with Sambar', category:'Lunch Items', price:86, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Masala Rice with Sambar from Siddhi Services Canteen.' },
  { id:'m142', name:'Masala Rice with Raita', category:'Lunch Items', price:97, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Masala Rice with Raita from Siddhi Services Canteen.' },
  { id:'m143', name:'Masala Rice with Sada Bhaji', category:'Lunch Items', price:97, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Masala Rice with Sada Bhaji from Siddhi Services Canteen.' },
  { id:'m144', name:'Masala Rice with Paneer Bhaji', category:'Lunch Items', price:105, prepTimeMinutes:9, veg:true, available:true, popular:false, desc:'Masala Rice with Paneer Bhaji from Siddhi Services Canteen.' },

  // Demo-only counters so the prototype feels complete before the final rate cards arrive.
  { id:'d1', name:'Fresh Pineapple Juice', category:'Juices', price:45, prepTimeMinutes:4, veg:true, available:true, popular:true, desc:'Fresh pineapple juice, served chilled.' },
  { id:'d2', name:'Fresh Watermelon Juice', category:'Juices', price:40, prepTimeMinutes:4, veg:true, available:true, popular:false, desc:'Fresh watermelon juice, served chilled.' },
  { id:'d3', name:'Sweet Lime Juice', category:'Juices', price:45, prepTimeMinutes:4, veg:true, available:true, popular:false, desc:'Fresh sweet lime juice, served chilled.' },
  { id:'d4', name:'Mango Juice', category:'Juices', price:50, prepTimeMinutes:4, veg:true, available:true, popular:false, desc:'Chilled mango juice.' },
  { id:'d5', name:'Veg Frankie', category:'Frankie Counter', price:55, prepTimeMinutes:8, veg:true, available:true, popular:true, desc:'Vegetable Frankie with fresh fillings.' },
  { id:'d6', name:'Cheese Veg Frankie', category:'Frankie Counter', price:70, prepTimeMinutes:8, veg:true, available:true, popular:false, desc:'Vegetable Frankie with cheese.' },
  { id:'d7', name:'Paneer Frankie', category:'Frankie Counter', price:75, prepTimeMinutes:8, veg:true, available:true, popular:false, desc:'Paneer Frankie with fresh fillings.' },
  { id:'d8', name:'Chocolate Ice Cream', category:'Desserts', price:35, prepTimeMinutes:2, veg:true, available:true, popular:true, desc:'Chocolate ice cream.' },
  { id:'d9', name:'Vanilla Ice Cream', category:'Desserts', price:35, prepTimeMinutes:2, veg:true, available:true, popular:false, desc:'Vanilla ice cream.' },
  { id:'d10', name:'Strawberry Ice Cream', category:'Desserts', price:35, prepTimeMinutes:2, veg:true, available:true, popular:false, desc:'Strawberry ice cream.' },
  { id:'d11', name:'Ice Cream Sundae', category:'Desserts', price:55, prepTimeMinutes:3, veg:true, available:true, popular:false, desc:'Ice cream sundae with assorted toppings.' },
  { id:'d12', name:'Lays Classic', category:'Packaged Snacks', price:20, prepTimeMinutes:1, veg:true, available:true, popular:false, desc:'Packaged potato chips.' },
  { id:'d13', name:'Kurkure Masala Munch', category:'Packaged Snacks', price:20, prepTimeMinutes:1, veg:true, available:true, popular:false, desc:'Packaged snack.' },
  { id:'d14', name:'Lays Magic Masala', category:'Packaged Snacks', price:20, prepTimeMinutes:1, veg:true, available:true, popular:false, desc:'Packaged potato chips.' },
  { id:'d15', name:'Kurkure Chilli Chatka', category:'Packaged Snacks', price:20, prepTimeMinutes:1, veg:true, available:true, popular:false, desc:'Packaged snack.' },
];

function qlSeed(){
  const seededVersion = localStorage.getItem('ql_menu_version');
  if(seededVersion !== QL_MENU_VERSION){ localStorage.setItem('ql_menu', JSON.stringify(QL_MENU_SEED)); localStorage.setItem('ql_menu_version', QL_MENU_VERSION); }
  if(!localStorage.getItem('ql_orders')) localStorage.setItem('ql_orders', JSON.stringify([]));
  if(!localStorage.getItem('ql_cart')) localStorage.setItem('ql_cart', JSON.stringify([]));
  if(!localStorage.getItem('ql_counter')) localStorage.setItem('ql_counter', '247');
}
qlSeed();

function qlGetMenu(){ return JSON.parse(localStorage.getItem('ql_menu') || '[]'); }
function qlSaveMenu(menu){ localStorage.setItem('ql_menu', JSON.stringify(menu)); }
function qlIsRealOrder(o){
  if(!o || o.demo) return false;
  if(!Array.isArray(o.items) || o.items.length===0) return false;
  // Older prototype builds created placeholder orders that had an items array
  // but no actual quantities/tracking. Those must never appear as real orders.
  const hasPurchasedItem=o.items.some(ci=>ci && ci.id && Number(ci.qty)>0);
  if(!hasPurchasedItem) return false;
  if(!Array.isArray(o.itemTracks) || o.itemTracks.length===0) return false;
  const hasLiveTrack=o.itemTracks.some(t=>t && t.trackId && t.id && Number(t.qty)>0);
  return hasLiveTrack;
}
function qlNormalizeOrderSchedules(orders){
  const menu=qlGetMenu();
  let changed=false;
  (orders||[]).forEach(o=>{
    if(!o || !Array.isArray(o.itemTracks) || !o.pickupDate) return;
    const pickupAt=new Date(o.pickupDate).getTime();
    if(!Number.isFinite(pickupAt)) return;
    const day=new Date(pickupAt);
    const openAt=new Date(day); openAt.setHours(6,0,0,0);
    o.itemTracks.forEach(t=>{
      if(!t || !t.id || t.status==='collected') return;
      const m=menu.find(x=>x.id===t.id);
      const prep=Number(t.prepTimeMinutes || m?.prepTimeMinutes || 5);
      const expected=Math.max(openAt.getTime(), pickupAt-(prep*60000));
      // Repair schedules produced by older builds. A future pickup must never
      // have a readiness time before now merely because an old readyAt was saved.
      if(!Number.isFinite(Number(t.readyAt)) || Math.abs(Number(t.readyAt)-expected)>30000){
        t.readyAt=expected;
        t.prepTimeMinutes=prep;
        changed=true;
      }
    });
  });
  return changed;
}
function qlGetOrders(){
  let orders=[];
  try { orders=JSON.parse(localStorage.getItem('ql_orders') || '[]'); } catch(e) { orders=[]; }
  const valid=Array.isArray(orders) ? orders.filter(qlIsRealOrder) : [];
  // Purge placeholder/legacy broken orders immediately so they cannot reappear.
  const scheduleChanged=qlNormalizeOrderSchedules(valid);
  if(valid.length !== orders.length || scheduleChanged) localStorage.setItem('ql_orders', JSON.stringify(valid));
  return valid;
}
function qlSaveOrders(orders){ localStorage.setItem('ql_orders', JSON.stringify((orders||[]).filter(qlIsRealOrder))); }
function qlGetCart(){ return JSON.parse(localStorage.getItem('ql_cart') || '[]'); }
function qlSaveCart(cart){ localStorage.setItem('ql_cart', JSON.stringify(cart)); }
function qlGetUser(){
  try { return JSON.parse(localStorage.getItem('ql_user') || 'null'); } catch(e) { return null; }
}

function qlGetStudentOrders(){
  const user = qlGetUser();
  if(!user) return [];
  return qlGetOrders().filter(o => !o.demo && (o.studentEmail === user.email || (!o.studentEmail && o.studentName === user.name)));
}

function qlCanAccessOrder(order){
  const user = qlGetUser();
  if(!user || !order) return false;
  return !!order.demo ? false : (order.studentEmail === user.email || (!order.studentEmail && order.studentName === user.name));
}
// Expose read-only constants to the Supabase adapter (classic-script compatibility).
window.QL_MENU_SEED = QL_MENU_SEED;
window.QL_COUNTERS = QL_COUNTERS;
