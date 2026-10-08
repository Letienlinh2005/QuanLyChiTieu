const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { xacThuc, xacThucQuanTri } = require('../middlewares/auth.middleware');

router.use(xacThuc);
router.use(xacThucQuanTri);

router.get('/thong-ke-tong-quan', adminController.layThongKeTongQuan);
router.get('/nguoi-dung', adminController.layDanhSachNguoiDung);
router.patch('/nguoi-dung/:id/trang-thai', adminController.doiTrangThaiNguoiDung);
router.get('/so-chi-tieu', adminController.layDanhSachSoChiTieu);
router.get('/danh-muc-mau', adminController.layDanhSachDanhMucMau);
router.post('/danh-muc-mau', adminController.themDanhMucMau);
router.delete('/danh-muc-mau/:id', adminController.xoaDanhMucMau);
router.get('/giao-dich', adminController.layDanhSachGiaoDichToanHeThong);
router.get('/nhat-ky', adminController.layNhatKy);

module.exports = router;
