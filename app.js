const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const mongoose = require('mongoose');
const KhachHang = require('./models/KhachHang');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

// Kết nối đến MongoDB với timeout
mongoose.connect('mongodb+srv://phuphupham1802:phu091103@pkyduocdongsaigon.7aosekl.mongodb.net/pkyduocdongsaigon', {
  serverSelectionTimeoutMS: 5000 // ⏱ Timeout sau 5 giây nếu không kết nối được
})
.then(() => console.log('✅ Kết nối MongoDB thành công'))
.catch((err) => console.error('❌ Kết nối MongoDB thất bại:', err));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Cấu hình Multer để upload file PDF
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Route kiểm tra tình trạng server
app.get('/health', (req, res) => {
  res.send('OK');
});

// Trang chính
app.get('/', async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'public/uploads');
    let pdfFiles = [];

    if (fs.existsSync(uploadDir)) {
      pdfFiles = await fsPromises.readdir(uploadDir);
      pdfFiles = pdfFiles.filter(file => file.endsWith('.pdf'));
    }

    const contacts = await KhachHang.find().sort({ createdAt: -1 });

    res.render('index', { contacts, pdfFiles });
  } catch (err) {
    console.error('❌ Lỗi khi tải trang chủ:', err);
    res.status(500).send('Lỗi server');
  }
});

// Xử lý form liên hệ 
app.post('/contact', async (req, res) => {
  const { name, phone, email } = req.body;

  try {
    const khachHangMoi = new KhachHang({ name, phone, email });
    await khachHangMoi.save();
    console.log('💾 Đã lưu thông tin khách hàng vào MongoDB');
    res.redirect('/');
  } catch (err) {
    console.error('❌ Lỗi khi lưu khách hàng:', err);
    res.status(500).send('Lỗi server');
  }
});

// Trang admin hiển thị và upload file
app.get('/admin', async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'public/uploads');
    let pdfFiles = [];

    if (fs.existsSync(uploadDir)) {
      pdfFiles = await fsPromises.readdir(uploadDir);
      pdfFiles = pdfFiles.filter(file => file.endsWith('.pdf'));
    }

    res.render('admin', { pdfFiles });
  } catch (err) {
    console.error('❌ Lỗi khi tải trang admin:', err);
    res.status(500).send('Lỗi server');
  }
});

// Xử lý upload file PDF
app.post('/upload', upload.single('pdfFile'), (req, res) => {
  res.redirect('/admin');
});

// Xử lý xóa file PDF
app.get('/delete/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public/uploads', filename);

  try {
    if (fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
      console.log(`🗑️ Đã xóa: ${filename}`);
    } else {
      console.log(`⚠️ Không tìm thấy: ${filename}`);
    }
  } catch (err) {
    console.error('❌ Lỗi khi xóa file:', err);
  }

  res.redirect('/admin');
});

// Khởi chạy server
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

