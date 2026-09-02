const isBetween = (time, start, end) => {
  return time >= start && time <= end;
};

module.exports = { isBetween };
