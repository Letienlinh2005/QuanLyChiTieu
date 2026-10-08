export interface ThangBaoCaoNam {
  thang: number;
  tongThu: number;
  tongChi: number;
  loiNhuan: number;
}

export interface BaoCaoNam {
  nam: number;
  tongThu: number;
  tongChi: number;
  loiNhuan: number;
  namTruoc: {
    nam: number;
    tongThu: number;
    tongChi: number;
    loiNhuan: number;
  };
  theoThang: ThangBaoCaoNam[];
}

export interface KhoanVay {
  maVay: number;
  tenKhoanVay: string;
  soTienGoc: number;
  laiSuatNam: number;
  kyHanThang: number;
  ngayVay: string;
  ghiChu?: string;
  trangThai: 'DangVay' | 'DaTatToan';
  ngayTraLaiHangThang?: number | null; // ngày trong tháng (1-31), null = không đặt
}

export interface TaoKhoanVayDto {
  maSoChiTieu: number;
  tenKhoanVay: string;
  soTienGoc: number;
  laiSuatNam: number;
  kyHanThang: number;
  ngayVay: string;
  ghiChu?: string;
  ngayTraLaiHangThang?: number | null;
  maVi?: number; // Tuỳ chọn ví nhận giải ngân (Vay) hoặc xuất tiền (Cho vay)
}

// Tính lãi suất trả đều hàng tháng (annuity / equal installment)
export function tinhLaiSuat(soTienGoc: number, laiSuatNam: number, kyHanThang: number) {
  const n = kyHanThang || 1;

  // Trường hợp không tính lãi (lãi suất = 0%, ví dụ cho người quen mượn)
  if (!laiSuatNam || laiSuatNam === 0) {
    const traMoiThang = soTienGoc / n;
    return {
      laiSuatThang: 0,
      tongLai: 0,
      tongPhaiTra: soTienGoc,
      traMoiThang,
      traMoiThangAnuity: traMoiThang,
      tongLaiAnuity: 0,
      tongPhaiTraAnuity: soTienGoc,
    };
  }

  const r = laiSuatNam / 100 / 12; // lãi suất tháng

  // Lãi đơn giản (flat interest)
  const tongLai = soTienGoc * (laiSuatNam / 100) * (n / 12);
  const tongPhaiTra = soTienGoc + tongLai;
  const traMoiThang = tongPhaiTra / n;

  // Trả góp đều (annuity - dư nợ giảm dần)
  const traMoiThangAnuity = (soTienGoc * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const tongLaiAnuity = Math.max(0, traMoiThangAnuity * n - soTienGoc);

  return {
    laiSuatThang: r * 100,          // % / tháng
    // Lãi đơn
    tongLai,
    tongPhaiTra,
    traMoiThang,
    // Dư nợ giảm dần
    traMoiThangAnuity,
    tongLaiAnuity,
    tongPhaiTraAnuity: soTienGoc + tongLaiAnuity,
  };
}
