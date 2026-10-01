const pool = require('../config/database');

// ======================= VAY NGÂN HÀNG =======================

// Lấy danh sách khoản vay
exports.layDanhSachVay = async (req, res) => {
    const { maSoChiTieu } = req.query;
    if (!maSoChiTieu) return res.status(400).json({ message: 'Thiếu maSoChiTieu' });

    try {
        const [rows] = await pool.query(
            `SELECT * FROM VayVon WHERE MaSoChiTieu = ? AND LoaiVay = 'VayNganHang' ORDER BY NgayVay DESC`,
            [maSoChiTieu]
        );
        res.json(rows.map(r => ({
            maVay: r.MaVay,
            tenKhoanVay: r.TenKhoanVay,
            soTienGoc: Number(r.SoTienGoc),
            laiSuatNam: Number(r.LaiSuatNam),
            kyHanThang: r.KyHanThang,
            ngayVay: r.NgayVay,
            ghiChu: r.GhiChu,
            trangThai: r.TrangThai,
            ngayTraLaiHangThang: r.NgayTraLaiHangThang ?? null,
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Thêm khoản vay mới
exports.themVay = async (req, res) => {
    const { maSoChiTieu, tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu, ngayTraLaiHangThang } = req.body;

    if (!maSoChiTieu || !tenKhoanVay || !soTienGoc || !laiSuatNam || !kyHanThang || !ngayVay) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO VayVon (MaSoChiTieu, LoaiVay, TenKhoanVay, SoTienGoc, LaiSuatNam, KyHanThang, NgayVay, GhiChu, TrangThai, NgayTraLaiHangThang)
             VALUES (?, 'VayNganHang', ?, ?, ?, ?, ?, ?, 'DangVay', ?)`,
            [maSoChiTieu, tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu || null, ngayTraLaiHangThang || null]
        );
        res.status(201).json({ maVay: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi thêm khoản vay' });
    }
};

// Cập nhật trạng thái / thông tin vay
exports.capNhatVay = async (req, res) => {
    const { id } = req.params;
    const { tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu, trangThai, ngayTraLaiHangThang } = req.body;

    try {
        const [result] = await pool.query(
            `UPDATE VayVon SET TenKhoanVay=?, SoTienGoc=?, LaiSuatNam=?, KyHanThang=?, NgayVay=?, GhiChu=?, TrangThai=?, NgayTraLaiHangThang=?
             WHERE MaVay=? AND LoaiVay='VayNganHang'`,
            [tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu || null, trangThai, ngayTraLaiHangThang || null, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy khoản vay' });
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Xoá khoản vay
exports.xoaVay = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(`DELETE FROM VayVon WHERE MaVay = ? AND LoaiVay = 'VayNganHang'`, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json({ message: 'Đã xoá' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// ======================= CHO VAY =======================

// Lấy danh sách cho vay
exports.layDanhSachChoVay = async (req, res) => {
    const { maSoChiTieu } = req.query;
    if (!maSoChiTieu) return res.status(400).json({ message: 'Thiếu maSoChiTieu' });

    try {
        const [rows] = await pool.query(
            `SELECT * FROM VayVon WHERE MaSoChiTieu = ? AND LoaiVay = 'ChoVay' ORDER BY NgayVay DESC`,
            [maSoChiTieu]
        );
        res.json(rows.map(r => ({
            maVay: r.MaVay,
            tenKhoanVay: r.TenKhoanVay,
            soTienGoc: Number(r.SoTienGoc),
            laiSuatNam: Number(r.LaiSuatNam),
            kyHanThang: r.KyHanThang,
            ngayVay: r.NgayVay,
            ghiChu: r.GhiChu,
            trangThai: r.TrangThai,
            ngayTraLaiHangThang: r.NgayTraLaiHangThang ?? null,
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Thêm khoản cho vay mới
exports.themChoVay = async (req, res) => {
    const { maSoChiTieu, tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu, ngayTraLaiHangThang } = req.body;

    if (!maSoChiTieu || !tenKhoanVay || !soTienGoc || !laiSuatNam || !kyHanThang || !ngayVay) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO VayVon (MaSoChiTieu, LoaiVay, TenKhoanVay, SoTienGoc, LaiSuatNam, KyHanThang, NgayVay, GhiChu, TrangThai, NgayTraLaiHangThang)
             VALUES (?, 'ChoVay', ?, ?, ?, ?, ?, ?, 'DangVay', ?)`,
            [maSoChiTieu, tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu || null, ngayTraLaiHangThang || null]
        );
        res.status(201).json({ maVay: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi thêm khoản cho vay' });
    }
};

// Cập nhật khoản cho vay
exports.capNhatChoVay = async (req, res) => {
    const { id } = req.params;
    const { tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu, trangThai, ngayTraLaiHangThang } = req.body;

    try {
        const [result] = await pool.query(
            `UPDATE VayVon SET TenKhoanVay=?, SoTienGoc=?, LaiSuatNam=?, KyHanThang=?, NgayVay=?, GhiChu=?, TrangThai=?, NgayTraLaiHangThang=?
             WHERE MaVay=? AND LoaiVay='ChoVay'`,
            [tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu || null, trangThai, ngayTraLaiHangThang || null, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Xoá khoản cho vay
exports.xoaChoVay = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(`DELETE FROM VayVon WHERE MaVay = ? AND LoaiVay = 'ChoVay'`, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json({ message: 'Đã xoá' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
