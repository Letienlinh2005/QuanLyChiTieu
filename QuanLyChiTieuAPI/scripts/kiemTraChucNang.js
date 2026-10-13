const pool = require('../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Script kiểm tra tự động 3 tính năng:
// 1. Vay/Cho vay và tự động cộng/trừ số dư nguồn tiền (ví) khi tạo và khi tất toán.
// 2. Đăng ảnh bằng chứng giao dịch thu/chi (base64 lớn) & đối chiếu.
// 3. Báo cáo hằng ngày (baoCaoNgay & cacNgayTrongThang).

async function runTest() {
  console.log('=== BẮT ĐẦU KIỂM TRA TOÀN DIỆN CÁC TÍNH NĂNG ===\n');
  let maNguoiDung, maSoChiTieu, maVi;

  try {
    // 0. Tạo người dùng và sổ chi tiêu test
    const testEmail = `test_${Date.now()}@test.com`;
    const matKhauHash = await bcrypt.hash('123456', 10);
    const [userRes] = await pool.query(
      'INSERT INTO NguoiDung (HoTen, Email, MatKhauHash) VALUES (?, ?, ?)',
      ['Test User', testEmail, matKhauHash]
    );
    maNguoiDung = userRes.insertId;

    const [soRes] = await pool.query(
      'INSERT INTO SoChiTieu (TenSo, MaNguoiTao) VALUES (?, ?)',
      ['Sổ Kiểm Tra', maNguoiDung]
    );
    maSoChiTieu = soRes.insertId;

    await pool.query(
      'INSERT INTO ThanhVienSo (MaSoChiTieu, MaNguoiDung, VaiTro) VALUES (?, ?, "ChuSo")',
      [maSoChiTieu, maNguoiDung]
    );

    // Tạo danh mục chi và thu
    const [dmChiRes] = await pool.query(
      'INSERT INTO DanhMuc (MaSoChiTieu, TenDanhMuc, Loai, BieuTuong) VALUES (?, "Ăn uống", "Chi", "🍜")',
      [maSoChiTieu]
    );
    const maDanhMucChi = dmChiRes.insertId;

    const [dmThuRes] = await pool.query(
      'INSERT INTO DanhMuc (MaSoChiTieu, TenDanhMuc, Loai, BieuTuong) VALUES (?, "Lương", "Thu", "💵")',
      [maSoChiTieu]
    );
    const maDanhMucThu = dmThuRes.insertId;

    // Tạo ví với số dư ban đầu 50.000.000 đ
    const [viRes] = await pool.query(
      'INSERT INTO Vi (MaSoChiTieu, TenVi, BieuTuong, LoaiVi, SoDuBanDau, MaNguoiTao) VALUES (?, "Ví Vietcombank", "🏦", "NganHang", 50000000, ?)',
      [maSoChiTieu, maNguoiDung]
    );
    maVi = viRes.insertId;

    async function laySoDu() {
      const [[vi]] = await pool.query(
        `SELECT v.SoDuBanDau 
                + COALESCE(SUM(CASE WHEN gd.Loai = 'Thu' THEN gd.SoTien ELSE 0 END), 0) 
                - COALESCE(SUM(CASE WHEN gd.Loai = 'Chi' THEN gd.SoTien ELSE 0 END), 0) 
                AS SoDuHienTai
         FROM Vi v
         LEFT JOIN GiaoDich gd ON (gd.MaVi = v.MaVi OR gd.MaViDoi = v.MaVi)
         WHERE v.MaVi = ?
         GROUP BY v.MaVi`,
        [maVi]
      );
      return Number(vi.SoDuHienTai);
    }

    console.log(`✓ Tạo môi trường test thành công. Số dư ban đầu của ví: ${(await laySoDu()).toLocaleString('vi-VN')} đ`);

    // =========================================================================
    // PHẦN 1: KIỂM TRA CHO VAY -> TRỪ VÍ, TẤT TOÁN -> CỘNG LẠI VÀO VÍ
    // =========================================================================
    console.log('\n--- 1. KIỂM TRA CHO VAY & NGUỒN TIỀN ---');
    const soTienChoVay = 10000000;
    const ngayHomNay = new Date().toISOString().slice(0, 10);

    // 1.1 Thêm khoản cho vay kèm chọn ví
    const vayVonController = require('../src/controllers/vayVon.controller');
    
    // Giả lập req, res cho themChoVay
    let resData = null;
    let reqThemChoVay = {
      nguoiDung: { maNguoiDung },
      body: {
        maSoChiTieu,
        tenKhoanVay: 'Cho anh Nam mượn',
        soTienGoc: soTienChoVay,
        laiSuatNam: 0,
        kyHanThang: 3,
        ngayVay: ngayHomNay,
        maVi: maVi
      }
    };
    let resMock = {
      status: (c) => ({ json: (d) => { resData = d; } }),
      json: (d) => { resData = d; }
    };

    await vayVonController.themChoVay(reqThemChoVay, resMock);
    const maChoVay = resData.maVay;
    const soDuSauKhiChoVay = await laySoDu();
    console.log(`Cho vay 10.000.000 đ từ ví:`);
    console.log(`-> Mã khoản cho vay: ${maChoVay}`);
    console.log(`-> Số dư ví sau khi cho vay: ${soDuSauKhiChoVay.toLocaleString('vi-VN')} đ (Kỳ vọng: 40.000.000 đ)`);
    if (soDuSauKhiChoVay === 40000000) {
      console.log('===> ĐẠT: Cho vay đã trừ đúng nguồn tiền được chọn!');
    } else {
      throw new Error(`Thất bại: Số dư sai! Hiện tại: ${soDuSauKhiChoVay}`);
    }

    // 1.2 Tất toán khoản cho vay -> thu hồi tiền cộng lại vào ví
    let reqTatToanChoVay = {
      nguoiDung: { maNguoiDung },
      params: { id: maChoVay },
      body: {
        trangThai: 'DaTatToan'
      }
    };
    await vayVonController.capNhatChoVay(reqTatToanChoVay, resMock);
    const soDuSauTatToanChoVay = await laySoDu();
    console.log(`Tất toán khoản cho vay:`);
    console.log(`-> Số dư ví sau tất toán: ${soDuSauTatToanChoVay.toLocaleString('vi-VN')} đ (Kỳ vọng: 50.000.000 đ)`);
    if (soDuSauTatToanChoVay === 50000000) {
      console.log('===> ĐẠT: Tất toán cho vay đã thu hồi và cộng lại tiền vào nguồn được chọn!');
    } else {
      throw new Error(`Thất bại: Số dư sau tất toán cho vay sai! Hiện tại: ${soDuSauTatToanChoVay}`);
    }

    // =========================================================================
    // PHẦN 2: KIỂM TRA MÌNH ĐI VAY -> CỘNG VÀO VÍ, TẤT TOÁN -> TRỪ TRONG VÍ
    // =========================================================================
    console.log('\n--- 2. KIỂM TRA VAY VỐN & NGUỒN TIỀN ---');
    const soTienVay = 20000000;

    // 2.1 Thêm khoản vay ngân hàng kèm chọn ví nhận
    let reqThemVay = {
      nguoiDung: { maNguoiDung },
      body: {
        maSoChiTieu,
        tenKhoanVay: 'Vay thấu chi Vietcombank',
        soTienGoc: soTienVay,
        laiSuatNam: 8.5,
        kyHanThang: 12,
        ngayVay: ngayHomNay,
        maVi: maVi
      }
    };
    await vayVonController.themVay(reqThemVay, resMock);
    const maVay = resData.maVay;
    const soDuSauKhiVay = await laySoDu();
    console.log(`Đi vay 20.000.000 đ nhận vào ví:`);
    console.log(`-> Mã khoản vay: ${maVay}`);
    console.log(`-> Số dư ví sau khi vay xong: ${soDuSauKhiVay.toLocaleString('vi-VN')} đ (Kỳ vọng: 70.000.000 đ)`);
    if (soDuSauKhiVay === 70000000) {
      console.log('===> ĐẠT: Vay xong đã cộng tiền vào đúng nguồn tiền được chọn!');
    } else {
      throw new Error(`Thất bại: Số dư sau khi vay sai! Hiện tại: ${soDuSauKhiVay}`);
    }

    // 2.2 Tất toán khoản vay -> trừ tiền trong ví đi
    let reqTatToanVay = {
      nguoiDung: { maNguoiDung },
      params: { id: maVay },
      body: {
        trangThai: 'DaTatToan'
      }
    };
    await vayVonController.capNhatVay(reqTatToanVay, resMock);
    const soDuSauTatToanVay = await laySoDu();
    console.log(`Tất toán khoản vay:`);
    console.log(`-> Số dư ví sau tất toán: ${soDuSauTatToanVay.toLocaleString('vi-VN')} đ (Kỳ vọng: 50.000.000 đ)`);
    if (soDuSauTatToanVay === 50000000) {
      console.log('===> ĐẠT: Tất toán vay đã trừ tiền trong nguồn tiền đi!');
    } else {
      throw new Error(`Thất bại: Số dư sau tất toán vay sai! Hiện tại: ${soDuSauTatToanVay}`);
    }

    // =========================================================================
    // PHẦN 3: KIỂM TRA ĐĂNG ẢNH BẰNG CHỨNG GIAO DỊCH THU/CHI ĐỂ ĐỐI CHIẾU
    // =========================================================================
    console.log('\n--- 3. KIỂM TRA ĐĂNG ẢNH BẰNG CHỨNG GIAO DỊCH ---');
    const giaoDichController = require('../src/controllers/giaoDich.controller');

    // Tạo chuỗi base64 mẫu giả lập ảnh chụp hóa đơn (~150KB)
    const anhBase64Mau = 'data:image/jpeg;base64,' + 'A'.repeat(150000);

    let reqTaoGDChi = {
      nguoiDung: { maNguoiDung },
      body: {
        maSoChiTieu,
        maVi,
        maDanhMuc: maDanhMucChi,
        loai: 'Chi',
        soTien: 350000,
        ghiChu: 'Hóa đơn ăn tối nhà hàng Hải Sản',
        ngayGiaoDich: ngayHomNay,
        anhBangChung: anhBase64Mau
      }
    };

    await giaoDichController.taoMoi(reqTaoGDChi, resMock);
    const maGDChi = resData.maGiaoDich;
    console.log(`-> Tạo giao dịch Chi kèm ảnh bằng chứng: Mã GD = ${maGDChi}`);

    // Kiểm tra query lấy giao dịch xem có ảnh bằng chứng hay không
    let gdRows;
    let reqLayGD = {
      nguoiDung: { maNguoiDung },
      query: { maSoChiTieu }
    };
    let resMockLay = {
      status: (c) => ({ json: (d) => { gdRows = d; } }),
      json: (d) => { gdRows = d; }
    };
    await giaoDichController.layDanhSach(reqLayGD, resMockLay);
    const gdVuaTao = gdRows.find(g => g.MaGiaoDich === maGDChi);
    if (gdVuaTao && gdVuaTao.AnhBangChung && gdVuaTao.AnhBangChung.startsWith('data:image/jpeg;base64,')) {
      console.log(`✓ Lấy danh sách giao dịch: đã có trường AnhBangChung (${gdVuaTao.AnhBangChung.length} ký tự).`);
      console.log('===> ĐẠT: Đăng ảnh bằng chứng thành công và lưu trữ trọn vẹn!');
    } else {
      throw new Error('Thất bại: Không tìm thấy ảnh bằng chứng trong giao dịch vừa tạo!');
    }

    // =========================================================================
    // PHẦN 4: KIỂM TRA BÁO CÁO HẰNG NGÀY
    // =========================================================================
    console.log('\n--- 4. KIỂM TRA BÁO CÁO HẰNG NGÀY ---');
    const baoCaoController = require('../src/controllers/baoCao.controller');

    let baoCaoNgayData = null;
    let reqBaoCaoNgay = {
      nguoiDung: { maNguoiDung },
      query: { maSoChiTieu, ngay: ngayHomNay }
    };
    let resMockBaoCao = {
      status: (c) => ({ json: (d) => { baoCaoNgayData = d; } }),
      json: (d) => { baoCaoNgayData = d; }
    };

    await baoCaoController.baoCaoNgay(reqBaoCaoNgay, resMockBaoCao);
    console.log(`Kết quả báo cáo ngày ${ngayHomNay}:`);
    console.log(`-> Tổng thu: ${baoCaoNgayData.tongThu.toLocaleString('vi-VN')} đ`);
    console.log(`-> Tổng chi: ${baoCaoNgayData.tongChi.toLocaleString('vi-VN')} đ`);
    console.log(`-> Chênh lệch: ${baoCaoNgayData.chenhLech.toLocaleString('vi-VN')} đ`);
    console.log(`-> Số giao dịch chi tiết trong ngày: ${baoCaoNgayData.chiTiet.length}`);
    const gdCoAnh = baoCaoNgayData.chiTiet.find(x => x.maGiaoDich === maGDChi);
    if (gdCoAnh && gdCoAnh.anhBangChung) {
      console.log(`-> Giao dịch trong báo cáo ngày chứa ảnh bằng chứng: CÓ (${gdCoAnh.ghiChu})`);
    } else {
      throw new Error('Thất bại: Báo cáo ngày không hiển thị ảnh bằng chứng!');
    }

    // Kiểm tra danh sách các ngày trong tháng (cho lịch báo cáo)
    const homNayDate = new Date();
    let cacNgayData = null;
    let reqCacNgay = {
      nguoiDung: { maNguoiDung },
      query: { maSoChiTieu, thang: homNayDate.getMonth() + 1, nam: homNayDate.getFullYear() }
    };
    await baoCaoController.cacNgayTrongThang(reqCacNgay, {
      status: (c) => ({ json: (d) => { cacNgayData = d; } }),
      json: (d) => { cacNgayData = d; }
    });
    console.log(`-> Số ngày có giao dịch trong tháng: ${cacNgayData.length}`);
    if (cacNgayData.length > 0) {
      console.log('===> ĐẠT: Báo cáo hằng ngày và lịch giao dịch hoạt động chuẩn xác!');
    } else {
      throw new Error('Thất bại: Không lấy được ngày có giao dịch!');
    }

    // =========================================================================
    // DỌN DẸP DỮ LIỆU TEST
    // =========================================================================
    console.log('\n--- Dọn dẹp dữ liệu test ---');
    if (maSoChiTieu) {
      await pool.query('DELETE FROM GiaoDich WHERE MaSoChiTieu = ?', [maSoChiTieu]);
      await pool.query('DELETE FROM VayVon WHERE MaSoChiTieu = ?', [maSoChiTieu]);
      await pool.query('DELETE FROM DanhMuc WHERE MaSoChiTieu = ?', [maSoChiTieu]);
      await pool.query('DELETE FROM Vi WHERE MaSoChiTieu = ?', [maSoChiTieu]);
      await pool.query('DELETE FROM ThanhVienSo WHERE MaSoChiTieu = ?', [maSoChiTieu]);
      await pool.query('DELETE FROM SoChiTieu WHERE MaSoChiTieu = ?', [maSoChiTieu]);
    }
    if (maNguoiDung) {
      await pool.query('DELETE FROM NguoiDung WHERE MaNguoiDung = ?', [maNguoiDung]);
    }
    console.log('✓ Đã dọn dẹp xong.');

    console.log('\n🎉 TẤT CẢ 3 TÍNH NĂNG ĐÃ ĐƯỢC KIỂM TRA VÀ HOẠT ĐỘNG HOÀN TOÀN BÌNH THƯỜNG!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ KIỂM TRA THẤT BẠI:', err);
    if (maSoChiTieu) {
      try {
        await pool.query('DELETE FROM GiaoDich WHERE MaSoChiTieu = ?', [maSoChiTieu]);
        await pool.query('DELETE FROM VayVon WHERE MaSoChiTieu = ?', [maSoChiTieu]);
        await pool.query('DELETE FROM DanhMuc WHERE MaSoChiTieu = ?', [maSoChiTieu]);
        await pool.query('DELETE FROM Vi WHERE MaSoChiTieu = ?', [maSoChiTieu]);
        await pool.query('DELETE FROM ThanhVienSo WHERE MaSoChiTieu = ?', [maSoChiTieu]);
        await pool.query('DELETE FROM SoChiTieu WHERE MaSoChiTieu = ?', [maSoChiTieu]);
      } catch(_) {}
    }
    if (maNguoiDung) {
      try { await pool.query('DELETE FROM NguoiDung WHERE MaNguoiDung = ?', [maNguoiDung]); } catch(_) {}
    }
    process.exit(1);
  }
}

runTest();
