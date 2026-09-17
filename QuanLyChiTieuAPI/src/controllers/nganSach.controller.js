const pool = require('../config/database');

// Lấy ngân sách theo tháng, kèm số tiền đã chi thực tế của từng danh mục
// (tính từ bảng GiaoDich) để tiện hiển thị thanh tiến độ ở app.
// Hiện tại chỉ hỗ trợ ngân sách theo chu kỳ HangThang.
exports.layDanhSach = async (req, res) => {
    const { maSoChiTieu, thang, nam } = req.query;

    if (!maSoChiTieu || !thang || !nam) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu, thang hoặc nam' });
    }

    try {
        const [rows] = await pool.query(
            `SELECT ns.*, dm.TenDanhMuc, dm.BieuTuong,
        COALESCE((
          SELECT SUM(gd.SoTien) FROM GiaoDich gd
          WHERE gd.MaDanhMuc = ns.MaDanhMuc
            AND gd.Loai = 'Chi'
            AND MONTH(gd.NgayGiaoDich) = ns.ThangApDung
            AND YEAR(gd.NgayGiaoDich) = ns.NamApDung
        ), 0) AS DaChi
      FROM NganSach ns
      JOIN DanhMuc dm ON dm.MaDanhMuc = ns.MaDanhMuc
      WHERE ns.MaSoChiTieu = ? AND ns.ChuKy = 'HangThang'
        AND ns.ThangApDung = ? AND ns.NamApDung = ?
      ORDER BY dm.TenDanhMuc`,
            [maSoChiTieu, thang, nam]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy ngân sách' });
    }
};

exports.taoMoi = async (req, res) => {
    const { maSoChiTieu, maDanhMuc, soTien, thangApDung, namApDung, nguongCanhBao } = req.body;

    if (!maSoChiTieu || !maDanhMuc || !soTien || !thangApDung || !namApDung) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO NganSach
       (MaSoChiTieu, MaDanhMuc, SoTien, ChuKy, ThangApDung, NamApDung, NguongCanhBao)
       VALUES (?, ?, ?, 'HangThang', ?, ?, ?)`,
            [maSoChiTieu, maDanhMuc, soTien, thangApDung, namApDung, nguongCanhBao || 80]
        );
        res.status(201).json({ maNganSach: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Danh mục này đã có ngân sách cho tháng đã chọn' });
        }
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo ngân sách' });
    }
};

exports.capNhat = async (req, res) => {
    const { id } = req.params;
    const { soTien, nguongCanhBao } = req.body;

    if (!soTien) {
        return res.status(400).json({ message: 'Thiếu soTien' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE NganSach SET SoTien = ?, NguongCanhBao = ? WHERE MaNganSach = ?',
            [soTien, nguongCanhBao || 80, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ngân sách' });
        }
        res.json({ message: 'Đã cập nhật ngân sách' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật ngân sách' });
    }
};

exports.xoa = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM NganSach WHERE MaNganSach = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ngân sách' });
        }
        res.json({ message: 'Đã xoá ngân sách' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi xoá ngân sách' });
    }
};
