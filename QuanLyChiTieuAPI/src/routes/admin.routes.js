const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { xacThuc, xacThucQuanTri } = require('../middlewares/auth.middleware');

// Mọi route bên dưới đều yêu cầu: đã đăng nhập VÀ có vai trò QuanTriVien
router.use(xacThuc);
router.use(xacThucQuanTri);

// Tổng quan
router.get('/thong-ke-tong-quan', adminController.layThongKeTongQuan);

// Người dùng
router.get('/nguoi-dung', adminController.layDanhSachNguoiDung);
router.patch('/nguoi-dung/:id/trang-thai', adminController.doiTrangThaiNguoiDung);

// Sổ chi tiêu
router.get('/so-chi-tieu', adminController.layDanhSachSoChiTieu);

// Danh mục mẫu
router.get('/danh-muc-mau', adminController.layDanhSachDanhMucMau);
router.post('/danh-muc-mau', adminController.themDanhMucMau);
router.delete('/danh-muc-mau/:id', adminController.xoaDanhMucMau);

// Giao dịch toàn hệ thống
router.get('/giao-dich', adminController.layDanhSachGiaoDichToanHeThong);

// Nhật ký hệ thống
router.get('/nhat-ky', adminController.layNhatKy);

module.exports = router;
