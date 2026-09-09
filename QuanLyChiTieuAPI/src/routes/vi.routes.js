const express = require('express');
const router = express.Router();
const viController = require('../controllers/vi.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');



router.use(authenticateToken);

router.get('/', viController.layDanhSach);
router.post('/', viController.taoMoi);

module.exports = router;