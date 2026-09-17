const express = require('express');
const router = express.Router();
const giaoDichController = require('../controllers/giaoDich.controller');
const { xacThuc } = require('../middlewares/auth.middleware');

router.use(xacThuc);

router.get('/', giaoDichController.layDanhSach);
router.post('/', giaoDichController.taoMoi);
router.patch('/:id', giaoDichController.capNhat);
router.delete('/:id', giaoDichController.xoa);

module.exports = router;