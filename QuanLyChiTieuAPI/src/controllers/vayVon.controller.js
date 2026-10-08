const pool = require('../config/database');
const { kiemTraQuyenSo } = require('../middlewares/auth.middleware');

// ======================= VAY NGÂN HÀNG =======================

// Lấy danh sách khoản vay
exports.layDanhSachVay = async (req, res) => {
    const { maSoChiTieu } = req.query;
    if (!maSoChiTieu) return res.status(400).json({ message: 'Thiếu maSoChiTieu' });

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

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
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách vay' });
    }
};

// Thêm khoản vay mới (hỗ trợ lãi suất = 0 và liên kết ví nhận tiền vay)
exports.themVay = async (req, res) => {
    const { maSoChiTieu, tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu, ngayTraLaiHangThang, maVi } = req.body;
    const maNguoiTao = req.nguoiDung.maNguoiDung;

    if (!maSoChiTieu || !tenKhoanVay || !tenKhoanVay.trim() || !soTienGoc || laiSuatNam === undefined || laiSuatNam === null || !kyHanThang || !ngayVay) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (Number(soTienGoc) <= 0 || Number(laiSuatNam) < 0 || Number(kyHanThang) <= 0) {
        return res.status(400).json({ message: 'Số tiền gốc, kỳ hạn phải lớn hơn 0 và lãi suất không được âm.' });
    }

    let conn;
    try {
        const quyen = await kiemTraQuyenSo(maNguoiTao, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền thêm khoản vay vào sổ này.' });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO VayVon (MaSoChiTieu, LoaiVay, TenKhoanVay, SoTienGoc, LaiSuatNam, KyHanThang, NgayVay, GhiChu, TrangThai, NgayTraLaiHangThang)
             VALUES (?, 'VayNganHang', ?, ?, ?, ?, ?, ?, 'DangVay', ?)`,
            [maSoChiTieu, tenKhoanVay.trim(), Number(soTienGoc), Number(laiSuatNam), Number(kyHanThang), ngayVay, ghiChu || null, ngayTraLaiHangThang || null]
        );
        const maVayMoi = result.insertId;

        // Nếu người dùng chọn ví nhận tiền vay -> tạo giao dịch Thu vào ví đó
        if (maVi) {
            const [viRows] = await conn.query('SELECT MaVi FROM Vi WHERE MaVi = ? AND MaSoChiTieu = ? AND DaLuuTru = 0', [maVi, maSoChiTieu]);
            if (viRows.length > 0) {
                await conn.query(
                    `INSERT INTO GiaoDich (MaSoChiTieu, MaVi, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
                     VALUES (?, ?, ?, 'Thu', ?, ?, ?)`,
                    [maSoChiTieu, maVi, maNguoiTao, Number(soTienGoc), `Giải ngân khoản vay: ${tenKhoanVay.trim()}`, ngayVay]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ maVay: maVayMoi });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi thêm khoản vay' });
    } finally {
        if (conn) conn.release();
    }
};

// Cập nhật trạng thái / thông tin vay
exports.capNhatVay = async (req, res) => {
    const { id } = req.params;
    const { tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu, trangThai, ngayTraLaiHangThang } = req.body;

    try {
        const [vayRows] = await pool.query(
            `SELECT v.MaVay FROM VayVon v
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = v.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE v.MaVay = ? AND v.LoaiVay = 'VayNganHang'`,
            [req.nguoiDung.maNguoiDung, id]
        );
        if (vayRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy khoản vay hoặc bạn không có quyền sửa.' });

        const [result] = await pool.query(
            `UPDATE VayVon SET TenKhoanVay=?, SoTienGoc=?, LaiSuatNam=?, KyHanThang=?, NgayVay=?, GhiChu=?, TrangThai=?, NgayTraLaiHangThang=?
             WHERE MaVay=? AND LoaiVay='VayNganHang'`,
            [tenKhoanVay, Number(soTienGoc), Number(laiSuatNam), Number(kyHanThang), ngayVay, ghiChu || null, trangThai, ngayTraLaiHangThang || null, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy khoản vay' });
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật khoản vay' });
    }
};

// Xoá khoản vay
exports.xoaVay = async (req, res) => {
    const { id } = req.params;
    try {
        const [vayRows] = await pool.query(
            `SELECT v.MaVay FROM VayVon v
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = v.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE v.MaVay = ? AND v.LoaiVay = 'VayNganHang'`,
            [req.nguoiDung.maNguoiDung, id]
        );
        if (vayRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hoặc bạn không có quyền xóa.' });

        await pool.query(`DELETE FROM VayVon WHERE MaVay = ? AND LoaiVay = 'VayNganHang'`, [id]);
        res.json({ message: 'Đã xoá' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa khoản vay' });
    }
};

// ======================= CHO VAY =======================

// Lấy danh sách cho vay
exports.layDanhSachChoVay = async (req, res) => {
    const { maSoChiTieu } = req.query;
    if (!maSoChiTieu) return res.status(400).json({ message: 'Thiếu maSoChiTieu' });

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

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
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách cho vay' });
    }
};

// Thêm khoản cho vay mới (hỗ trợ lãi suất = 0 và liên kết ví nguồn trừ tiền)
exports.themChoVay = async (req, res) => {
    const { maSoChiTieu, tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu, ngayTraLaiHangThang, maVi } = req.body;
    const maNguoiTao = req.nguoiDung.maNguoiDung;

    if (!maSoChiTieu || !tenKhoanVay || !tenKhoanVay.trim() || !soTienGoc || laiSuatNam === undefined || laiSuatNam === null || !kyHanThang || !ngayVay) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (Number(soTienGoc) <= 0 || Number(laiSuatNam) < 0 || Number(kyHanThang) <= 0) {
        return res.status(400).json({ message: 'Số tiền gốc, kỳ hạn phải lớn hơn 0 và lãi suất không được âm.' });
    }

    let conn;
    try {
        const quyen = await kiemTraQuyenSo(maNguoiTao, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền thêm khoản cho vay vào sổ này.' });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO VayVon (MaSoChiTieu, LoaiVay, TenKhoanVay, SoTienGoc, LaiSuatNam, KyHanThang, NgayVay, GhiChu, TrangThai, NgayTraLaiHangThang)
             VALUES (?, 'ChoVay', ?, ?, ?, ?, ?, ?, 'DangVay', ?)`,
            [maSoChiTieu, tenKhoanVay.trim(), Number(soTienGoc), Number(laiSuatNam), Number(kyHanThang), ngayVay, ghiChu || null, ngayTraLaiHangThang || null]
        );
        const maVayMoi = result.insertId;

        // Nếu người dùng chọn ví xuất tiền cho vay -> tạo giao dịch Chi từ ví đó
        if (maVi) {
            const [viRows] = await conn.query('SELECT MaVi FROM Vi WHERE MaVi = ? AND MaSoChiTieu = ? AND DaLuuTru = 0', [maVi, maSoChiTieu]);
            if (viRows.length > 0) {
                await conn.query(
                    `INSERT INTO GiaoDich (MaSoChiTieu, MaVi, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
                     VALUES (?, ?, ?, 'Chi', ?, ?, ?)`,
                    [maSoChiTieu, maVi, maNguoiTao, Number(soTienGoc), `Cho vay: ${tenKhoanVay.trim()}`, ngayVay]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ maVay: maVayMoi });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi thêm khoản cho vay' });
    } finally {
        if (conn) conn.release();
    }
};

// Cập nhật khoản cho vay
exports.capNhatChoVay = async (req, res) => {
    const { id } = req.params;
    const { tenKhoanVay, soTienGoc, laiSuatNam, kyHanThang, ngayVay, ghiChu, trangThai, ngayTraLaiHangThang } = req.body;

    try {
        const [vayRows] = await pool.query(
            `SELECT v.MaVay FROM VayVon v
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = v.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE v.MaVay = ? AND v.LoaiVay = 'ChoVay'`,
            [req.nguoiDung.maNguoiDung, id]
        );
        if (vayRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy khoản cho vay hoặc bạn không có quyền sửa.' });

        const [result] = await pool.query(
            `UPDATE VayVon SET TenKhoanVay=?, SoTienGoc=?, LaiSuatNam=?, KyHanThang=?, NgayVay=?, GhiChu=?, TrangThai=?, NgayTraLaiHangThang=?
             WHERE MaVay=? AND LoaiVay='ChoVay'`,
            [tenKhoanVay, Number(soTienGoc), Number(laiSuatNam), Number(kyHanThang), ngayVay, ghiChu || null, trangThai, ngayTraLaiHangThang || null, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật khoản cho vay' });
    }
};

// Xoá khoản cho vay
exports.xoaChoVay = async (req, res) => {
    const { id } = req.params;
    try {
        const [vayRows] = await pool.query(
            `SELECT v.MaVay FROM VayVon v
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = v.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE v.MaVay = ? AND v.LoaiVay = 'ChoVay'`,
            [req.nguoiDung.maNguoiDung, id]
        );
        if (vayRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hoặc bạn không có quyền xóa.' });

        await pool.query(`DELETE FROM VayVon WHERE MaVay = ? AND LoaiVay = 'ChoVay'`, [id]);
        res.json({ message: 'Đã xoá' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa khoản cho vay' });
    }
};

