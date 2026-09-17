const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/dang-ky', authController.dangKy);
router.post('/dang-nhap', authController.dangNhap);
router.post('/dang-nhap-quan-tri', authController.dangNhapQuanTri);
router.patch('/doi-mat-khau', xacThuc, authController.doiMatKhau);

module.exports = router;
