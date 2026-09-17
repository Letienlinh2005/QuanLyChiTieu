const pool = require('../config/database');

exports.tongQuan = async (req, res) => {
    const { maSoChiTieu, thang, nam } = req.query;

    if (!maSoChiTieu || !thang || !nam) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu, thang hoặc nam' });
    }

    try {
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
