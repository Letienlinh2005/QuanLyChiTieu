const express = require('express');
const router = express.Router();
const danhMucController = require('../controllers/danhMuc.controller');
const { xacThuc } = require('../middlewares/auth.middleware');

router.use(xacThuc);

router.get('/', danhMucController.layDanhSach);
router.post('/', danhMucController.taoMoi);
router.patch('/:id', danhMucController.capNhat);
router.delete('/:id', danhMucController.xoa);

module.exports = router;