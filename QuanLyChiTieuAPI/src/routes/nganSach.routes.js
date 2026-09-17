const express = require('express');
const router = express.Router();
const nganSachController = require('../controllers/nganSach.controller');
const { xacThuc } = require('../middlewares/auth.middleware');

router.use(xacThuc);

router.get('/', nganSachController.layDanhSach);
router.post('/', nganSachController.taoMoi);
router.put('/:id', nganSachController.capNhat);
router.delete('/:id', nganSachController.xoa);

module.exports = router;
