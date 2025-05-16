const mongoose = require('mongoose');

const khachHangSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ThongTinKhachHang', khachHangSchema, 'thong_tin_khach_hang');
