const pool = require('../config/database');

// Lấy tất cả sổ mà người dùng đang đăng nhập tham gia
exports.layDanhSachCuaToi = async (req, res) => {
    const maNguoiDung = req.nguoiDung.maNguoiDung;

    try {
        const [rows] = await pool.query(
            `SELECT s.MaSoChiTieu, s.TenSo, s.LoaiSo, s.DonViTienTe, tv.VaiTro
            FROM SoChiTieu s
            JOIN ThanhVienSo tv ON tv.MaSoChiTieu = s.MaSoChiTieu
            WHERE tv.MaNguoiDung = ?
            ORDER BY s.NgayTao`,
            [maNguoiDung]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách sổ' });
    }
};

// 1. Lấy danh sách thành viên của 1 sổ
exports.layDanhSachThanhVien = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT tv.MaNguoiDung, tv.VaiTro, tv.NgayThamGia, nd.Email, nd.HoTen
            FROM ThanhVienSo tv
            JOIN NguoiDung nd ON tv.MaNguoiDung = nd.MaNguoiDung
            WHERE tv.MaSoChiTieu = ?`,
            [id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách thành viên' });
    }
};

// 2. Mời thành viên mới (thêm qua email)
exports.moiThanhVien = async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    
    if (!email) return res.status(400).json({ message: 'Vui lòng cung cấp email' });

    try {
        // Tìm người dùng qua email
        const [nguoiDung] = await pool.query('SELECT MaNguoiDung FROM NguoiDung WHERE Email = ?', [email]);
        if (nguoiDung.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này' });
        }
        const maNguoiDung = nguoiDung[0].MaNguoiDung;

        // Kiểm tra xem đã trong sổ chưa
        const [thanhVien] = await pool.query('SELECT 1 FROM ThanhVienSo WHERE MaSoChiTieu = ? AND MaNguoiDung = ?', [id, maNguoiDung]);
        if (thanhVien.length > 0) {
            return res.status(400).json({ message: 'Người này đã là thành viên của sổ' });
        }

        await pool.query(
            'INSERT INTO ThanhVienSo (MaSoChiTieu, MaNguoiDung, VaiTro) VALUES (?, ?, ?)',
            [id, maNguoiDung, 'ThanhVien']
        );
        
        // Cập nhật loại sổ thành Nhóm nếu có nhiều hơn 1 thành viên
        await pool.query('UPDATE SoChiTieu SET LoaiSo = ? WHERE MaSoChiTieu = ?', ['Nhom', id]);

        res.status(201).json({ message: 'Mời thành viên thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi mời thành viên' });
    }
};

// 3. Xóa thành viên
exports.xoaThanhVien = async (req, res) => {
    const { id, maNguoiDung } = req.params;
    
    try {
        const [tv] = await pool.query('SELECT VaiTro FROM ThanhVienSo WHERE MaSoChiTieu = ? AND MaNguoiDung = ?', [id, maNguoiDung]);
        if (tv.length > 0 && tv[0].VaiTro === 'ChuSo') {
            return res.status(400).json({ message: 'Không thể xóa chủ sổ' });
        }

        await pool.query('DELETE FROM ThanhVienSo WHERE MaSoChiTieu = ? AND MaNguoiDung = ?', [id, maNguoiDung]);
        res.json({ message: 'Đã xóa thành viên khỏi sổ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa thành viên' });
    }
};