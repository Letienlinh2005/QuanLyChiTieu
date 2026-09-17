const jwt = require('jsonwebtoken');
require('dotenv').config();

function xacThuc(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Chưa đăng nhập.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.nguoiDung = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token không hợp lệ.' });
    }
}

// Dùng sau xacThuc, chặn mọi request không phải tài khoản Quản trị viên.
// Dựa vào vaiTroHeThong đã được nhúng sẵn trong JWT lúc đăng nhập (xem auth.controller.js),
// nên không cần query lại DB ở mỗi request.
function xacThucQuanTri(req, res, next) {
    if (!req.nguoiDung || req.nguoiDung.vaiTroHeThong !== 'QuanTriVien') {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng quản trị.' });
    }
    next();
}

module.exports = { xacThuc, xacThucQuanTri };
