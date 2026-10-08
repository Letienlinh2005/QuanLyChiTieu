const pool = require('../config/database');
const { kiemTraQuyenSo } = require('../middlewares/auth.middleware');

async function laySoDuVi(maVi) {
    const [[vi]] = await pool.query(
        `SELECT v.MaVi, v.TenVi, v.LoaiVi, v.MaSoChiTieu, v.DaLuuTru,
                v.SoDuBanDau 
                + COALESCE(SUM(CASE WHEN gd.Loai = 'Thu' THEN gd.SoTien ELSE 0 END), 0) 
                - COALESCE(SUM(CASE WHEN gd.Loai = 'Chi' THEN gd.SoTien ELSE 0 END), 0) 
                - COALESCE(SUM(CASE WHEN gd.Loai = 'ChuyenKhoan' AND gd.MaVi = v.MaVi THEN gd.SoTien ELSE 0 END), 0)
                + COALESCE(SUM(CASE WHEN gd.Loai = 'ChuyenKhoan' AND gd.MaViDoi = v.MaVi THEN gd.SoTien ELSE 0 END), 0)
                AS SoDuHienTai
         FROM Vi v
         LEFT JOIN GiaoDich gd ON (gd.MaVi = v.MaVi OR gd.MaViDoi = v.MaVi)
         WHERE v.MaVi = ?
         GROUP BY v.MaVi`,
        [maVi]
    );
    return vi || null;
}

