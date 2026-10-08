const pool = require('../config/database');
const { kiemTraQuyenSo } = require('../middlewares/auth.middleware');

exports.layDanhSach = async (req, res) => {
    const { maSoChiTieu, loai, baoGomLuuTru } = req.query;

    if (!maSoChiTieu) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

        let sql = 'SELECT * FROM DanhMuc WHERE MaSoChiTieu = ?';
        if (baoGomLuuTru !== 'true') {
            sql += ' AND DaLuuTru = 0';
        }
        const params = [maSoChiTieu];

        if (loai === 'Thu' || loai === 'Chi') {
            sql += ' AND Loai = ?';
            params.push(loai);
        }

        sql += ' ORDER BY TenDanhMuc';

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh mục' });
    }
};

exports.taoMoi = async (req, res) => {
    const { maSoChiTieu, tenDanhMuc, bieuTuong, loai } = req.body;

    if (!maSoChiTieu || !tenDanhMuc || !tenDanhMuc.trim() || !loai) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền tạo danh mục trong sổ chi tiêu này.' });
        }

        const [result] = await pool.query(
            'INSERT INTO DanhMuc (MaSoChiTieu, TenDanhMuc, BieuTuong, Loai) VALUES (?, ?, ?, ?)',
            [maSoChiTieu, tenDanhMuc.trim(), bieuTuong || '📌', loai]
        );
        res.status(201).json({ maDanhMuc: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo danh mục' });
    }
};

exports.capNhat = async (req, res) => {
    const maDanhMuc = req.params.id;
    const { tenDanhMuc, bieuTuong, loai } = req.body;

    try {
        const [dmRows] = await pool.query(
            `SELECT dm.MaDanhMuc FROM DanhMuc dm
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = dm.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE dm.MaDanhMuc = ?`,
            [req.nguoiDung.maNguoiDung, maDanhMuc]
        );
        if (dmRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục hoặc bạn không có quyền sửa.' });
        }

        await pool.query(
            'UPDATE DanhMuc SET TenDanhMuc = ?, BieuTuong = ?, Loai = ? WHERE MaDanhMuc = ?',
            [tenDanhMuc, bieuTuong, loai, maDanhMuc]
        );
        res.json({ message: 'Cập nhật danh mục thành công.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật danh mục' });
    }
};

exports.xoa = async (req, res) => {
    const maDanhMuc = req.params.id;

    try {
        const [dmRows] = await pool.query(
            `SELECT dm.MaDanhMuc FROM DanhMuc dm
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = dm.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE dm.MaDanhMuc = ?`,
            [req.nguoiDung.maNguoiDung, maDanhMuc]
        );
        if (dmRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục hoặc bạn không có quyền xóa.' });
        }

        const [giaoDich] = await pool.query('SELECT 1 FROM GiaoDich WHERE MaDanhMuc = ? LIMIT 1', [maDanhMuc]);
        if (giaoDich.length > 0) {
            return res.status(400).json({ message: 'Không thể xóa danh mục đang có giao dịch.' });
        }
        await pool.query('DELETE FROM DanhMuc WHERE MaDanhMuc = ?', [maDanhMuc]);
        res.json({ message: 'Xóa danh mục thành công.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa danh mục' });
    }
};

exports.doiTrangThaiLuuTru = async (req, res) => {
    const maDanhMuc = req.params.id;
    const { daLuuTru } = req.body;

    try {
        const [dmRows] = await pool.query(
            `SELECT dm.MaDanhMuc, dm.DaLuuTru FROM DanhMuc dm
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = dm.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE dm.MaDanhMuc = ?`,
            [req.nguoiDung.maNguoiDung, maDanhMuc]
        );
        if (dmRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục hoặc bạn không có quyền truy cập.' });
        }

        const giaTriMoi = daLuuTru !== undefined ? (daLuuTru ? 1 : 0) : (dmRows[0].DaLuuTru ? 0 : 1);
        await pool.query('UPDATE DanhMuc SET DaLuuTru = ? WHERE MaDanhMuc = ?', [giaTriMoi, maDanhMuc]);
        res.json({
            message: giaTriMoi ? 'Đã lưu trữ danh mục thành công.' : 'Đã khôi phục danh mục thành công.',
            daLuuTru: giaTriMoi,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi thay đổi trạng thái lưu trữ danh mục' });
    }
};