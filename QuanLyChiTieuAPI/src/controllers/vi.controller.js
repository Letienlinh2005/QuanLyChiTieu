const pool = require('../config/database');

exports.layDanhSach = async (req, res) => {
    const {maSoChiTieu} = req.query;
    if (!maSoChiTieu) {
        return res.status(400).json({ message: 'Vui lòng cung cấp mã sổ chi tiêu.' });
    }
    try{
        const [rows] = await pool.query(
            'SELECT * FROM Vi WHERE MaSoChiTieu = ? AND DaLuuTru = 0 ORDER BY NgayTao', [maSoChiTieu]
        );
        res.json(rows);
    }catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách.' });
    }
}
exports.taoMoi = async (req, res) => {
    const { maSoChiTieu, tenVi, bieuTuong, loaiVi, soDuBanDau } = req.body;

    const maNguoiTao = req.nguoiDung.MaNguoiDung;
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