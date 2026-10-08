/**
 * Script thêm dữ liệu mẫu (Seed Data) cho hệ thống Sổ Chi Tiêu
 * Thêm người dùng, sổ gia đình, thành viên với các vai trò, ví, danh mục, giao dịch và khoản vay.
 * 
 * Chạy lệnh: node scripts/themDuLieuMau.js
 */

const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

async function themDuLieuMau() {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    console.log('🔄 Bắt đầu tạo dữ liệu mẫu...');

    // 1. Tạo mật khẩu hash chung cho các tài khoản test: '123456'
    const matKhauHash = await bcrypt.hash('123456', 10);

    const danhSachUser = [
      { email: 'nguyenvana@gmail.com', hoTen: 'Nguyễn Văn An', soDienThoai: '0901234567' },
      { email: 'lethihang@gmail.com', hoTen: 'Lê Thị Hằng', soDienThoai: '0912345678' },
      { email: 'hoangminhtuan@gmail.com', hoTen: 'Hoàng Minh Tuấn', soDienThoai: '0923456789' },
      { email: 'dangthuytrang@gmail.com', hoTen: 'Đặng Thuỳ Trang', soDienThoai: '0934567890' },
      { email: 'vuducdam@gmail.com', hoTen: 'Vũ Đức Đam', soDienThoai: '0945678901' },
    ];

    const userMap = {};

    for (const u of danhSachUser) {
      const [existing] = await conn.query('SELECT MaNguoiDung FROM NguoiDung WHERE Email = ?', [u.email]);
      let maND;
      if (existing.length > 0) {
        maND = existing[0].MaNguoiDung;
        console.log(`ℹ️ Người dùng ${u.email} đã tồn tại (ID: ${maND})`);
      } else {
        const [res] = await conn.query(
          `INSERT INTO NguoiDung (Email, MatKhauHash, HoTen, SoDienThoai, VaiTroHeThong, DangHoatDong)
           VALUES (?, ?, ?, ?, 'NguoiDung', 1)`,
          [u.email, matKhauHash, u.hoTen, u.soDienThoai]
        );
        maND = res.insertId;
        console.log(`✅ Đã tạo người dùng mới: ${u.hoTen} (${u.email}) - ID: ${maND}`);
      }
      userMap[u.email] = maND;
    }

    // Lấy ID của một số người dùng có sẵn trước đó nếu có
    const [existingUsers] = await conn.query('SELECT MaNguoiDung, Email FROM NguoiDung LIMIT 10');
    existingUsers.forEach(u => {
      userMap[u.Email] = u.MaNguoiDung;
    });

    const maAn = userMap['nguyenvana@gmail.com'];
    const maHang = userMap['lethihang@gmail.com'];
    const maTuan = userMap['hoangminhtuan@gmail.com'];
    const maTrang = userMap['dangthuytrang@gmail.com'];
    const maDam = userMap['vuducdam@gmail.com'];

    // 2. Danh sách các Sổ chi tiêu mẫu
    const danhSachSo = [
      {
        tenSo: 'Quỹ Chi Tiêu Gia Đình An - Hằng',
        loaiSo: 'GiaDinh',
        maNguoiTao: maAn,
        thanhVien: [
          { maND: maAn, vaiTro: 'ChuSo' },
          { maND: maHang, vaiTro: 'QuanTri' },
          { maND: userMap['tranmailan@gmail.com'] || maTrang, vaiTro: 'ThanhVien' },
        ],
      },
      {
        tenSo: 'Team Du Lịch & Phượt Xuyên Việt',
        loaiSo: 'GiaDinh',
        maNguoiTao: maTuan,
        thanhVien: [
          { maND: maTuan, vaiTro: 'ChuSo' },
          { maND: maTrang, vaiTro: 'QuanTri' },
          { maND: maAn, vaiTro: 'ThanhVien' },
          { maND: userMap['phamhuyanh@gmail.com'] || maDam, vaiTro: 'ThanhVien' },
        ],
      },
      {
        tenSo: 'Quỹ Sinh Hoạt Căn Hộ Chung Cư 1204',
        loaiSo: 'GiaDinh',
        maNguoiTao: maDam,
        thanhVien: [
          { maND: maDam, vaiTro: 'ChuSo' },
          { maND: maTuan, vaiTro: 'QuanTri' },
          { maND: maHang, vaiTro: 'ThanhVien' },
        ],
      },
      {
        tenSo: 'Sổ Tiết Kiệm & Đầu Tư Cá Nhân An',
        loaiSo: 'CaNhan',
        maNguoiTao: maAn,
        thanhVien: [
          { maND: maAn, vaiTro: 'ChuSo' },
        ],
      },
    ];

    // Lấy danh mục mẫu hệ thống
    const [danhMucMaus] = await conn.query('SELECT TenDanhMuc, BieuTuong, Loai FROM DanhMucMau');

    for (const so of danhSachSo) {
      if (!so.maNguoiTao) continue;

      // Kiểm tra xem sổ đã tồn tại chưa
      const [existingSo] = await conn.query(
        'SELECT MaSoChiTieu FROM SoChiTieu WHERE TenSo = ? AND MaNguoiTao = ?',
        [so.tenSo, so.maNguoiTao]
      );

      let maSo;
      if (existingSo.length > 0) {
        maSo = existingSo[0].MaSoChiTieu;
        console.log(`ℹ️ Sổ "${so.tenSo}" đã tồn tại (ID: ${maSo})`);
      } else {
        const [resSo] = await conn.query(
          `INSERT INTO SoChiTieu (TenSo, LoaiSo, DonViTienTe, MaNguoiTao)
           VALUES (?, ?, 'VND', ?)`,
          [so.tenSo, so.loaiSo, so.maNguoiTao]
        );
        maSo = resSo.insertId;
        console.log(`✅ Đã tạo Sổ: "${so.tenSo}" (ID: ${maSo})`);

        // Thêm thành viên sổ
        for (const tv of so.thanhVien) {
          if (!tv.maND) continue;
          await conn.query(
            `INSERT IGNORE INTO ThanhVienSo (MaSoChiTieu, MaNguoiDung, VaiTro)
             VALUES (?, ?, ?)`,
            [maSo, tv.maND, tv.vaiTro]
          );
        }

        // Tạo danh mục mặc định cho sổ
        for (const dm of danhMucMaus) {
          await conn.query(
            `INSERT INTO DanhMuc (MaSoChiTieu, TenDanhMuc, BieuTuong, Loai, LaMacDinh)
             VALUES (?, ?, ?, ?, 1)`,
            [maSo, dm.TenDanhMuc, dm.BieuTuong, dm.Loai]
          );
        }

        // Tạo ví cho sổ
        const [resVi1] = await conn.query(
          `INSERT INTO Vi (MaSoChiTieu, TenVi, BieuTuong, LoaiVi, SoDuBanDau, MaNguoiTao)
           VALUES (?, 'Ví Tiền Mặt', '💵', 'TienMat', 15000000, ?)`,
          [maSo, so.maNguoiTao]
        );
        const maVi1 = resVi1.insertId;

        const [resVi2] = await conn.query(
          `INSERT INTO Vi (MaSoChiTieu, TenVi, BieuTuong, LoaiVi, SoDuBanDau, MaNguoiTao)
           VALUES (?, 'Tài Khoản Techcombank', '💳', 'NganHang', 55000000, ?)`,
          [maSo, so.maNguoiTao]
        );
        const maVi2 = resVi2.insertId;

        const [resVi3] = await conn.query(
          `INSERT INTO Vi (MaSoChiTieu, TenVi, BieuTuong, LoaiVi, SoDuBanDau, MaNguoiTao)
           VALUES (?, 'Ví Điện Tử MoMo', '📱', 'ViDienTu', 5000000, ?)`,
          [maSo, so.maNguoiTao]
        );
        const maVi3 = resVi3.insertId;

        // Lấy danh mục vừa tạo
        const [danhMucs] = await conn.query(
          'SELECT MaDanhMuc, TenDanhMuc, Loai FROM DanhMuc WHERE MaSoChiTieu = ?',
          [maSo]
        );
        const dmChi = danhMucs.filter(d => d.Loai === 'Chi');
        const dmThu = danhMucs.filter(d => d.Loai === 'Thu');

        const dmAnUong = dmChi.find(d => d.TenDanhMuc.includes('Ăn uống')) || dmChi[0];
        const dmDiLai = dmChi.find(d => d.TenDanhMuc.includes('Đi lại') || d.TenDanhMuc.includes('Xe')) || dmChi[1];
        const dmNhaCua = dmChi.find(d => d.TenDanhMuc.includes('Nhà') || d.TenDanhMuc.includes('Hóa đơn')) || dmChi[2];
        const dmGiaiTri = dmChi.find(d => d.TenDanhMuc.includes('Giải trí') || d.TenDanhMuc.includes('Mua sắm')) || dmChi[3];
        const dmLuong = dmThu.find(d => d.TenDanhMuc.includes('Lương')) || dmThu[0];
        const dmThuong = dmThu.find(d => d.TenDanhMuc.includes('Thưởng') || d.TenDanhMuc.includes('Khác')) || dmThu[1];

        // 3. Tạo các giao dịch mẫu thực tế
        const giaoDichMau = [
          {
            maVi: maVi2,
            maDanhMuc: dmLuong ? dmLuong.MaDanhMuc : null,
            loai: 'Thu',
            soTien: 35000000,
            ghiChu: 'Lương chuyển khoản tháng vừa rồi',
            ngayGD: '2026-09-05',
          },
          {
            maVi: maVi2,
            maDanhMuc: dmThuong ? dmThuong.MaDanhMuc : null,
            loai: 'Thu',
            soTien: 12000000,
            ghiChu: 'Thưởng dự án hoàn thành xuất sắc',
            ngayGD: '2026-09-15',
          },
          {
            maVi: maVi1,
            maDanhMuc: dmAnUong ? dmAnUong.MaDanhMuc : null,
            loai: 'Chi',
            soTien: 850000,
            ghiChu: 'Đi siêu thị WinMart cuối tuần',
            ngayGD: '2026-09-18',
          },
          {
            maVi: maVi1,
            maDanhMuc: dmAnUong ? dmAnUong.MaDanhMuc : null,
            loai: 'Chi',
            soTien: 420000,
            ghiChu: 'Liên hoan ăn trưa cùng đồng nghiệp',
            ngayGD: '2026-09-20',
          },
          {
            maVi: maVi2,
            maDanhMuc: dmNhaCua ? dmNhaCua.MaDanhMuc : null,
            loai: 'Chi',
            soTien: 3200000,
            ghiChu: 'Tiền điện sinh hoạt và nước tháng này',
            ngayGD: '2026-09-22',
          },
          {
            maVi: maVi3,
            maDanhMuc: dmDiLai ? dmDiLai.MaDanhMuc : null,
            loai: 'Chi',
            soTien: 550000,
            ghiChu: 'Đổ xăng xe ô tô và bảo dưỡng định kỳ',
            ngayGD: '2026-09-25',
          },
          {
            maVi: maVi3,
            maDanhMuc: dmGiaiTri ? dmGiaiTri.MaDanhMuc : null,
            loai: 'Chi',
            soTien: 1250000,
            ghiChu: 'Mua vé xem phim CGV và cafe Highlands',
            ngayGD: '2026-09-28',
          },
          {
            maVi: maVi2,
            maViDoi: maVi1,
            loai: 'ChuyenKhoan',
            soTien: 5000000,
            ghiChu: 'Rút tiền từ tài khoản Techcombank về ví tiền mặt',
            ngayGD: '2026-10-02',
          },
          {
            maVi: maVi2,
            maViDoi: maVi3,
            loai: 'ChuyenKhoan',
            soTien: 2000000,
            ghiChu: 'Nạp tiền vào ví MoMo thanh toán trực tuyến',
            ngayGD: '2026-10-04',
          },
          {
            maVi: maVi1,
            maDanhMuc: dmAnUong ? dmAnUong.MaDanhMuc : null,
            loai: 'Chi',
            soTien: 680000,
            ghiChu: 'Mua thực phẩm tươi sống cả tuần',
            ngayGD: '2026-10-06',
          },
        ];

        for (const gd of giaoDichMau) {
          await conn.query(
            `INSERT INTO GiaoDich (MaSoChiTieu, MaVi, MaViDoi, MaDanhMuc, MaNguoiTao, Loai, SoTien, GhiChu, NgayGiaoDich)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              maSo,
              gd.maVi,
              gd.maViDoi || null,
              gd.maDanhMuc || null,
              so.maNguoiTao,
              gd.loai,
              gd.soTien,
              gd.ghiChu,
              gd.ngayGD,
            ]
          );
        }

        // 4. Tạo khoản Vay và Cho Vay mẫu
        if (so.loaiSo === 'GiaDinh') {
          // Khoản vay ngân hàng
          await conn.query(
            `INSERT INTO VayVon (MaSoChiTieu, LoaiVay, TenKhoanVay, SoTienGoc, LaiSuatNam, KyHanThang, NgayVay, GhiChu, TrangThai, NgayTraLaiHangThang)
             VALUES (?, 'VayNganHang', 'Vay mua chung cư Vietcombank', 850000000, 8.5, 120, '2026-01-15', 'Gói vay ưu đãi lãi suất cố định 2 năm', 'DangVay', 15)`,
            [maSo]
          );

          // Khoản cho vay người quen (lãi suất 0%)
          await conn.query(
            `INSERT INTO VayVon (MaSoChiTieu, LoaiVay, TenKhoanVay, SoTienGoc, LaiSuatNam, KyHanThang, NgayVay, GhiChu, TrangThai, NgayTraLaiHangThang)
             VALUES (?, 'ChoVay', 'Cho em trai vay khởi nghiệp', 50000000, 0, 12, '2026-06-01', 'Cho vay hỗ trợ người nhà không tính lãi', 'DangVay', null)`,
            [maSo]
          );
        }
      }
    }

    // 5. Thêm vài bản ghi Nhật ký hệ thống mẫu (ChiTiet là JSON)
    await conn.query(
      `INSERT INTO NhatKyHeThong (MaNguoiDung, HanhDong, DoiTuong, ChiTiet)
       VALUES 
       (3, 'KhoiTaoHeThong', 'HeThong', ?),
       (3, 'TaoSoChiTieu', 'SoChiTieu', ?)`,
      [
        JSON.stringify({ moTa: 'Khởi tạo cấu hình và dữ liệu mẫu kiểm thử' }),
        JSON.stringify({ moTa: 'Quản trị viên tạo sổ chi tiêu mẫu cho gia đình' }),
      ]
    );

    await conn.commit();
    console.log('🎉 Hoàn thành! Đã tạo thành công toàn bộ dữ liệu mẫu phong phú.');
  } catch (error) {
    await conn.rollback();
    console.error('❌ Lỗi khi tạo dữ liệu mẫu:', error);
  } finally {
    conn.release();
    process.exit();
  }
}

themDuLieuMau();
