const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

async function xacThuc(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Chưa đăng nhập.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const [rows] = await pool.query(
            'SELECT DangHoatDong, VaiTroHeThong FROM NguoiDung WHERE MaNguoiDung = ?',
            [payload.maNguoiDung]
        );
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị xóa.' });
        }
        if (!rows[0].DangHoatDong) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
        }

        req.nguoiDung = {
            ...payload,
            vaiTroHeThong: rows[0].VaiTroHeThong,
        };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
}

function xacThucQuanTri(req, res, next) {
    if (!req.nguoiDung || req.nguoiDung.vaiTroHeThong !== 'QuanTriVien') {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng quản trị.' });
    }
    next();
}


async function kiemTraQuyenSo(maNguoiDung, maSoChiTieu) {
    if (!maNguoiDung || !maSoChiTieu) return null;
    const [rows] = await pool.query(
        'SELECT VaiTro FROM ThanhVienSo WHERE MaSoChiTieu = ? AND MaNguoiDung = ?',
        [maSoChiTieu, maNguoiDung]
    );
    return rows.length > 0 ? rows[0] : null;
}

module.exports = { xacThuc, xacThucQuanTri, kiemTraQuyenSo };

