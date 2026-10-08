const pool = require('../config/database');
const { kiemTraQuyenSo } = require('../middlewares/auth.middleware');

// Lấy tất cả sổ mà người dùng đang đăng nhập tham gia
exports.layDanhSachCuaToi = async (req, res) => {
    const maNguoiDung = req.nguoiDung.maNguoiDung;

    try {
        const [rows] = await pool.query(
            `SELECT s.MaSoChiTieu, s.TenSo, s.LoaiSo, s.DonViTienTe, tv.VaiTro,
                    (SELECT COUNT(*) FROM ThanhVienSo WHERE MaSoChiTieu = s.MaSoChiTieu) AS SoThanhVien
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

// Tạo sổ mới (Cá nhân hoặc Gia đình)
exports.taoMoi = async (req, res) => {
    const maNguoiDung = req.nguoiDung.maNguoiDung;
    const { tenSo, loaiSo } = req.body;

    if (!tenSo || !tenSo.trim()) {
        return res.status(400).json({ message: 'Vui lòng nhập tên sổ chi tiêu' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const loai = loaiSo === 'GiaDinh' ? 'GiaDinh' : 'CaNhan';
        const [result] = await conn.query(
            'INSERT INTO SoChiTieu (TenSo, LoaiSo, MaNguoiTao) VALUES (?, ?, ?)',
            [tenSo.trim(), loai, maNguoiDung]
        );
        const maSoChiTieu = result.insertId;

        // Người tạo là Chủ sổ
        await conn.query(
            'INSERT INTO ThanhVienSo (MaSoChiTieu, MaNguoiDung, VaiTro) VALUES (?, ?, "ChuSo")',
            [maSoChiTieu, maNguoiDung]
        );

        // Tạo 1 ví mặc định "Tiền mặt" cho sổ mới
        await conn.query(
            'INSERT INTO Vi (MaSoChiTieu, TenVi, BieuTuong, LoaiVi, SoDuBanDau, MaNguoiTao) VALUES (?, ?, ?, ?, ?, ?)',
            [maSoChiTieu, 'Tiền mặt', '💵', 'TienMat', 0, maNguoiDung]
        );

        // Khởi tạo danh mục mẫu cho sổ mới
        const [danhMucMau] = await conn.query('SELECT * FROM DanhMucMau');
        for (const dm of danhMucMau) {
            await conn.query(
                'INSERT INTO DanhMuc (MaSoChiTieu, TenDanhMuc, BieuTuong, Loai, LaMacDinh) VALUES (?, ?, ?, ?, 1)',
                [maSoChiTieu, dm.TenDanhMuc, dm.BieuTuong, dm.Loai]
            );
        }

        await conn.commit();
        res.status(201).json({ message: 'Tạo sổ chi tiêu thành công', maSoChiTieu });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo sổ' });
    } finally {
        if (conn) conn.release();
    }
};

// 1. Lấy danh sách thành viên của 1 sổ
exports.layDanhSachThanhVien = async (req, res) => {
    const { id } = req.params;
    const maNguoiDung = req.nguoiDung.maNguoiDung;

    try {
        // Kiểm tra quyền truy cập sổ
        const quyen = await kiemTraQuyenSo(maNguoiDung, id);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

        const [rows] = await pool.query(
            `SELECT tv.MaNguoiDung, tv.VaiTro, tv.NgayThamGia, nd.Email, nd.HoTen
            FROM ThanhVienSo tv
            JOIN NguoiDung nd ON tv.MaNguoiDung = nd.MaNguoiDung
            WHERE tv.MaSoChiTieu = ?
            ORDER BY FIELD(tv.VaiTro, 'ChuSo', 'QuanTri', 'ThanhVien'), tv.NgayThamGia`,
            [id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách thành viên' });
    }
};

// 2. Gửi lời mời thành viên mới vào sổ (qua email) - Chỉ ChuSo hoặc QuanTri được mời
exports.moiThanhVien = async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    const maNguoiMoi = req.nguoiDung.maNguoiDung;
    
    if (!email || !email.trim()) {
        return res.status(400).json({ message: 'Vui lòng cung cấp email người cần mời' });
    }

    try {
        // Kiểm tra quyền: Chỉ ChuSo hoặc QuanTri mới được mời
        const quyen = await kiemTraQuyenSo(maNguoiMoi, id);
        if (!quyen || (quyen.VaiTro !== 'ChuSo' && quyen.VaiTro !== 'QuanTri')) {
            return res.status(403).json({ message: 'Chỉ Chủ sổ hoặc Quản trị viên mới có quyền mời thành viên.' });
        }

        // Tìm người dùng qua email
        const [nguoiDung] = await pool.query('SELECT MaNguoiDung, HoTen, Email FROM NguoiDung WHERE Email = ?', [email.trim()]);
        if (nguoiDung.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại.' });
        }
        const maNguoiDuocMoi = nguoiDung[0].MaNguoiDung;

        // Không cho tự mời chính mình
        if (maNguoiDuocMoi === maNguoiMoi) {
            return res.status(400).json({ message: 'Bạn không thể mời chính mình' });
        }

        // Kiểm tra xem đã là thành viên trong sổ chưa
        const [thanhVien] = await pool.query('SELECT 1 FROM ThanhVienSo WHERE MaSoChiTieu = ? AND MaNguoiDung = ?', [id, maNguoiDuocMoi]);
        if (thanhVien.length > 0) {
            return res.status(400).json({ message: 'Người này đã là thành viên của sổ' });
        }

        // Kiểm tra xem đã có lời mời đang chờ phản hồi chưa
        const [loiMoiCu] = await pool.query(
            'SELECT 1 FROM LoiMoiSoChiTieu WHERE MaSoChiTieu = ? AND MaNguoiDuocMoi = ? AND TrangThai = "DangCho"',
            [id, maNguoiDuocMoi]
        );
        if (loiMoiCu.length > 0) {
            return res.status(400).json({ message: 'Đã gửi lời mời đến người dùng này trước đó, đang chờ phản hồi.' });
        }

        // Tạo bản ghi lời mời
        await pool.query(
            'INSERT INTO LoiMoiSoChiTieu (MaSoChiTieu, MaNguoiMoi, MaNguoiDuocMoi, TrangThai) VALUES (?, ?, ?, "DangCho")',
            [id, maNguoiMoi, maNguoiDuocMoi]
        );

        res.status(201).json({ message: `Đã gửi lời mời thành công đến ${nguoiDung[0].HoTen} (${nguoiDung[0].Email})!` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi mời thành viên' });
    }
};

// 3. Lấy danh sách lời mời ĐẾN người dùng hiện tại (lời mời đang chờ chấp nhận)
exports.layDanhSachLoiMoiDen = async (req, res) => {
    const maNguoiDung = req.nguoiDung.maNguoiDung;

    try {
        const [rows] = await pool.query(
            `SELECT lm.MaLoiMoi, lm.MaSoChiTieu, lm.NgayTao,
                    s.TenSo, s.LoaiSo, s.DonViTienTe,
                    ndMoi.HoTen AS HoTenNguoiMoi, ndMoi.Email AS EmailNguoiMoi
            FROM LoiMoiSoChiTieu lm
            JOIN SoChiTieu s ON s.MaSoChiTieu = lm.MaSoChiTieu
            JOIN NguoiDung ndMoi ON ndMoi.MaNguoiDung = lm.MaNguoiMoi
            WHERE lm.MaNguoiDuocMoi = ? AND lm.TrangThai = 'DangCho'
            ORDER BY lm.NgayTao DESC`,
            [maNguoiDung]
        );
        res.json(rows.map(r => ({
            maLoiMoi: r.MaLoiMoi,
            maSoChiTieu: r.MaSoChiTieu,
            tenSo: r.TenSo,
            loaiSo: r.LoaiSo,
            donViTienTe: r.DonViTienTe,
            hoTenNguoiMoi: r.HoTenNguoiMoi,
            emailNguoiMoi: r.EmailNguoiMoi,
            ngayTao: r.NgayTao,
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách lời mời' });
    }
};

// 4. Lấy danh sách lời mời ĐÃ GỬI của 1 sổ (đang chờ duyệt)
exports.layDanhSachLoiMoiDaGui = async (req, res) => {
    const { id } = req.params;
    const maNguoiDung = req.nguoiDung.maNguoiDung;

    try {
        // Kiểm tra người gọi phải thuộc sổ
        const quyen = await kiemTraQuyenSo(maNguoiDung, id);
        if (!quyen) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập sổ chi tiêu này.' });
        }

        const [rows] = await pool.query(
            `SELECT lm.MaLoiMoi, lm.NgayTao, lm.TrangThai,
                    nd.MaNguoiDung, nd.HoTen, nd.Email
            FROM LoiMoiSoChiTieu lm
            JOIN NguoiDung nd ON nd.MaNguoiDung = lm.MaNguoiDuocMoi
            WHERE lm.MaSoChiTieu = ? AND lm.TrangThai = 'DangCho'
            ORDER BY lm.NgayTao DESC`,
            [id]
        );
        res.json(rows.map(r => ({
            maLoiMoi: r.MaLoiMoi,
            maNguoiDung: r.MaNguoiDung,
            hoTen: r.HoTen,
            email: r.Email,
            ngayTao: r.NgayTao,
            trangThai: r.TrangThai,
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy lời mời đã gửi' });
    }
};

// 5. Chấp nhận lời mời tham gia sổ
exports.chapNhanLoiMoi = async (req, res) => {
    const maNguoiDung = req.nguoiDung.maNguoiDung;
    const { maLoiMoi } = req.params;

    let conn;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM LoiMoiSoChiTieu WHERE MaLoiMoi = ? AND MaNguoiDuocMoi = ? AND TrangThai = "DangCho"',
            [maLoiMoi, maNguoiDung]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Lời mời không tồn tại hoặc đã được xử lý' });
        }

        const loiMoi = rows[0];
        const maSoChiTieu = loiMoi.MaSoChiTieu;

        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Cập nhật trạng thái lời mời
        await conn.query(
            'UPDATE LoiMoiSoChiTieu SET TrangThai = "DaChapNhan", NgayPhanHoi = NOW() WHERE MaLoiMoi = ?',
            [maLoiMoi]
        );

        // Thêm vào bảng thành viên sổ nếu chưa có
        const [daCo] = await conn.query(
            'SELECT 1 FROM ThanhVienSo WHERE MaSoChiTieu = ? AND MaNguoiDung = ?',
            [maSoChiTieu, maNguoiDung]
        );
        if (daCo.length === 0) {
            await conn.query(
                'INSERT INTO ThanhVienSo (MaSoChiTieu, MaNguoiDung, VaiTro) VALUES (?, ?, "ThanhVien")',
                [maSoChiTieu, maNguoiDung]
            );
        }

        // Cập nhật loại sổ thành 'GiaDinh'
        await conn.query('UPDATE SoChiTieu SET LoaiSo = "GiaDinh" WHERE MaSoChiTieu = ?', [maSoChiTieu]);

        await conn.commit();
        res.json({ message: 'Bạn đã tham gia sổ chi tiêu gia đình thành công!', maSoChiTieu });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi chấp nhận lời mời' });
    } finally {
        if (conn) conn.release();
    }
};

// 6. Từ chối lời mời
exports.tuChoiLoiMoi = async (req, res) => {
    const maNguoiDung = req.nguoiDung.maNguoiDung;
    const { maLoiMoi } = req.params;

    try {
        const [result] = await pool.query(
            'UPDATE LoiMoiSoChiTieu SET TrangThai = "DaTuChoi", NgayPhanHoi = NOW() WHERE MaLoiMoi = ? AND MaNguoiDuocMoi = ? AND TrangThai = "DangCho"',
            [maLoiMoi, maNguoiDung]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Lời mời không tồn tại hoặc đã được xử lý' });
        }
        res.json({ message: 'Đã từ chối lời mời' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi từ chối lời mời' });
    }
};

// 7. Hủy lời mời đã gửi (chỉ người gửi hoặc ChuSo/QuanTri của sổ mới được hủy)
exports.huyLoiMoi = async (req, res) => {
    const { maLoiMoi } = req.params;
    const maNguoiDung = req.nguoiDung.maNguoiDung;

    try {
        const [rows] = await pool.query(
            `SELECT lm.MaLoiMoi, lm.MaSoChiTieu, lm.MaNguoiMoi, tv.VaiTro
             FROM LoiMoiSoChiTieu lm
             LEFT JOIN ThanhVienSo tv ON tv.MaSoChiTieu = lm.MaSoChiTieu AND tv.MaNguoiDung = ?
             WHERE lm.MaLoiMoi = ?`,
            [maNguoiDung, maLoiMoi]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lời mời' });
        }

        const lm = rows[0];
        const laNguoiTaoLoiMoi = lm.MaNguoiMoi === maNguoiDung;
        const laQuanLySo = lm.VaiTro === 'ChuSo' || lm.VaiTro === 'QuanTri';

        if (!laNguoiTaoLoiMoi && !laQuanLySo) {
            return res.status(403).json({ message: 'Bạn không có quyền thu hồi lời mời này.' });
        }

        await pool.query('DELETE FROM LoiMoiSoChiTieu WHERE MaLoiMoi = ?', [maLoiMoi]);
        res.json({ message: 'Đã hủy lời mời' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi hủy lời mời' });
    }
};

// 8. Xóa thành viên / Rời sổ
exports.xoaThanhVien = async (req, res) => {
    const { id, maNguoiDung } = req.params;
    const callerId = req.nguoiDung.maNguoiDung;
    
    try {
        const quyenCaller = await kiemTraQuyenSo(callerId, id);
        if (!quyenCaller) {
            return res.status(403).json({ message: 'Bạn không thuộc sổ này.' });
        }

        const [tv] = await pool.query('SELECT VaiTro FROM ThanhVienSo WHERE MaSoChiTieu = ? AND MaNguoiDung = ?', [id, maNguoiDung]);
        if (tv.length === 0) {
            return res.status(404).json({ message: 'Thành viên không tồn tại trong sổ này' });
        }

        if (tv[0].VaiTro === 'ChuSo') {
            return res.status(400).json({ message: 'Không thể xóa Chủ sổ. Vui lòng chuyển giao sổ hoặc giải tán sổ.' });
        }

        const laTuRoiSo = Number(callerId) === Number(maNguoiDung);

        // Nếu người gọi xóa người khác: bắt buộc phải là ChuSo
        if (!laTuRoiSo && quyenCaller.VaiTro !== 'ChuSo') {
            return res.status(403).json({ message: 'Chỉ Chủ sổ mới có quyền xóa thành viên khác khỏi sổ.' });
        }

        await pool.query('DELETE FROM ThanhVienSo WHERE MaSoChiTieu = ? AND MaNguoiDung = ?', [id, maNguoiDung]);
        res.json({ message: laTuRoiSo ? 'Bạn đã rời khỏi sổ' : 'Đã xóa thành viên khỏi sổ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa thành viên' });
    }
};

// 9. Cập nhật vai trò thành viên (chỉ Chủ sổ mới được gán QuanTri hoặc ThanhVien)
exports.capNhatVaiTroThanhVien = async (req, res) => {
    const { id, maNguoiDung } = req.params;
    const { vaiTro } = req.body;
    const callerId = req.nguoiDung.maNguoiDung;

    if (!['QuanTri', 'ThanhVien'].includes(vaiTro)) {
        return res.status(400).json({ message: 'Vai trò không hợp lệ (chỉ chấp nhận QuanTri hoặc ThanhVien).' });
    }

    try {
        const quyenCaller = await kiemTraQuyenSo(callerId, id);
        if (!quyenCaller || quyenCaller.VaiTro !== 'ChuSo') {
            return res.status(403).json({ message: 'Chỉ Chủ sổ mới có quyền phân quyền thành viên.' });
        }

        const [tv] = await pool.query('SELECT VaiTro FROM ThanhVienSo WHERE MaSoChiTieu = ? AND MaNguoiDung = ?', [id, maNguoiDung]);
        if (tv.length === 0) {
            return res.status(404).json({ message: 'Thành viên không tồn tại trong sổ.' });
        }
        if (tv[0].VaiTro === 'ChuSo') {
            return res.status(400).json({ message: 'Không thể đổi vai trò của Chủ sổ qua API này.' });
        }

        await pool.query(
            'UPDATE ThanhVienSo SET VaiTro = ? WHERE MaSoChiTieu = ? AND MaNguoiDung = ?',
            [vaiTro, id, maNguoiDung]
        );
        res.json({ message: 'Cập nhật vai trò thành viên thành công.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật vai trò' });
    }
};