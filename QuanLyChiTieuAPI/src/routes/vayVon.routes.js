const express = require('express');
const router = express.Router();
const vayVonController = require('../controllers/vayVon.controller');
const { xacThuc } = require('../middlewares/auth.middleware');

router.use(xacThuc);

// Vay ngân hàng
router.get('/vay', vayVonController.layDanhSachVay);
router.post('/vay', vayVonController.themVay);
router.put('/vay/:id', vayVonController.capNhatVay);
router.delete('/vay/:id', vayVonController.xoaVay);

// Cho vay
router.get('/cho-vay', vayVonController.layDanhSachChoVay);
router.post('/cho-vay', vayVonController.themChoVay);
router.put('/cho-vay/:id', vayVonController.capNhatChoVay);
router.delete('/cho-vay/:id', vayVonController.xoaChoVay);

module.exports = router;
