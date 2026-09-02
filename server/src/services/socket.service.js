const { getIO } = require('../config/socket');

const emitToStudent = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, data);
  } catch (error) {
    console.error('Socket error emitting to student:', error);
  }
};

const emitToStaff = (event, data) => {
  try {
    const io = getIO();
    io.to('staff:kitchen').emit(event, data);
  } catch (error) {
    console.error('Socket error emitting to staff:', error);
  }
};

const emitToAll = (event, data) => {
  try {
    const io = getIO();
    io.emit(event, data);
  } catch (error) {
    console.error('Socket error emitting to all:', error);
  }
};

module.exports = {
  emitToStudent,
  emitToStaff,
  emitToAll
};
