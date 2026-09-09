const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Chưa đăng nhập.' });
    }
    const token = authHeader.split(' ')[1];
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.nguoiDung = payload;
        next();
    }catch (err) {
        return res.status(401).json({ message: 'Token không hợp lệ.' });
    }
    
}

module.exports = { authenticateToken };