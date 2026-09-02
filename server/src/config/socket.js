const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, User: ${socket.user.userId}`);
    
    if (socket.user.role === 'student') {
      socket.join(`user:${socket.user.userId}`);
      console.log(`User ${socket.user.userId} joined room user:${socket.user.userId}`);
    } else if (['staff', 'admin'].includes(socket.user.role)) {
      socket.join('staff:kitchen');
      console.log(`Staff ${socket.user.userId} joined room staff:kitchen`);
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
