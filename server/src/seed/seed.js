require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User.model');
const Category = require('../models/Category.model');
const FoodItem = require('../models/FoodItem.model');
const SystemSettings = require('../models/SystemSettings.model');
const Order = require('../models/Order.model');
const Notification = require('../models/Notification.model');
const Feedback = require('../models/Feedback.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/canteen-system';

const categoriesData = [
  { name: 'Hot Items', slug: 'hot-items', displayOrder: 1, icon: '🍵' },
  { name: 'Snacks', slug: 'snacks', displayOrder: 2, icon: '🥪' },
  { name: 'Sandwiches', slug: 'sandwiches', displayOrder: 3, icon: '🥙' },
  { name: 'Dosa', slug: 'dosa', displayOrder: 4, icon: '🫓' },
  { name: 'Uttappa', slug: 'uttappa', displayOrder: 5, icon: '🥞' },
  { name: 'Lunch', slug: 'lunch', displayOrder: 6, icon: '🍱' },
  { name: 'Rice Specials', slug: 'rice-specials', displayOrder: 7, icon: '🍚' },
  { name: 'Soups', slug: 'soups', displayOrder: 8, icon: '🍲' },
  { name: 'Chaat', slug: 'chaat', displayOrder: 9, icon: '🌮' },
  { name: 'Grilled Sandwiches', slug: 'grilled-sandwiches', displayOrder: 10, icon: '🥗' }
];

const foodItemsData = [
  // Hot Items
  { name: 'Tea', price: 10, prep: 3, isVeg: true, pop: true, catName: 'Hot Items' },
  { name: 'Coffee', price: 15, prep: 3, isVeg: true, pop: false, catName: 'Hot Items' },
  { name: 'Tea Mix', price: 20, prep: 4, isVeg: true, pop: false, catName: 'Hot Items' },
  { name: 'Chinese Vada Pav', price: 15, prep: 5, isVeg: true, pop: false, catName: 'Hot Items' },
  // Snacks
  { name: 'Vada Pav', price: 10, prep: 5, isVeg: true, pop: true, catName: 'Snacks' },
  { name: 'Samosa', price: 10, prep: 5, isVeg: true, pop: false, catName: 'Snacks' },
  { name: 'Samosa Plate', price: 18, prep: 5, isVeg: true, pop: false, catName: 'Snacks' },
  { name: 'Kachori Wada', price: 20, prep: 6, isVeg: true, pop: false, catName: 'Snacks' },
  { name: 'Vada Ussal', price: 33, prep: 8, isVeg: true, pop: false, catName: 'Snacks' },
  { name: 'Vada Ussal Single', price: 25, prep: 7, isVeg: true, pop: false, catName: 'Snacks' },
  { name: 'Bhaji Samosa', price: 35, prep: 8, isVeg: true, pop: false, catName: 'Snacks' },
  { name: 'Misal', price: 53, prep: 10, isVeg: true, pop: true, catName: 'Snacks' },
  { name: 'Misal Pav', price: 53, prep: 10, isVeg: true, pop: true, catName: 'Snacks' },
  { name: 'Idu Sambar', price: 44, prep: 8, isVeg: true, pop: false, catName: 'Snacks' },
  { name: 'Vada Sambar', price: 35, prep: 8, isVeg: true, pop: false, catName: 'Snacks' },
  { name: 'Butter Idu', price: 44, prep: 8, isVeg: true, pop: false, catName: 'Snacks' },
  { name: 'Puri Plate', price: 60, prep: 10, isVeg: true, pop: false, catName: 'Snacks' },
  // Sandwiches
  { name: 'Bread Butter', price: 18, prep: 3, isVeg: true, pop: false, catName: 'Sandwiches' },
  { name: 'Veg Head Butter', price: 25, prep: 4, isVeg: true, pop: false, catName: 'Sandwiches' },
  { name: 'Veg Sandwich', price: 40, prep: 5, isVeg: true, pop: false, catName: 'Sandwiches' },
  { name: 'Plain Toast', price: 28, prep: 4, isVeg: true, pop: false, catName: 'Sandwiches' },
  { name: 'Veg Cheese Toast', price: 43, prep: 6, isVeg: true, pop: false, catName: 'Sandwiches' },
  { name: 'Cheese Sandwich', price: 38, prep: 6, isVeg: true, pop: false, catName: 'Sandwiches' },
  { name: 'Club Sandwich', price: 63, prep: 8, isVeg: true, pop: true, catName: 'Sandwiches' },
  { name: 'Cheese Club Sandwich', price: 75, prep: 9, isVeg: true, pop: false, catName: 'Sandwiches' },
  { name: 'Only Cheese Toast Sandwich', price: 105, prep: 8, isVeg: true, pop: false, catName: 'Sandwiches' },
  { name: 'Chalie Cheese Toast Sandwich', price: 116, prep: 10, isVeg: true, pop: false, catName: 'Sandwiches' },
  // Dosa
  { name: 'Masala Dosa', price: 84, prep: 12, isVeg: true, pop: true, catName: 'Dosa' },
  { name: 'Butter Masala Dosa', price: 84, prep: 12, isVeg: true, pop: false, catName: 'Dosa' },
  { name: 'Onion Masala Dosa', price: 84, prep: 12, isVeg: true, pop: false, catName: 'Dosa' },
  { name: 'Mysore Masala Dosa', price: 80, prep: 12, isVeg: true, pop: false, catName: 'Dosa' },
  { name: 'Cheese Mysore Masala', price: 105, prep: 14, isVeg: true, pop: false, catName: 'Dosa' },
  { name: 'Chinese Masala Dosa', price: 95, prep: 15, isVeg: true, pop: false, catName: 'Dosa' },
  { name: 'Plain Dosa', price: 60, prep: 10, isVeg: true, pop: false, catName: 'Dosa' },
  // Uttappa
  { name: 'Plain Uttappa', price: 54, prep: 10, isVeg: true, pop: false, catName: 'Uttappa' },
  { name: 'Cheese Uttappa', price: 62, prep: 12, isVeg: true, pop: false, catName: 'Uttappa' },
  { name: 'Onion Uttappa', price: 63, prep: 12, isVeg: true, pop: false, catName: 'Uttappa' },
  { name: 'Masala Uttappa', price: 63, prep: 12, isVeg: true, pop: false, catName: 'Uttappa' },
  { name: 'Tomato Uttappa', price: 62, prep: 12, isVeg: true, pop: false, catName: 'Uttappa' },
  { name: 'Tomato-Tomato Uttappa', price: 75, prep: 14, isVeg: true, pop: false, catName: 'Uttappa' },
  // Lunch
  { name: 'Plain Dal Rice', price: 80, prep: 8, isVeg: true, pop: false, catName: 'Lunch' },
  { name: 'Dal Rice', price: 79, prep: 8, isVeg: true, pop: true, catName: 'Lunch' },
  { name: 'Pav Bhaji', price: 63, prep: 12, isVeg: true, pop: true, catName: 'Lunch' },
  { name: 'Rajma Pulao', price: 85, prep: 10, isVeg: true, pop: false, catName: 'Lunch' },
  { name: 'Jeera Rice', price: 70, prep: 8, isVeg: true, pop: false, catName: 'Lunch' },
  { name: 'Lunch with Keera Rice', price: 97, prep: 12, isVeg: true, pop: false, catName: 'Lunch' },
  { name: 'Masala Rice with Raita', price: 52, prep: 10, isVeg: true, pop: false, catName: 'Lunch' },
  { name: 'Chapati Bhaji', price: 45, prep: 8, isVeg: true, pop: false, catName: 'Lunch' },
  { name: 'Paneer Bhaji', price: 90, prep: 12, isVeg: true, pop: false, catName: 'Lunch' },
  // Rice Specials
  { name: 'Tomato Rice with Date', price: 74, prep: 10, isVeg: true, pop: false, catName: 'Rice Specials' },
  { name: 'Manchurian Rice', price: 105, prep: 15, isVeg: true, pop: true, catName: 'Rice Specials' },
  { name: 'Veg Fried Rice', price: 105, prep: 15, isVeg: true, pop: false, catName: 'Rice Specials' },
  { name: 'Paneer Biryani Rice', price: 120, prep: 18, isVeg: true, pop: true, catName: 'Rice Specials' },
  // Soups
  { name: 'Tomato Soup', price: 59, prep: 5, isVeg: true, pop: false, catName: 'Soups' },
  { name: 'Veg Lemon Soup', price: 57, prep: 5, isVeg: true, pop: false, catName: 'Soups' },
  { name: 'Mixed Veg Soup', price: 57, prep: 5, isVeg: true, pop: false, catName: 'Soups' },
  { name: 'Veg Chowmein', price: 59, prep: 8, isVeg: true, pop: false, catName: 'Soups' },
  // Chaat
  { name: 'Puri Puri', price: 57, prep: 5, isVeg: true, pop: false, catName: 'Chaat' },
  { name: 'Bhel Puri', price: 57, prep: 4, isVeg: true, pop: false, catName: 'Chaat' },
  { name: 'Mini Potato Puri', price: 62, prep: 5, isVeg: true, pop: false, catName: 'Chaat' },
  { name: 'Cheese Bhel', price: 52, prep: 5, isVeg: true, pop: false, catName: 'Chaat' },
  // Grilled Sandwiches
  { name: 'Veg Grilled Sandwich', price: 89, prep: 8, isVeg: true, pop: true, catName: 'Grilled Sandwiches' },
  { name: 'Veg Cheese Grilled Sandwich', price: 125, prep: 10, isVeg: true, pop: false, catName: 'Grilled Sandwiches' },
  { name: 'Cheese Grilled Sandwich', price: 110, prep: 10, isVeg: true, pop: false, catName: 'Grilled Sandwiches' }
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await FoodItem.deleteMany({});
    await SystemSettings.deleteMany({});
    await Order.deleteMany({});
    await Notification.deleteMany({});
    await Feedback.deleteMany({});
    
    console.log('Creating SystemSettings...');
    await SystemSettings.getSettings();
    
    console.log('Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const hashAdmin = await bcrypt.hash('Admin@123', salt);
    const hashStaff = await bcrypt.hash('Staff@123', salt);
    const hashStudent = await bcrypt.hash('Student@123', salt);
    
    const admin = await User.create({ name: 'Admin User', email: 'admin@somaiya.edu', password: hashAdmin, role: 'admin', phone: '9999999999' });
    const staff = await User.create({ name: 'Kitchen Staff', email: 'staff@somaiya.edu', password: hashStaff, role: 'staff', phone: '8888888888' });
    const student1 = await User.create({ name: 'Rahul Sharma', email: 'rahul@somaiya.edu', password: hashStudent, role: 'student', rollNumber: 'SVV2024001', phone: '7777777777' });
    const student2 = await User.create({ name: 'Priya Patel', email: 'priya@somaiya.edu', password: hashStudent, role: 'student', rollNumber: 'SVV2024002', phone: '6666666666' });
    
    console.log('Creating categories...');
    const categoriesMap = {};
    for (const catData of categoriesData) {
      const cat = await Category.create(catData);
      categoriesMap[cat.name] = cat._id;
    }
    
    console.log('Creating food items...');
    for (const itemData of foodItemsData) {
      await FoodItem.create({
        name: itemData.name,
        price: itemData.price,
        preparationTime: itemData.prep,
        isVeg: itemData.isVeg,
        isPopular: itemData.pop,
        category: categoriesMap[itemData.catName]
      });
    }

    const items = await FoodItem.find();
    const getRandomItem = () => items[Math.floor(Math.random() * items.length)];

    console.log('Creating sample orders...');
    const now = new Date();
    
    const createOrder = async (student, status, minsAgo) => {
      const placedAt = new Date(now.getTime() - minsAgo * 60000);
      const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const pickupCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      
      const i1 = getRandomItem();
      const i2 = getRandomItem();
      
      const order = new Order({
        orderNumber,
        pickupCode,
        student: student._id,
        items: [
          { foodItem: i1._id, name: i1.name, price: i1.price, quantity: 1, preparationTime: i1.preparationTime },
          { foodItem: i2._id, name: i2.name, price: i2.price, quantity: 2, preparationTime: i2.preparationTime }
        ],
        subtotal: i1.price + (i2.price * 2),
        total: i1.price + (i2.price * 2),
        status,
        placedAt,
        statusHistory: [{ status: 'placed', timestamp: placedAt }]
      });

      if (status === 'received' || status === 'preparing' || status === 'ready' || status === 'collected') {
        order.statusHistory.push({ status: 'received', timestamp: new Date(placedAt.getTime() + 1000) });
      }
      if (status === 'preparing' || status === 'ready' || status === 'collected') {
        const acc = new Date(placedAt.getTime() + 60000);
        order.acceptedAt = acc;
        order.statusHistory.push({ status: 'accepted', timestamp: acc });
        
        const prep = new Date(placedAt.getTime() + 120000);
        order.preparingAt = prep;
        order.statusHistory.push({ status: 'preparing', timestamp: prep });
      }
      if (status === 'ready' || status === 'collected') {
        const ready = new Date(placedAt.getTime() + 600000);
        order.readyAt = ready;
        order.statusHistory.push({ status: 'ready', timestamp: ready });
      }
      if (status === 'collected') {
        const col = new Date(placedAt.getTime() + 1200000);
        order.collectedAt = col;
        order.statusHistory.push({ status: 'collected', timestamp: col });
      }

      await order.save();
    };

    // 2 received, 2 preparing, 1 ready, 3 collected
    await createOrder(student1, 'received', 5);
    await createOrder(student2, 'received', 3);
    await createOrder(student1, 'preparing', 15);
    await createOrder(student2, 'preparing', 12);
    await createOrder(student1, 'ready', 20);
    await createOrder(student1, 'collected', 60);
    await createOrder(student2, 'collected', 120);
    await createOrder(student1, 'collected', 1440);

    console.log('\n=== DEMO CREDENTIALS ===');
    console.log('Admin:   admin@somaiya.edu   / Admin@123');
    console.log('Staff:   staff@somaiya.edu   / Staff@123');
    console.log('Student: rahul@somaiya.edu   / Student@123');
    console.log('Student: priya@somaiya.edu   / Student@123');
    console.log('========================\n');
    
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedDB();
