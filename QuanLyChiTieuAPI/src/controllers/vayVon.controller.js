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
            `SELECT v.*, vi.TenVi, vi.BieuTuong AS BieuTuongVi
             FROM VayVon v
             LEFT JOIN Vi vi ON vi.MaVi = v.MaVi
             WHERE v.MaSoChiTieu = ? AND v.LoaiVay = 'VayNganHang'
             ORDER BY v.NgayVay DESC`,
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
            maVi: r.MaVi ?? null,
            tenVi: r.TenVi ?? null,
            bieuTuongVi: r.BieuTuongVi ?? null,
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

        // Lưu maVi vào bảng VayVon để sau tất toán có thể hoàn tiền
        const [result] = await conn.query(
            `INSERT INTO VayVon (MaSoChiTieu, LoaiVay, TenKhoanVay, SoTienGoc, LaiSuatNam, KyHanThang, NgayVay, GhiChu, TrangThai, NgayTraLaiHangThang, MaVi)
             VALUES (?, 'VayNganHang', ?, ?, ?, ?, ?, ?, 'DangVay', ?, ?)`,
            [maSoChiTieu, tenKhoanVay.trim(), Number(soTienGoc), Number(laiSuatNam), Number(kyHanThang), ngayVay, ghiChu || null, ngayTraLaiHangThang || null, maVi || null]
        );
        const maVayMoi = result.insertId;

        // Nếu người dùng chọn ví nhận tiền vay -> tạo giao dịch Thu vào ví đó
        if (maVi) {
            const [viRows] = await conn.query('SELECT MaVi FROM Vi WHERE MaVi = ? AND MaSoChiTieu = ? AND DaLuuTru = 0', [maVi, maSoChiTieu]);
            if (viRows.length > 0) {
                const [dmRows] = await conn.query('SELECT MaDanhMuc FROM DanhMuc WHERE MaSoChiTieu = ? AND Loai = "Thu" ORDER BY (TenDanhMuc = "Thu nhập khác") DESC LIMIT 1', [maSoChiTieu]);
                const maDanhMuc = dmRows.length > 0 ? dmRows[0].MaDanhMuc : null;
                await conn.query(
                    `INSERT INTO GiaoDich (MaSoChiTieu, MaVi, MaDanhMuc, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
                     VALUES (?, ?, ?, ?, 'Thu', ?, ?, ?)`,
                    [maSoChiTieu, maVi, maDanhMuc, maNguoiTao, Number(soTienGoc), `Giải ngân khoản vay: ${tenKhoanVay.trim()}`, ngayVay]
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
    const maNguoiTao = req.nguoiDung.maNguoiDung;

    let conn;
    try {
        const [vayRows] = await pool.query(
            `SELECT v.* FROM VayVon v
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = v.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE v.MaVay = ? AND v.LoaiVay = 'VayNganHang'`,
            [maNguoiTao, id]
        );
        if (vayRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy khoản vay hoặc bạn không có quyền sửa.' });

        const vay = vayRows[0];
        const maSoChiTieu = vay.MaSoChiTieu;
        const trangThaiMoi = trangThai !== undefined ? trangThai : vay.TrangThai;

        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Xử lý tất toán: tạo giao dịch Chi hoàn trả từ ví đã vay vào
        if (trangThaiMoi === 'DaTatToan' && vay.TrangThai === 'DangVay' && vay.MaVi) {
            const ngayTatToan = new Date().toISOString().slice(0, 10);
            const [dmRows] = await conn.query('SELECT MaDanhMuc FROM DanhMuc WHERE MaSoChiTieu = ? AND Loai = "Chi" ORDER BY (TenDanhMuc = "Khác") DESC LIMIT 1', [maSoChiTieu]);
            const maDanhMuc = dmRows.length > 0 ? dmRows[0].MaDanhMuc : null;
            await conn.query(
                `INSERT INTO GiaoDich (MaSoChiTieu, MaVi, MaDanhMuc, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
                 VALUES (?, ?, ?, ?, 'Chi', ?, ?, ?)`,
                [maSoChiTieu, vay.MaVi, maDanhMuc, maNguoiTao, Number(vay.SoTienGoc),
                 `Tất toán khoản vay: ${vay.TenKhoanVay}`, ngayTatToan]
            );
        }

        // Hoàn tác tất toán: tạo lại giao dịch Thu
        if (trangThaiMoi === 'DangVay' && vay.TrangThai === 'DaTatToan' && vay.MaVi) {
            const ngayHoanTac = new Date().toISOString().slice(0, 10);
            const [dmRows] = await conn.query('SELECT MaDanhMuc FROM DanhMuc WHERE MaSoChiTieu = ? AND Loai = "Thu" ORDER BY (TenDanhMuc = "Thu nhập khác") DESC LIMIT 1', [maSoChiTieu]);
            const maDanhMuc = dmRows.length > 0 ? dmRows[0].MaDanhMuc : null;
            await conn.query(
                `INSERT INTO GiaoDich (MaSoChiTieu, MaVi, MaDanhMuc, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
                 VALUES (?, ?, ?, ?, 'Thu', ?, ?, ?)`,
                [maSoChiTieu, vay.MaVi, maDanhMuc, maNguoiTao, Number(vay.SoTienGoc),
                 `Hoàn tác tất toán khoản vay: ${vay.TenKhoanVay}`, ngayHoanTac]
            );
        }

        const tenMoi = tenKhoanVay !== undefined ? tenKhoanVay : vay.TenKhoanVay;
        const gocMoi = soTienGoc !== undefined ? Number(soTienGoc) : Number(vay.SoTienGoc);
        const laiMoi = laiSuatNam !== undefined ? Number(laiSuatNam) : Number(vay.LaiSuatNam);
        const kyHanMoi = kyHanThang !== undefined ? Number(kyHanThang) : Number(vay.KyHanThang);
        const ngayMoi = ngayVay !== undefined ? ngayVay : vay.NgayVay;
        const ghiChuMoi = ghiChu !== undefined ? (ghiChu || null) : (vay.GhiChu || null);
        const hanTraLaiMoi = ngayTraLaiHangThang !== undefined ? (ngayTraLaiHangThang || null) : (vay.NgayTraLaiHangThang || null);

        await conn.query(
            `UPDATE VayVon SET TenKhoanVay=?, SoTienGoc=?, LaiSuatNam=?, KyHanThang=?, NgayVay=?, GhiChu=?, TrangThai=?, NgayTraLaiHangThang=?
             WHERE MaVay=? AND LoaiVay='VayNganHang'`,
            [tenMoi, gocMoi, laiMoi, kyHanMoi, ngayMoi, ghiChuMoi, trangThaiMoi, hanTraLaiMoi, id]
        );

        await conn.commit();
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật khoản vay' });
    } finally {
        if (conn) conn.release();
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
            `SELECT v.*, vi.TenVi, vi.BieuTuong AS BieuTuongVi
             FROM VayVon v
             LEFT JOIN Vi vi ON vi.MaVi = v.MaVi
             WHERE v.MaSoChiTieu = ? AND v.LoaiVay = 'ChoVay'
             ORDER BY v.NgayVay DESC`,
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
            maVi: r.MaVi ?? null,
            tenVi: r.TenVi ?? null,
            bieuTuongVi: r.BieuTuongVi ?? null,
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

        // Lưu maVi vào bảng VayVon để sau tất toán có thể thu hồi tiền về ví
        const [result] = await conn.query(
            `INSERT INTO VayVon (MaSoChiTieu, LoaiVay, TenKhoanVay, SoTienGoc, LaiSuatNam, KyHanThang, NgayVay, GhiChu, TrangThai, NgayTraLaiHangThang, MaVi)
             VALUES (?, 'ChoVay', ?, ?, ?, ?, ?, ?, 'DangVay', ?, ?)`,
            [maSoChiTieu, tenKhoanVay.trim(), Number(soTienGoc), Number(laiSuatNam), Number(kyHanThang), ngayVay, ghiChu || null, ngayTraLaiHangThang || null, maVi || null]
        );
        const maVayMoi = result.insertId;

        // Nếu người dùng chọn ví xuất tiền cho vay -> tạo giao dịch Chi từ ví đó
        if (maVi) {
            const [viRows] = await conn.query('SELECT MaVi FROM Vi WHERE MaVi = ? AND MaSoChiTieu = ? AND DaLuuTru = 0', [maVi, maSoChiTieu]);
            if (viRows.length > 0) {
                const [dmRows] = await conn.query('SELECT MaDanhMuc FROM DanhMuc WHERE MaSoChiTieu = ? AND Loai = "Chi" ORDER BY (TenDanhMuc = "Khác") DESC LIMIT 1', [maSoChiTieu]);
                const maDanhMuc = dmRows.length > 0 ? dmRows[0].MaDanhMuc : null;
                await conn.query(
                    `INSERT INTO GiaoDich (MaSoChiTieu, MaVi, MaDanhMuc, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
                     VALUES (?, ?, ?, ?, 'Chi', ?, ?, ?)`,
                    [maSoChiTieu, maVi, maDanhMuc, maNguoiTao, Number(soTienGoc), `Cho vay: ${tenKhoanVay.trim()}`, ngayVay]
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
    const maNguoiTao = req.nguoiDung.maNguoiDung;

    let conn;
    try {
        const [vayRows] = await pool.query(
            `SELECT v.* FROM VayVon v
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = v.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE v.MaVay = ? AND v.LoaiVay = 'ChoVay'`,
            [maNguoiTao, id]
        );
        if (vayRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy khoản cho vay hoặc bạn không có quyền sửa.' });

        const vay = vayRows[0];
        const maSoChiTieu = vay.MaSoChiTieu;
        const trangThaiMoi = trangThai !== undefined ? trangThai : vay.TrangThai;

        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Xử lý tất toán cho vay: thu hồi tiền về ví (tạo giao dịch Thu)
        if (trangThaiMoi === 'DaTatToan' && vay.TrangThai === 'DangVay' && vay.MaVi) {
            const ngayTatToan = new Date().toISOString().slice(0, 10);
            const [dmRows] = await conn.query('SELECT MaDanhMuc FROM DanhMuc WHERE MaSoChiTieu = ? AND Loai = "Thu" ORDER BY (TenDanhMuc = "Thu nhập khác") DESC LIMIT 1', [maSoChiTieu]);
            const maDanhMuc = dmRows.length > 0 ? dmRows[0].MaDanhMuc : null;
            await conn.query(
                `INSERT INTO GiaoDich (MaSoChiTieu, MaVi, MaDanhMuc, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
                 VALUES (?, ?, ?, ?, 'Thu', ?, ?, ?)`,
                [maSoChiTieu, vay.MaVi, maDanhMuc, maNguoiTao, Number(vay.SoTienGoc),
                 `Thu hồi khoản cho vay: ${vay.TenKhoanVay}`, ngayTatToan]
            );
        }

        // Hoàn tác tất toán: trừ lại tiền ví (tạo giao dịch Chi)
        if (trangThaiMoi === 'DangVay' && vay.TrangThai === 'DaTatToan' && vay.MaVi) {
            const ngayHoanTac = new Date().toISOString().slice(0, 10);
            const [dmRows] = await conn.query('SELECT MaDanhMuc FROM DanhMuc WHERE MaSoChiTieu = ? AND Loai = "Chi" ORDER BY (TenDanhMuc = "Khác") DESC LIMIT 1', [maSoChiTieu]);
            const maDanhMuc = dmRows.length > 0 ? dmRows[0].MaDanhMuc : null;
            await conn.query(
                `INSERT INTO GiaoDich (MaSoChiTieu, MaVi, MaDanhMuc, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
                 VALUES (?, ?, ?, ?, 'Chi', ?, ?, ?)`,
                [maSoChiTieu, vay.MaVi, maDanhMuc, maNguoiTao, Number(vay.SoTienGoc),
                 `Hoàn tác tất toán cho vay: ${vay.TenKhoanVay}`, ngayHoanTac]
            );
        }

        const tenMoi = tenKhoanVay !== undefined ? tenKhoanVay : vay.TenKhoanVay;
        const gocMoi = soTienGoc !== undefined ? Number(soTienGoc) : Number(vay.SoTienGoc);
        const laiMoi = laiSuatNam !== undefined ? Number(laiSuatNam) : Number(vay.LaiSuatNam);
        const kyHanMoi = kyHanThang !== undefined ? Number(kyHanThang) : Number(vay.KyHanThang);
        const ngayMoi = ngayVay !== undefined ? ngayVay : vay.NgayVay;
        const ghiChuMoi = ghiChu !== undefined ? (ghiChu || null) : (vay.GhiChu || null);
        const hanTraLaiMoi = ngayTraLaiHangThang !== undefined ? (ngayTraLaiHangThang || null) : (vay.NgayTraLaiHangThang || null);

        await conn.query(
            `UPDATE VayVon SET TenKhoanVay=?, SoTienGoc=?, LaiSuatNam=?, KyHanThang=?, NgayVay=?, GhiChu=?, TrangThai=?, NgayTraLaiHangThang=?
             WHERE MaVay=? AND LoaiVay='ChoVay'`,
            [tenMoi, gocMoi, laiMoi, kyHanMoi, ngayMoi, ghiChuMoi, trangThaiMoi, hanTraLaiMoi, id]
        );

        await conn.commit();
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật khoản cho vay' });
    } finally {
        if (conn) conn.release();
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
