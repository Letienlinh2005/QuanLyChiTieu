const express = require('express');
const router = express.Router();
const viController = require('../controllers/vi.controller');
const { xacThuc } = require('../middlewares/auth.middleware');



router.use(xacThuc);

router.get('/', viController.layDanhSach);
router.post('/', viController.taoMoi);
router.patch('/:id', viController.capNhat);
router.delete('/:id', viController.xoa);

module.exports = router;