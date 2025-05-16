const mongoose = require('mongoose');

const TinTucSchema = new mongoose.Schema({
  filename: String,          // Tên file
  uploadDate: {              // Ngày upload
    type: Date,
    default: Date.now
  },
  fileId: mongoose.Schema.Types.ObjectId // _id của file trong GridFS
});

module.exports = mongoose.model('TinTuc', TinTucSchema);
