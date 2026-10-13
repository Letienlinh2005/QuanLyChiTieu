const express = require('express');
const router = express.Router();
const baoCaoController = require('../controllers/baoCao.controller');
const { xacThuc } = require('../middlewares/auth.middleware');

router.use(xacThuc);

router.get('/tong-quan', baoCaoController.tongQuan);
router.get('/xu-huong', baoCaoController.xuHuong);
router.get('/bao-cao-nam', baoCaoController.baoCaoNam);
router.get('/bao-cao-ngay', baoCaoController.baoCaoNgay);
router.get('/cac-ngay-trong-thang', baoCaoController.cacNgayTrongThang);

module.exports = router;
