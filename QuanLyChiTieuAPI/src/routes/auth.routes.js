const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/dang-ky', authController.dangKy);
router.post('/dang-nhap', authController.dangNhap);

module.exports = router;