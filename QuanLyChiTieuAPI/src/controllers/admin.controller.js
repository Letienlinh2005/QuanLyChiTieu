const pool = require('../config/database');


async function ghiNhatKy(req, { hanhDong, doiTuong, maDoiTuong, chiTiet }) {
    try {
        await pool.query(
            `INSERT INTO NhatKyHeThong (MaNguoiDung, HanhDong, DoiTuong, MaDoiTuong, ChiTiet, DiaChiIP)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.nguoiDung?.maNguoiDung || null,
                hanhDong,
                doiTuong,
                maDoiTuong || null,
                chiTiet ? JSON.stringify(chiTiet) : null,
                req.ip || null,
            ]
        );
    } catch (err) {
        console.error('Lỗi ghi nhật ký hệ thống:', err);
    }
}

// TỔNG QUAN
exports.layThongKeTongQuan = async (req, res) => {
    try {
        const [[tk1]] = await pool.query(
            'SELECT COUNT(*) AS tongNguoiDungHoatDong FROM NguoiDung WHERE DangHoatDong = 1'
        );
        const [[tk2]] = await pool.query(
            `SELECT COUNT(*) AS tongSoGiaDinh FROM SoChiTieu WHERE LoaiSo = 'GiaDinh'`
        );
        const [[tk3]] = await pool.query(
            `SELECT COUNT(*) AS tongGiaoDichThangNay FROM GiaoDich
             WHERE MONTH(NgayGiaoDich) = MONTH(CURDATE()) AND YEAR(NgayGiaoDich) = YEAR(CURDATE())`
        );
        const [[tk4]] = await pool.query(
            'SELECT COUNT(*) AS tongTaiKhoanKhoa FROM NguoiDung WHERE DangHoatDong = 0'
        );
        const [[tk5]] = await pool.query(
            'SELECT COUNT(*) AS nguoiDungMoi30Ngay FROM NguoiDung WHERE NgayTao >= CURDATE() - INTERVAL 30 DAY'
        );

        const nguoiDungMoiTheoTuan = [];
        for (let i = 3; i >= 0; i--) {
            const [[row]] = await pool.query(
                `SELECT COUNT(*) AS soLuong FROM NguoiDung
                 WHERE NgayTao >= NOW() - INTERVAL ${(i + 1) * 7} DAY
                   AND NgayTao <  NOW() - INTERVAL ${i * 7} DAY`
            );
            nguoiDungMoiTheoTuan.push({ nhan: `Tuần ${4 - i}`, soLuong: row.soLuong });
        }

        const [soHoatDongNhieuNhat] = await pool.query(
            `SELECT s.MaSoChiTieu, s.TenSo, s.LoaiSo,
                    (SELECT COUNT(*) FROM ThanhVienSo tv WHERE tv.MaSoChiTieu = s.MaSoChiTieu) AS SoThanhVien,
                    (SELECT COUNT(*) FROM GiaoDich gd WHERE gd.MaSoChiTieu = s.MaSoChiTieu
                       AND gd.NgayGiaoDich >= CURDATE() - INTERVAL 30 DAY) AS GiaoDich30Ngay
             FROM SoChiTieu s
             ORDER BY GiaoDich30Ngay DESC, s.NgayTao DESC
             LIMIT 5`
        );

        res.json({ ...tk1, ...tk2, ...tk3, ...tk4, ...tk5, nguoiDungMoiTheoTuan, soHoatDongNhieuNhat });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy thống kê tổng quan' });
    }
};

// NGƯỜI DÙNG
exports.layDanhSachNguoiDung = async (req, res) => {
    const { tuKhoa = '', trangThai = '', trang = 1, soDong = 20 } = req.query;

    try {
        let sql = `
            SELECT nd.MaNguoiDung, nd.Email, nd.HoTen, nd.SoDienThoai, nd.VaiTroHeThong,
                   nd.DangHoatDong, nd.NgayTao,
                   (SELECT COUNT(*) FROM ThanhVienSo tv WHERE tv.MaNguoiDung = nd.MaNguoiDung) AS SoSoThamGia
            FROM NguoiDung nd
            WHERE 1 = 1
        `;
        const params = [];

        if (tuKhoa) {
            sql += ' AND (nd.HoTen LIKE ? OR nd.Email LIKE ?)';
            params.push(`%${tuKhoa}%`, `%${tuKhoa}%`);
        }
        if (trangThai === 'active') sql += ' AND nd.DangHoatDong = 1';
        if (trangThai === 'locked') sql += ' AND nd.DangHoatDong = 0';

        sql += ' ORDER BY nd.NgayTao DESC LIMIT ? OFFSET ?';
        params.push(Number(soDong), (Number(trang) - 1) * Number(soDong));

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách người dùng' });
    }
};

exports.doiTrangThaiNguoiDung = async (req, res) => {
    const { id } = req.params;
    const { dangHoatDong } = req.body;

    if (dangHoatDong === undefined) {
        return res.status(400).json({ message: 'Thiếu trạng thái cần cập nhật' });
    }

    try {
        const [target] = await pool.query(
            'SELECT VaiTroHeThong, HoTen FROM NguoiDung WHERE MaNguoiDung = ?',
            [id]
        );
        if (target.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        if (target[0].VaiTroHeThong === 'QuanTriVien') {
            return res.status(400).json({ message: 'Không thể khóa tài khoản quản trị viên' });
        }

        await pool.query(
            'UPDATE NguoiDung SET DangHoatDong = ? WHERE MaNguoiDung = ?',
            [dangHoatDong ? 1 : 0, id]
        );

        await ghiNhatKy(req, {
            hanhDong: dangHoatDong ? 'MoKhoaTaiKhoan' : 'KhoaTaiKhoan',
            doiTuong: 'NguoiDung',
            maDoiTuong: id,
            chiTiet: { hoTen: target[0].HoTen },
        });

        res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật trạng thái' });
    }
};

// SỔ CHI TIÊU
exports.layDanhSachSoChiTieu = async (req, res) => {
    const { tuKhoa = '', loai = '' } = req.query;

    try {
        let sql = `
            SELECT s.MaSoChiTieu, s.TenSo, s.LoaiSo, s.DonViTienTe, s.NgayTao, nd.HoTen AS NguoiTao
            FROM SoChiTieu s
            JOIN NguoiDung nd ON nd.MaNguoiDung = s.MaNguoiTao
            WHERE 1 = 1
        `;
        const params = [];
        if (tuKhoa) { sql += ' AND s.TenSo LIKE ?'; params.push(`%${tuKhoa}%`); }
        if (loai) { sql += ' AND s.LoaiSo = ?'; params.push(loai); }
        sql += ' ORDER BY s.NgayTao DESC';

        const [spaces] = await pool.query(sql, params);
        for (const s of spaces) {
            const [members] = await pool.query(
                `SELECT nd.HoTen AS Ten, tv.VaiTro
                 FROM ThanhVienSo tv JOIN NguoiDung nd ON nd.MaNguoiDung = tv.MaNguoiDung
                 WHERE tv.MaSoChiTieu = ?`,
                [s.MaSoChiTieu]
            );
            s.ThanhVien = members;
        }

        res.json(spaces);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách sổ chi tiêu' });
    }
};

// DANH MỤC MẪU
exports.layDanhSachDanhMucMau = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM DanhMucMau ORDER BY Loai ASC, ThuTuSapXep ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh mục mẫu' });
    }
};

exports.themDanhMucMau = async (req, res) => {
    const { tenDanhMuc, bieuTuong, loai } = req.body;
    if (!tenDanhMuc || !loai) {
        return res.status(400).json({ message: 'Thiếu tên danh mục hoặc loại' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO DanhMucMau (TenDanhMuc, BieuTuong, Loai, ThuTuSapXep) VALUES (?, ?, ?, 99)',
            [tenDanhMuc, bieuTuong || '📌', loai]
        );
        await ghiNhatKy(req, {
            hanhDong: 'ThemDanhMucMau', doiTuong: 'DanhMucMau', maDoiTuong: result.insertId,
            chiTiet: { tenDanhMuc, loai },
        });
        res.status(201).json({ maDanhMucMau: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi thêm danh mục mẫu' });
    }
};

exports.xoaDanhMucMau = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM DanhMucMau WHERE MaDanhMucMau = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục mẫu' });
        }
        await ghiNhatKy(req, { hanhDong: 'XoaDanhMucMau', doiTuong: 'DanhMucMau', maDoiTuong: id });
        res.json({ message: 'Đã xóa danh mục mẫu' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa danh mục mẫu' });
    }
};

// GIAO DỊCH
exports.layDanhSachGiaoDichToanHeThong = async (req, res) => {
    const { tuKhoa = '', loai = '', trang = 1, soDong = 20 } = req.query;

    try {
        let sql = `
            SELECT gd.MaGiaoDich, gd.Loai, gd.SoTien, gd.GhiChu, gd.NgayGiaoDich, s.TenSo, nd.HoTen AS NguoiTao
            FROM GiaoDich gd
            JOIN SoChiTieu s ON s.MaSoChiTieu = gd.MaSoChiTieu
            JOIN NguoiDung nd ON nd.MaNguoiDung = gd.MaNguoiTao
            WHERE 1 = 1
        `;
        const params = [];
        if (tuKhoa) {
            sql += ' AND (gd.GhiChu LIKE ? OR s.TenSo LIKE ?)';
            params.push(`%${tuKhoa}%`, `%${tuKhoa}%`);
        }
        if (loai) { sql += ' AND gd.Loai = ?'; params.push(loai); }

        sql += ' ORDER BY gd.NgayGiaoDich DESC, gd.MaGiaoDich DESC LIMIT ? OFFSET ?';
        params.push(Number(soDong), (Number(trang) - 1) * Number(soDong));

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách giao dịch' });
    }
};

// NHẬT KÝ HỆ THỐNG
exports.layNhatKy = async (req, res) => {
    const { trang = 1, soDong = 20 } = req.query;
    try {
        const [rows] = await pool.query(
            `SELECT nk.MaNhatKy, nk.HanhDong, nk.DoiTuong, nk.MaDoiTuong, nk.DiaChiIP, nk.NgayTao,
                    nd.HoTen AS NguoiThucHien
             FROM NhatKyHeThong nk
             LEFT JOIN NguoiDung nd ON nd.MaNguoiDung = nk.MaNguoiDung
             ORDER BY nk.NgayTao DESC, nk.MaNhatKy DESC LIMIT ? OFFSET ?`,
            [Number(soDong), (Number(trang) - 1) * Number(soDong)]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy nhật ký hệ thống' });
    }
};
