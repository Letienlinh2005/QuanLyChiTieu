const pool = require('../config/database');

exports.layDanhSach = async (req, res) => {
    const { maSoChiTieu, loai } = req.query;

    if (!maSoChiTieu) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu' });
    }

    try {
        let sql = 'SELECT * FROM DanhMuc WHERE MaSoChiTieu = ? AND DaLuuTru = 0';
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

    if (!maSoChiTieu || !tenDanhMuc || !loai) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO DanhMuc (MaSoChiTieu, TenDanhMuc, BieuTuong, Loai) VALUES (?, ?, ?, ?)',
            [maSoChiTieu, tenDanhMuc, bieuTuong || '📌', loai]
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