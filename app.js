const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const KhachHang = require('./models/KhachHang');

const app = express();
const port = 3000;

app.use(express.static('public'));

mongoose.connect('mongodb+srv://phuphupham1802:phu091103@pkyduocdongsaigon.7aosekl.mongodb.net/pkyduocdongsaigon', {})
  .then(() => console.log('✅ Kết nối MongoDB thành công'))
  .catch((err) => console.error('❌ Kết nối MongoDB thất bại:', err));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Khởi tạo file lưu thông tin upload
const infoFilePath = path.join(__dirname, 'uploads', 'fileInfo.json');

// Đảm bảo thư mục uploads tồn tại
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Đọc file JSON lưu info file, nếu chưa có thì tạo mới
function readFileInfo() {
  if (!fs.existsSync(infoFilePath)) {
    fs.writeFileSync(infoFilePath, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(infoFilePath);
  return JSON.parse(data);
}

function saveFileInfo(data) {
  fs.writeFileSync(infoFilePath, JSON.stringify(data, null, 2));
}

// Cấu hình multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Trang chính
app.get('/', async (req, res) => {
  const contacts = await KhachHang.find().sort({ createdAt: -1 });

  let fileInfos = readFileInfo();

  // Lọc chỉ file PDF (nếu muốn)
  fileInfos = fileInfos.filter(f => f.filename.endsWith('.pdf'));

  res.render('index', { contacts, fileInfos });
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

// Trang admin
app.get('/admin', (req, res) => {
  let fileInfos = readFileInfo();
  fileInfos = fileInfos.filter(f => f.filename.endsWith('.pdf'));
  res.render('admin', { fileInfos });
});

// Xử lý upload file PDF
app.post('/upload', upload.single('pdfFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Không có file được upload');
  }

  // Đọc dữ liệu hiện tại
  let fileInfos = readFileInfo();

  // Kiểm tra nếu file đã tồn tại trong danh sách, bỏ qua thêm lại
  const exists = fileInfos.some(f => f.filename === req.file.originalname);
  if (!exists) {
    fileInfos.push({
      filename: req.file.originalname,
      uploadDate: new Date().toISOString()
    });
    saveFileInfo(fileInfos);
  }

  res.redirect('/admin');
});

// Xử lý xóa file PDF
app.get('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Đã xóa: ${filename}`);

    // Cập nhật lại fileInfo.json
    let fileInfos = readFileInfo();
    fileInfos = fileInfos.filter(f => f.filename !== filename);
    saveFileInfo(fileInfos);
  } else {
    console.log(`⚠️ Không tìm thấy: ${filename}`);
  }

  res.redirect('/admin');
});

// Khởi chạy server
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
