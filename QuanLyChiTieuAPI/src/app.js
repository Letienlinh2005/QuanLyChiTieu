const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const viRoutes = require('./routes/vi.routes');
const soChiTieuRoutes = require('./routes/soChiTieu.routes');
const danhMucRoutes = require('./routes/danhMuc.routes');
const giaoDichRoutes = require('./routes/giaoDich.routes');
const nganSachRoutes = require('./routes/nganSach.routes');
const baoCaoRoutes = require('./routes/baoCao.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vi', viRoutes);
app.use('/api/so-chi-tieu', soChiTieuRoutes);
app.use('/api/danh-muc', danhMucRoutes);
app.use('/api/giao-dich', giaoDichRoutes);
app.use('/api/ngan-sach', nganSachRoutes);
app.use('/api/bao-cao', baoCaoRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Trang quản trị (HTML/CSS/JS tĩnh) - phục vụ cùng cổng với API,
// KHÔNG cần chạy thêm máy chủ tĩnh riêng (tránh xung đột cổng với API).
// Truy cập: http://localhost:3000/admin/login.html
app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin')));

module.exports = app;
