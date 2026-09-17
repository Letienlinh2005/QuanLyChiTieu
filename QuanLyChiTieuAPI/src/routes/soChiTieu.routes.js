const express = require('express');
const router = express.Router();
const soChiTieuController = require('../controllers/soChiTieu.controller');
const { xacThuc } = require('../middlewares/auth.middleware');

router.use(xacThuc);

router.get('/cua-toi', soChiTieuController.layDanhSachCuaToi);

// Thành viên sổ chi tiêu
router.get('/:id/thanh-vien', soChiTieuController.layDanhSachThanhVien);
router.post('/:id/thanh-vien', soChiTieuController.moiThanhVien);
router.delete('/:id/thanh-vien/:maNguoiDung', soChiTieuController.xoaThanhVien);

module.exports = router;