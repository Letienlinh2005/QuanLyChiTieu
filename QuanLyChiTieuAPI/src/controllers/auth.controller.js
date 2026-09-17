const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

function taoToken(nguoiDung) {
    return jwt.sign(
        {
            maNguoiDung: nguoiDung.MaNguoiDung,
            email: nguoiDung.Email,
            vaiTroHeThong: nguoiDung.VaiTroHeThong || 'NguoiDung',
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
}

function chuyenDoiNguoiDung(row) {
    return {
        maNguoiDung: row.MaNguoiDung,
        email: row.Email,
        hoTen: row.HoTen,
        linkAvatar: row.LinkAvatar,
        soDienThoai: row.SoDienThoai,
        vaiTroHeThong: row.VaiTroHeThong || 'NguoiDung',
        dangHoatDong: !!row.DangHoatDong,
    };
}

exports.dangKy = async (req, res) => {
    const { email, matKhau, hoTen } = req.body;

    if (!email || !matKhau || !hoTen) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    try {
        const [existed] = await pool.query(
            'SELECT MaNguoiDung FROM NguoiDung WHERE Email = ?',
            [email]
        );
        if (existed.length > 0) {
            return res.status(409).json({ message: 'Email đã được sử dụng' });
        }

        const matKhauHash = await bcrypt.hash(matKhau, 10);

        const [result] = await pool.query(
            'INSERT INTO NguoiDung (Email, MatKhauHash, HoTen) VALUES (?, ?, ?)',
            [email, matKhauHash, hoTen]
        );

        const [soChiTieuResult] = await pool.query(
            'INSERT INTO SoChiTieu (TenSo, LoaiSo, MaNguoiTao) VALUES (?, ?, ?)',
            [`Sổ của ${hoTen}`, 'CaNhan', result.insertId]
        );

        await pool.query(
            'INSERT INTO ThanhVienSo (MaSoChiTieu, MaNguoiDung, VaiTro) VALUES (?, ?, ?)',
            [soChiTieuResult.insertId, result.insertId, 'ChuSo']
        );

        const [danhMucMau] = await pool.query('SELECT * FROM DanhMucMau');
        for (const dm of danhMucMau) {
            await pool.query(
                'INSERT INTO DanhMuc (MaSoChiTieu, TenDanhMuc, BieuTuong, Loai, LaMacDinh) VALUES (?, ?, ?, ?, 1)',
                [soChiTieuResult.insertId, dm.TenDanhMuc, dm.BieuTuong, dm.Loai]
            );
        }

        const nguoiDung = {
            MaNguoiDung: result.insertId,
            Email: email,
            HoTen: hoTen,
            LinkAvatar: null,
            SoDienThoai: null,
            VaiTroHeThong: 'NguoiDung',
            DangHoatDong: 1,
        };

        const token = taoToken(nguoiDung);
        res.status(201).json({ token, nguoiDung: chuyenDoiNguoiDung(nguoiDung) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký' });
    }
};

exports.dangNhap = async (req, res) => {
    const { email, matKhau } = req.body;

    if (!email || !matKhau) {
        return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM NguoiDung WHERE Email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const nguoiDung = rows[0];

        if (!nguoiDung.DangHoatDong) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
        }

        const dungMatKhau = await bcrypt.compare(matKhau, nguoiDung.MatKhauHash);

        if (!dungMatKhau) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const token = taoToken(nguoiDung);
        res.json({ token, nguoiDung: chuyenDoiNguoiDung(nguoiDung) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập' });
    }
};

exports.dangNhapQuanTri = async (req, res) => {
    const { email, matKhau } = req.body;

    if (!email || !matKhau) {
        return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM NguoiDung WHERE Email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const nguoiDung = rows[0];
        const dungMatKhau = await bcrypt.compare(matKhau, nguoiDung.MatKhauHash);

        if (!dungMatKhau) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        if (nguoiDung.VaiTroHeThong !== 'QuanTriVien') {
            return res.status(403).json({ message: 'Tài khoản này không có quyền truy cập trang quản trị.' });
        }

        if (!nguoiDung.DangHoatDong) {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });
        }

        const token = taoToken(nguoiDung);
        res.json({ token, nguoiDung: chuyenDoiNguoiDung(nguoiDung) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập' });
    }
};

exports.doiMatKhau = async (req, res) => {
    const maNguoiDung = req.nguoiDung.maNguoiDung;
    const { matKhauCu, matKhauMoi } = req.body;

    if (!matKhauCu || !matKhauMoi) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ và mới' });
    }

    try {
        const [rows] = await pool.query('SELECT MatKhauHash FROM NguoiDung WHERE MaNguoiDung = ?', [maNguoiDung]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        const dungMatKhau = await bcrypt.compare(matKhauCu, rows[0].MatKhauHash);
        if (!dungMatKhau) {
            return res.status(401).json({ message: 'Mật khẩu cũ không đúng' });
        }

        const matKhauHashMoi = await bcrypt.hash(matKhauMoi, 10);
        await pool.query('UPDATE NguoiDung SET MatKhauHash = ? WHERE MaNguoiDung = ?', [matKhauHashMoi, maNguoiDung]);

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi đổi mật khẩu' });
    }
};
