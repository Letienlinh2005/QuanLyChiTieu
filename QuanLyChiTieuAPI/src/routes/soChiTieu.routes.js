const express = require('express');
const router = express.Router();
const soChiTieuController = require('../controllers/soChiTieu.controller');
const { xacThuc } = require('../middlewares/auth.middleware');

router.use(xacThuc);

// Sổ chi tiêu
router.get('/cua-toi', soChiTieuController.layDanhSachCuaToi);
router.post('/', soChiTieuController.taoMoi);

// Lời mời tham gia sổ chi tiêu
router.get('/loi-moi-den', soChiTieuController.layDanhSachLoiMoiDen);
router.post('/loi-moi/:maLoiMoi/chap-nhan', soChiTieuController.chapNhanLoiMoi);
router.post('/loi-moi/:maLoiMoi/tu-choi', soChiTieuController.tuChoiLoiMoi);
router.delete('/loi-moi/:maLoiMoi', soChiTieuController.huyLoiMoi);

// Thành viên sổ chi tiêu
router.get('/:id/thanh-vien', soChiTieuController.layDanhSachThanhVien);
router.post('/:id/thanh-vien', soChiTieuController.moiThanhVien);
router.put('/:id/thanh-vien/:maNguoiDung/vai-tro', soChiTieuController.capNhatVaiTroThanhVien);
router.delete('/:id/thanh-vien/:maNguoiDung', soChiTieuController.xoaThanhVien);

// Lời mời đã gửi của 1 sổ
router.get('/:id/loi-moi-da-gui', soChiTieuController.layDanhSachLoiMoiDaGui);

module.exports = router;