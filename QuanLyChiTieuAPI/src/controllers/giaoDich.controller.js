const pool = require('../config/database');

// Lấy danh sách giao dịch, có thể lọc theo tháng/năm
exports.layDanhSach = async (req, res) => {
    const { maSoChiTieu, thang, nam } = req.query;

    if (!maSoChiTieu) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu' });
    }

    try {
        let sql = `
      SELECT gd.*, dm.TenDanhMuc, dm.BieuTuong AS BieuTuongDanhMuc, v.TenVi
      FROM GiaoDich gd
      LEFT JOIN DanhMuc dm ON dm.MaDanhMuc = gd.MaDanhMuc
      JOIN Vi v ON v.MaVi = gd.MaVi
      WHERE gd.MaSoChiTieu = ?
    `;
        const params = [maSoChiTieu];

        if (thang && nam) {
            sql += ' AND MONTH(gd.NgayGiaoDich) = ? AND YEAR(gd.NgayGiaoDich) = ?';
            params.push(thang, nam);
        } else if (nam) {
            sql += ' AND YEAR(gd.NgayGiaoDich) = ?';
            params.push(nam);
        }

        sql += ' ORDER BY gd.NgayGiaoDich DESC, gd.MaGiaoDich DESC';

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy giao dịch' });
    }
};

exports.taoMoi = async (req, res) => {
    const { maSoChiTieu, maVi, maViDoi, maDanhMuc, loai, soTien, ghiChu, ngayGiaoDich } = req.body;
    const maNguoiTao = req.nguoiDung.maNguoiDung;

    if (!maSoChiTieu || !maVi || !loai || !soTien || !ngayGiaoDich) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (loai === 'ChuyenKhoan' && !maViDoi) {
        return res.status(400).json({ message: 'Giao dịch chuyển khoản cần có ví đích' });
    }

    if ((loai === 'Thu' || loai === 'Chi') && !maDanhMuc) {
        return res.status(400).json({ message: 'Giao dịch thu/chi cần có danh mục' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO GiaoDich
       (MaSoChiTieu, MaVi, MaViDoi, MaDanhMuc, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [maSoChiTieu, maVi, maViDoi || null, maDanhMuc || null, maNguoiTao, loai, soTien, ghiChu || null, ngayGiaoDich]
        );
        res.status(201).json({ maGiaoDich: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo giao dịch' });
    }
};

exports.xoa = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM GiaoDich WHERE MaGiaoDich = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
        }
        res.json({ message: 'Đã xoá giao dịch' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi xoá giao dịch' });
    }
};

exports.capNhat = async (req, res) => {
    const { id } = req.params;
    const { maVi, maViDoi, maDanhMuc, loai, soTien, ghiChu, ngayGiaoDich } = req.body;

    if (!maVi || !loai || !soTien || !ngayGiaoDich) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE GiaoDich
             SET MaVi = ?, MaViDoi = ?, MaDanhMuc = ?, Loai = ?, SoTien = ?, GhiChu = ?, NgayGiaoDich = ?
             WHERE MaGiaoDich = ?`,
            [maVi, maViDoi || null, maDanhMuc || null, loai, soTien, ghiChu || null, ngayGiaoDich, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
        }
        res.json({ message: 'Cập nhật giao dịch thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật giao dịch' });
    }
};