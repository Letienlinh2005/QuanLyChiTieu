const pool = require('../config/database');
const { kiemTraQuyenSo } = require('../middlewares/auth.middleware');

exports.layDanhSach = async (req, res) => {
    const { maSoChiTieu, thang, nam, chuKy: queryChuKy } = req.query;

    if (!maSoChiTieu || !nam) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu hoặc nam' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

        const chuKy = ['HangTuan', 'HangThang', 'HangQuy', 'HangNam'].includes(queryChuKy)
            ? queryChuKy
            : 'HangThang';

        let sql = `
          SELECT ns.*, dm.TenDanhMuc, dm.BieuTuong,
          COALESCE((
            SELECT SUM(gd.SoTien) FROM GiaoDich gd
            WHERE gd.MaDanhMuc = ns.MaDanhMuc
              AND gd.Loai = 'Chi'
              AND YEAR(gd.NgayGiaoDich) = ns.NamApDung
        `;

        if (chuKy === 'HangThang' && thang) {
            sql += ' AND MONTH(gd.NgayGiaoDich) = ns.ThangApDung';
        } else if (chuKy === 'HangQuy' && thang) {
            sql += ' AND QUARTER(gd.NgayGiaoDich) = ns.ThangApDung';
        } else if (chuKy === 'HangTuan' && thang) {
            sql += ' AND WEEK(gd.NgayGiaoDich, 1) = ns.ThangApDung';
        }

        sql += `
          ), 0) AS DaChi
          FROM NganSach ns
          JOIN DanhMuc dm ON dm.MaDanhMuc = ns.MaDanhMuc
          WHERE ns.MaSoChiTieu = ? AND ns.ChuKy = ? AND ns.NamApDung = ?
        `;

        const params = [maSoChiTieu, chuKy, nam];

        if (chuKy !== 'HangNam' && thang) {
            sql += ' AND ns.ThangApDung = ?';
            params.push(thang);
        }

        sql += ' ORDER BY dm.TenDanhMuc';

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy ngân sách' });
    }
};

exports.taoMoi = async (req, res) => {
    const { maSoChiTieu, maDanhMuc, soTien, thangApDung, namApDung, nguongCanhBao, chuKy: bodyChuKy } = req.body;

    if (!maSoChiTieu || !maDanhMuc || !soTien || !namApDung) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (Number(soTien) <= 0) {
        return res.status(400).json({ message: 'Số tiền ngân sách phải lớn hơn 0.' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền tạo ngân sách trong sổ này.' });
        }

        // Kiểm tra danh mục thuộc sổ
        const [dm] = await pool.query('SELECT MaSoChiTieu FROM DanhMuc WHERE MaDanhMuc = ?', [maDanhMuc]);
        if (dm.length === 0 || dm[0].MaSoChiTieu != maSoChiTieu) {
            return res.status(400).json({ message: 'Danh mục không thuộc sổ chi tiêu này.' });
        }

        const chuKy = ['HangTuan', 'HangThang', 'HangQuy', 'HangNam'].includes(bodyChuKy)
            ? bodyChuKy
            : 'HangThang';

        const [result] = await pool.query(
            `INSERT INTO NganSach
             (MaSoChiTieu, MaDanhMuc, SoTien, ChuKy, ThangApDung, NamApDung, NguongCanhBao)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [maSoChiTieu, maDanhMuc, Number(soTien), chuKy, thangApDung || null, namApDung, nguongCanhBao || 80]
        );
        res.status(201).json({ maNganSach: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Danh mục này đã có ngân sách cho chu kỳ đã chọn.' });
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

    if (Number(soTien) <= 0) {
        return res.status(400).json({ message: 'Số tiền ngân sách phải lớn hơn 0.' });
    }

    try {
        const [ns] = await pool.query(
            `SELECT ns.MaNganSach FROM NganSach ns
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = ns.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE ns.MaNganSach = ?`,
            [req.nguoiDung.maNguoiDung, id]
        );
        if (ns.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ngân sách hoặc bạn không có quyền sửa.' });
        }

        await pool.query(
            'UPDATE NganSach SET SoTien = ?, NguongCanhBao = ? WHERE MaNganSach = ?',
            [Number(soTien), nguongCanhBao || 80, id]
        );
        res.json({ message: 'Đã cập nhật ngân sách' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật ngân sách' });
    }
};

exports.xoa = async (req, res) => {
    const { id } = req.params;

    try {
        const [ns] = await pool.query(
            `SELECT ns.MaNganSach FROM NganSach ns
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = ns.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE ns.MaNganSach = ?`,
            [req.nguoiDung.maNguoiDung, id]
        );
        if (ns.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ngân sách hoặc bạn không có quyền xóa.' });
        }

        await pool.query('DELETE FROM NganSach WHERE MaNganSach = ?', [id]);
        res.json({ message: 'Đã xoá ngân sách' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi xoá ngân sách' });
    }
};

