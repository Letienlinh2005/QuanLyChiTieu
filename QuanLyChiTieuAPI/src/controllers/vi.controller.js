const pool = require('../config/database');

exports.layDanhSach = async (req, res) => {
    const {maSoChiTieu} = req.query;
    if (!maSoChiTieu) {
        return res.status(400).json({ message: 'Vui lòng cung cấp mã sổ chi tiêu.' });
    }
    try{
        const sql = `
            SELECT v.*, 
                   v.SoDuBanDau 
                   + COALESCE(SUM(CASE WHEN gd.Loai = 'Thu' THEN gd.SoTien ELSE 0 END), 0) 
                   - COALESCE(SUM(CASE WHEN gd.Loai = 'Chi' THEN gd.SoTien ELSE 0 END), 0) 
                   - COALESCE(SUM(CASE WHEN gd.Loai = 'ChuyenKhoan' AND gd.MaVi = v.MaVi THEN gd.SoTien ELSE 0 END), 0)
                   + COALESCE(SUM(CASE WHEN gd.Loai = 'ChuyenKhoan' AND gd.MaViDoi = v.MaVi THEN gd.SoTien ELSE 0 END), 0)
                   AS SoDuHienTai
            FROM Vi v
            LEFT JOIN GiaoDich gd ON (gd.MaVi = v.MaVi OR gd.MaViDoi = v.MaVi)
            WHERE v.MaSoChiTieu = ? AND v.DaLuuTru = 0
            GROUP BY v.MaVi
            ORDER BY v.NgayTao
        `;
        const [rows] = await pool.query(sql, [maSoChiTieu]);
        res.json(rows);
    }catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách.' });
    }
}
exports.taoMoi = async (req, res) => {
    const { maSoChiTieu, tenVi, bieuTuong, loaiVi, soDuBanDau } = req.body;

    const maNguoiTao = req.nguoiDung.maNguoiDung;
    if(!maSoChiTieu || !tenVi){
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin.' });
    }

    try{
        const [result] = await pool.query(
            'INSERT INTO Vi (MaSoChiTieu, TenVi, BieuTuong, LoaiVi, SoDuBanDau, MaNguoiTao) VALUES (?, ?, ?, ?, ?, ?)',
            [maSoChiTieu, tenVi, bieuTuong, loaiVi, soDuBanDau || 0, maNguoiTao]
        );
        res.status(201).json({ message: 'Tạo ví thành công.', maVi: result.insertId });
    }catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi tạo ví.' });
    }
}

exports.capNhat = async (req, res) => {
    const maVi = req.params.id;
    const { tenVi, bieuTuong, loaiVi, soDuBanDau } = req.body;

    try {
        await pool.query(
            'UPDATE Vi SET TenVi = ?, BieuTuong = ?, LoaiVi = ?, SoDuBanDau = ? WHERE MaVi = ?',
            [tenVi, bieuTuong, loaiVi, soDuBanDau || 0, maVi]
        );
        res.json({ message: 'Cập nhật ví thành công.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật ví.' });
    }
}

exports.xoa = async (req, res) => {
    const maVi = req.params.id;

    try {
        // Kiểm tra xem ví có chứa giao dịch nào không
        const [giaoDich] = await pool.query('SELECT 1 FROM GiaoDich WHERE MaVi = ? LIMIT 1', [maVi]);
        if (giaoDich.length > 0) {
            return res.status(400).json({ message: 'Không thể xóa ví đang chứa giao dịch. Vui lòng chuyển hoặc xóa giao dịch trước.' });
        }
        await pool.query('DELETE FROM Vi WHERE MaVi = ?', [maVi]);
        res.json({ message: 'Xóa ví thành công.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi xóa ví.' });
    }
}