const pool = require('../config/database');
const { kiemTraQuyenSo } = require('../middlewares/auth.middleware');

// Báo cáo tài chính theo năm: thu/chi từng tháng + tổng năm + lợi nhuận
exports.baoCaoNam = async (req, res) => {
    const { maSoChiTieu, nam } = req.query;

    if (!maSoChiTieu || !nam) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu hoặc nam' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

        // Thu chi từng tháng trong năm
        const [theoThang] = await pool.query(
            `SELECT MONTH(NgayGiaoDich) AS Thang,
                COALESCE(SUM(CASE WHEN Loai = 'Thu' THEN SoTien ELSE 0 END), 0) AS TongThu,
                COALESCE(SUM(CASE WHEN Loai = 'Chi' THEN SoTien ELSE 0 END), 0) AS TongChi
             FROM GiaoDich
             WHERE MaSoChiTieu = ? AND YEAR(NgayGiaoDich) = ?
             GROUP BY MONTH(NgayGiaoDich)
             ORDER BY Thang`,
            [maSoChiTieu, nam]
        );

        // Tổng cả năm
        const [[tongNam]] = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN Loai = 'Thu' THEN SoTien ELSE 0 END), 0) AS TongThu,
                COALESCE(SUM(CASE WHEN Loai = 'Chi' THEN SoTien ELSE 0 END), 0) AS TongChi
             FROM GiaoDich
             WHERE MaSoChiTieu = ? AND YEAR(NgayGiaoDich) = ?`,
            [maSoChiTieu, nam]
        );

        // Tổng năm trước để so sánh
        const [[namTruoc]] = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN Loai = 'Thu' THEN SoTien ELSE 0 END), 0) AS TongThu,
                COALESCE(SUM(CASE WHEN Loai = 'Chi' THEN SoTien ELSE 0 END), 0) AS TongChi
             FROM GiaoDich
             WHERE MaSoChiTieu = ? AND YEAR(NgayGiaoDich) = ?`,
            [maSoChiTieu, Number(nam) - 1]
        );

        const tongThu = Number(tongNam.TongThu);
        const tongChi = Number(tongNam.TongChi);
        const loiNhuan = tongThu - tongChi;

        const tongThuNT = Number(namTruoc.TongThu);
        const tongChiNT = Number(namTruoc.TongChi);
        const loiNhuanNT = tongThuNT - tongChiNT;

        res.json({
            nam: Number(nam),
            tongThu,
            tongChi,
            loiNhuan,
            namTruoc: {
                nam: Number(nam) - 1,
                tongThu: tongThuNT,
                tongChi: tongChiNT,
                loiNhuan: loiNhuanNT,
            },
            theoThang: theoThang.map((r) => ({
                thang: r.Thang,
                tongThu: Number(r.TongThu),
                tongChi: Number(r.TongChi),
                loiNhuan: Number(r.TongThu) - Number(r.TongChi),
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy báo cáo năm' });
    }
};

exports.tongQuan = async (req, res) => {
    const { maSoChiTieu, thang, nam } = req.query;

    if (!maSoChiTieu || !thang || !nam) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu, thang hoặc nam' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

        const [[tongHop]] = await pool.query(
            `SELECT
        COALESCE(SUM(CASE WHEN Loai = 'Thu' THEN SoTien ELSE 0 END), 0) AS TongThu,
        COALESCE(SUM(CASE WHEN Loai = 'Chi' THEN SoTien ELSE 0 END), 0) AS TongChi
       FROM GiaoDich
       WHERE MaSoChiTieu = ? AND MONTH(NgayGiaoDich) = ? AND YEAR(NgayGiaoDich) = ?`,
            [maSoChiTieu, thang, nam]
        );

        const [theoDanhMuc] = await pool.query(
            `SELECT dm.MaDanhMuc, dm.TenDanhMuc, dm.BieuTuong,
          SUM(gd.SoTien) AS TongTien
       FROM GiaoDich gd
       JOIN DanhMuc dm ON dm.MaDanhMuc = gd.MaDanhMuc
       WHERE gd.MaSoChiTieu = ? AND gd.Loai = 'Chi'
         AND MONTH(gd.NgayGiaoDich) = ? AND YEAR(gd.NgayGiaoDich) = ?
       GROUP BY dm.MaDanhMuc, dm.TenDanhMuc, dm.BieuTuong
       ORDER BY TongTien DESC`,
            [maSoChiTieu, thang, nam]
        );

        res.json({
            tongThu: Number(tongHop.TongThu),
            tongChi: Number(tongHop.TongChi),
            theoDanhMuc: theoDanhMuc.map((r) => ({
                maDanhMuc: r.MaDanhMuc,
                tenDanhMuc: r.TenDanhMuc,
                bieuTuong: r.BieuTuong,
                tongTien: Number(r.TongTien),
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy báo cáo tổng quan' });
    }
};

exports.xuHuong = async (req, res) => {
    const { maSoChiTieu } = req.query;
    const soThang = Math.min(Number(req.query.soThang) || 6, 12);

    if (!maSoChiTieu) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

        const [rows] = await pool.query(
            `SELECT YEAR(NgayGiaoDich) AS Nam, MONTH(NgayGiaoDich) AS Thang,
          COALESCE(SUM(CASE WHEN Loai = 'Thu' THEN SoTien ELSE 0 END), 0) AS TongThu,
          COALESCE(SUM(CASE WHEN Loai = 'Chi' THEN SoTien ELSE 0 END), 0) AS TongChi
       FROM GiaoDich
       WHERE MaSoChiTieu = ?
         AND NgayGiaoDich >= DATE_SUB(LAST_DAY(CURDATE()) + INTERVAL 1 DAY, INTERVAL ? MONTH)
       GROUP BY YEAR(NgayGiaoDich), MONTH(NgayGiaoDich)
       ORDER BY Nam, Thang`,
            [maSoChiTieu, soThang]
        );

        res.json(rows.map((r) => ({
            thang: r.Thang,
            nam: r.Nam,
            tongThu: Number(r.TongThu),
            tongChi: Number(r.TongChi),
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy xu hướng thu chi' });
    }
};

// ======================= BÁO CÁO HẰNG NGÀY =======================
exports.baoCaoNgay = async (req, res) => {
    const { maSoChiTieu, ngay } = req.query;

    if (!maSoChiTieu || !ngay) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu hoặc ngay (yyyy-MM-dd)' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

        // Tổng thu/chi trong ngày
        const [[tongHop]] = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN Loai = 'Thu' THEN SoTien ELSE 0 END), 0) AS TongThu,
                COALESCE(SUM(CASE WHEN Loai = 'Chi' THEN SoTien ELSE 0 END), 0) AS TongChi
             FROM GiaoDich
             WHERE MaSoChiTieu = ? AND DATE(NgayGiaoDich) = ?`,
            [maSoChiTieu, ngay]
        );

        // Chi tiết từng giao dịch trong ngày kèm ảnh bằng chứng
        const [chiTiet] = await pool.query(
            `SELECT gd.MaGiaoDich, gd.Loai, gd.SoTien, gd.GhiChu, gd.NgayGiaoDich, gd.AnhBangChung,
                    dm.TenDanhMuc, dm.BieuTuong AS BieuTuongDanhMuc,
                    v.TenVi, v.BieuTuong AS BieuTuongVi
             FROM GiaoDich gd
             LEFT JOIN DanhMuc dm ON dm.MaDanhMuc = gd.MaDanhMuc
             JOIN Vi v ON v.MaVi = gd.MaVi
             WHERE gd.MaSoChiTieu = ? AND DATE(gd.NgayGiaoDich) = ?
             ORDER BY gd.MaGiaoDich DESC`,
            [maSoChiTieu, ngay]
        );

        // Chi tiêu theo danh mục trong ngày
        const [theoDanhMuc] = await pool.query(
            `SELECT dm.MaDanhMuc, dm.TenDanhMuc, dm.BieuTuong,
                    SUM(gd.SoTien) AS TongTien
             FROM GiaoDich gd
             JOIN DanhMuc dm ON dm.MaDanhMuc = gd.MaDanhMuc
             WHERE gd.MaSoChiTieu = ? AND gd.Loai = 'Chi' AND DATE(gd.NgayGiaoDich) = ?
             GROUP BY dm.MaDanhMuc, dm.TenDanhMuc, dm.BieuTuong
             ORDER BY TongTien DESC`,
            [maSoChiTieu, ngay]
        );

        res.json({
            ngay,
            tongThu: Number(tongHop.TongThu),
            tongChi: Number(tongHop.TongChi),
            chenhLech: Number(tongHop.TongThu) - Number(tongHop.TongChi),
            chiTiet: chiTiet.map(r => ({
                maGiaoDich: r.MaGiaoDich,
                loai: r.Loai,
                soTien: Number(r.SoTien),
                ghiChu: r.GhiChu,
                ngayGiaoDich: r.NgayGiaoDich,
                anhBangChung: r.AnhBangChung || null,
                tenDanhMuc: r.TenDanhMuc,
                bieuTuongDanhMuc: r.BieuTuongDanhMuc,
                tenVi: r.TenVi,
                bieuTuongVi: r.BieuTuongVi,
            })),
            theoDanhMuc: theoDanhMuc.map(r => ({
                maDanhMuc: r.MaDanhMuc,
                tenDanhMuc: r.TenDanhMuc,
                bieuTuong: r.BieuTuong,
                tongTien: Number(r.TongTien),
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy báo cáo ngày' });
    }
};

// Lấy danh sách các ngày có giao dịch trong tháng (cho calendar)
exports.cacNgayTrongThang = async (req, res) => {
    const { maSoChiTieu, thang, nam } = req.query;

    if (!maSoChiTieu || !thang || !nam) {
        return res.status(400).json({ message: 'Thiếu tham số' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

        const [rows] = await pool.query(
            `SELECT DATE(NgayGiaoDich) AS Ngay,
                    COALESCE(SUM(CASE WHEN Loai = 'Thu' THEN SoTien ELSE 0 END), 0) AS TongThu,
                    COALESCE(SUM(CASE WHEN Loai = 'Chi' THEN SoTien ELSE 0 END), 0) AS TongChi
             FROM GiaoDich
             WHERE MaSoChiTieu = ? AND MONTH(NgayGiaoDich) = ? AND YEAR(NgayGiaoDich) = ?
             GROUP BY DATE(NgayGiaoDich)
             ORDER BY Ngay`,
            [maSoChiTieu, thang, nam]
        );

        res.json(rows.map(r => ({
            ngay: r.Ngay,
            tongThu: Number(r.TongThu),
            tongChi: Number(r.TongChi),
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách ngày' });
    }
};
