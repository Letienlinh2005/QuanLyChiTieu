const pool = require('../config/database');
const { kiemTraQuyenSo } = require('../middlewares/auth.middleware');

exports.layDanhSach = async (req, res) => {
    const { maSoChiTieu, baoGomLuuTru } = req.query;
    if (!maSoChiTieu) {
        return res.status(400).json({ message: 'Vui lòng cung cấp mã sổ chi tiêu.' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

        const filterLuuTru = baoGomLuuTru === 'true' ? '' : 'AND v.DaLuuTru = 0';
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
            WHERE v.MaSoChiTieu = ? ${filterLuuTru}
            GROUP BY v.MaVi
            ORDER BY v.NgayTao
        `;
        const [rows] = await pool.query(sql, [maSoChiTieu]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách ví.' });
    }
};

exports.taoMoi = async (req, res) => {
    const { maSoChiTieu, tenVi, bieuTuong, loaiVi, soDuBanDau } = req.body;
    const maNguoiTao = req.nguoiDung.maNguoiDung;

    if (!maSoChiTieu || !tenVi || !tenVi.trim()) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin ví.' });
    }

    if (soDuBanDau !== undefined && Number(soDuBanDau) < 0) {
        return res.status(400).json({ message: 'Số dư ban đầu không được âm.' });
    }

    try {
        const quyen = await kiemTraQuyenSo(maNguoiTao, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền tạo ví trong sổ chi tiêu này.' });
        }

        const [result] = await pool.query(
            'INSERT INTO Vi (MaSoChiTieu, TenVi, BieuTuong, LoaiVi, SoDuBanDau, MaNguoiTao) VALUES (?, ?, ?, ?, ?, ?)',
            [maSoChiTieu, tenVi.trim(), bieuTuong || '💵', loaiVi || 'TienMat', Number(soDuBanDau) || 0, maNguoiTao]
        );
        res.status(201).json({ message: 'Tạo ví thành công.', maVi: result.insertId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi tạo ví.' });
    }
};

exports.capNhat = async (req, res) => {
    const maVi = req.params.id;
    const { tenVi, bieuTuong, loaiVi, soDuBanDau } = req.body;

    if (soDuBanDau !== undefined && Number(soDuBanDau) < 0) {
        return res.status(400).json({ message: 'Số dư ban đầu không được âm.' });
    }

    try {
        const [viRows] = await pool.query(
            `SELECT v.MaVi FROM Vi v
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = v.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE v.MaVi = ?`,
            [req.nguoiDung.maNguoiDung, maVi]
        );
        if (viRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ví hoặc bạn không có quyền sửa ví này.' });
        }

        await pool.query(
            'UPDATE Vi SET TenVi = ?, BieuTuong = ?, LoaiVi = ?, SoDuBanDau = ? WHERE MaVi = ?',
            [tenVi, bieuTuong, loaiVi, Number(soDuBanDau) || 0, maVi]
        );
        res.json({ message: 'Cập nhật ví thành công.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật ví.' });
    }
};

exports.xoa = async (req, res) => {
    const maVi = req.params.id;

    try {
        const [viRows] = await pool.query(
            `SELECT v.MaVi FROM Vi v
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = v.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE v.MaVi = ?`,
            [req.nguoiDung.maNguoiDung, maVi]
        );
        if (viRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ví hoặc bạn không có quyền xóa ví này.' });
        }

        // Kiểm tra xem ví có chứa giao dịch nào không (cả ví nguồn lẫn ví đích!)
        const [giaoDich] = await pool.query(
            'SELECT 1 FROM GiaoDich WHERE MaVi = ? OR MaViDoi = ? LIMIT 1',
            [maVi, maVi]
        );
        if (giaoDich.length > 0) {
            return res.status(400).json({
                message: 'Không thể xóa ví đang chứa giao dịch (ví nguồn hoặc ví đích). Vui lòng chuyển hoặc xóa giao dịch trước.',
            });
        }

        await pool.query('DELETE FROM Vi WHERE MaVi = ?', [maVi]);
        res.json({ message: 'Xóa ví thành công.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi xóa ví.' });
    }
};

exports.doiTrangThaiLuuTru = async (req, res) => {
    const maVi = req.params.id;
    const { daLuuTru } = req.body;

    try {
        const [viRows] = await pool.query(
            `SELECT v.MaVi, v.DaLuuTru FROM Vi v
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = v.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE v.MaVi = ?`,
            [req.nguoiDung.maNguoiDung, maVi]
        );
        if (viRows.length === 0) {
            return res.status(404).json({ message: 'Ví không tồn tại hoặc bạn không có quyền truy cập.' });
        }

        const giaTriMoi = daLuuTru !== undefined ? (daLuuTru ? 1 : 0) : (viRows[0].DaLuuTru ? 0 : 1);
        await pool.query('UPDATE Vi SET DaLuuTru = ? WHERE MaVi = ?', [giaTriMoi, maVi]);
        res.json({
            message: giaTriMoi ? 'Đã lưu trữ ví thành công.' : 'Đã khôi phục ví thành công.',
            daLuuTru: giaTriMoi,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi thay đổi trạng thái lưu trữ ví.' });
    }
};