// Lấy danh sách giao dịch, có thể lọc theo tháng/năm
exports.layDanhSach = async (req, res) => {
    const { maSoChiTieu, thang, nam } = req.query;

    if (!maSoChiTieu) {
        return res.status(400).json({ message: 'Thiếu maSoChiTieu' });
    }

    try {
        const quyen = await kiemTraQuyenSo(req.nguoiDung.maNguoiDung, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

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

    if (Number(soTien) <= 0) {
        return res.status(400).json({ message: 'Số tiền giao dịch phải lớn hơn 0.' });
    }

    try {
        // Kiểm tra quyền sổ
        const quyen = await kiemTraQuyenSo(maNguoiTao, maSoChiTieu);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền thêm giao dịch vào sổ chi tiêu này.' });
        }

        // Chặn ngày giao dịch ở tương lai
        const [[ngayCheck]] = await pool.query('SELECT DATEDIFF(?, CURDATE()) > 0 AS TuongLai', [ngayGiaoDich]);
        if (ngayCheck?.TuongLai) {
            return res.status(400).json({ message: 'Ngày giao dịch không thể ở tương lai.' });
        }

        // Kiểm tra ví nguồn thuộc sổ và chưa lưu trữ
        const viNguon = await laySoDuVi(maVi);
        if (!viNguon || viNguon.MaSoChiTieu != maSoChiTieu) {
            return res.status(400).json({ message: 'Ví nguồn không tồn tại hoặc không thuộc sổ chi tiêu này.' });
        }
        if (viNguon.DaLuuTru) {
            return res.status(400).json({ message: 'Ví nguồn đã bị lưu trữ, không thể tạo giao dịch.' });
        }

        if (loai === 'ChuyenKhoan') {
            if (!maViDoi) {
                return res.status(400).json({ message: 'Giao dịch chuyển khoản cần có ví đích' });
            }
            if (Number(maVi) === Number(maViDoi)) {
                return res.status(400).json({ message: 'Ví nguồn và ví đích không được trùng nhau.' });
            }
            const viDich = await laySoDuVi(maViDoi);
            if (!viDich || viDich.MaSoChiTieu != maSoChiTieu) {
                return res.status(400).json({ message: 'Ví đích không tồn tại hoặc không thuộc sổ chi tiêu này.' });
            }
            if (viDich.DaLuuTru) {
                return res.status(400).json({ message: 'Ví đích đã bị lưu trữ, không thể nhận chuyển khoản.' });
            }
        }

        if (loai === 'Thu' || loai === 'Chi') {
            if (!maDanhMuc) {
                return res.status(400).json({ message: 'Giao dịch thu/chi cần có danh mục' });
            }
            const [dm] = await pool.query('SELECT MaSoChiTieu FROM DanhMuc WHERE MaDanhMuc = ?', [maDanhMuc]);
            if (dm.length === 0 || dm[0].MaSoChiTieu != maSoChiTieu) {
                return res.status(400).json({ message: 'Danh mục không tồn tại hoặc không thuộc sổ chi tiêu này.' });
            }
        }

        // Chặn số dư âm khi Chi hoặc Chuyển khoản (trừ ví Thẻ tín dụng)
        if ((loai === 'Chi' || loai === 'ChuyenKhoan') && viNguon.LoaiVi !== 'TheTinDung') {
            if (Number(viNguon.SoDuHienTai) < Number(soTien)) {
                return res.status(400).json({
                    message: `Số dư ví không đủ để thực hiện giao dịch (Số dư hiện tại: ${Number(viNguon.SoDuHienTai).toLocaleString('vi-VN')} đ).`,
                });
            }
        }

        const [result] = await pool.query(
            `INSERT INTO GiaoDich
             (MaSoChiTieu, MaVi, MaViDoi, MaDanhMuc, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [maSoChiTieu, maVi, maViDoi || null, maDanhMuc || null, maNguoiTao, loai, Number(soTien), ghiChu || null, ngayGiaoDich]
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
        const [gd] = await pool.query(
            `SELECT gd.MaGiaoDich FROM GiaoDich gd
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = gd.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE gd.MaGiaoDich = ?`,
            [req.nguoiDung.maNguoiDung, id]
        );
        if (gd.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy giao dịch hoặc bạn không có quyền xóa.' });
        }

        await pool.query('DELETE FROM GiaoDich WHERE MaGiaoDich = ?', [id]);
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

    if (Number(soTien) <= 0) {
        return res.status(400).json({ message: 'Số tiền giao dịch phải lớn hơn 0.' });
    }

    try {
        const [gd] = await pool.query(
            `SELECT gd.* FROM GiaoDich gd
             JOIN ThanhVienSo tv ON tv.MaSoChiTieu = gd.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE gd.MaGiaoDich = ?`,
            [req.nguoiDung.maNguoiDung, id]
        );
        if (gd.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy giao dịch hoặc bạn không có quyền sửa.' });
        }
        const maSoChiTieu = gd[0].MaSoChiTieu;

        // Chặn ngày giao dịch ở tương lai
        const [[ngayCheck]] = await pool.query('SELECT DATEDIFF(?, CURDATE()) > 0 AS TuongLai', [ngayGiaoDich]);
        if (ngayCheck?.TuongLai) {
            return res.status(400).json({ message: 'Ngày giao dịch không thể ở tương lai.' });
        }

        // Kiểm tra ví nguồn
        const viNguon = await laySoDuVi(maVi);
        if (!viNguon || viNguon.MaSoChiTieu != maSoChiTieu) {
            return res.status(400).json({ message: 'Ví không thuộc sổ chi tiêu này.' });
        }

        if (loai === 'ChuyenKhoan') {
            if (!maViDoi) {
                return res.status(400).json({ message: 'Giao dịch chuyển khoản cần có ví đích.' });
            }
            if (Number(maVi) === Number(maViDoi)) {
                return res.status(400).json({ message: 'Ví nguồn và ví đích không được trùng nhau.' });
            }
            const viDich = await laySoDuVi(maViDoi);
            if (!viDich || viDich.MaSoChiTieu != maSoChiTieu) {
                return res.status(400).json({ message: 'Ví đích không thuộc sổ chi tiêu này.' });
            }
        }

        if (loai === 'Thu' || loai === 'Chi') {
            if (!maDanhMuc) {
                return res.status(400).json({ message: 'Giao dịch thu/chi cần có danh mục' });
            }
            const [dm] = await pool.query('SELECT MaSoChiTieu FROM DanhMuc WHERE MaDanhMuc = ?', [maDanhMuc]);
            if (dm.length === 0 || dm[0].MaSoChiTieu != maSoChiTieu) {
                return res.status(400).json({ message: 'Danh mục không thuộc sổ chi tiêu này.' });
            }
        }

        await pool.query(
            `UPDATE GiaoDich
             SET MaVi = ?, MaViDoi = ?, MaDanhMuc = ?, Loai = ?, SoTien = ?, GhiChu = ?, NgayGiaoDich = ?
             WHERE MaGiaoDich = ?`,
            [maVi, maViDoi || null, maDanhMuc || null, loai, Number(soTien), ghiChu || null, ngayGiaoDich, id]
        );
        res.json({ message: 'Cập nhật giao dịch thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật giao dịch' });
    }
};