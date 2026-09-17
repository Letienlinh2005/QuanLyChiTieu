export type ChuKyNganSach = 'HangTuan' | 'HangThang' | 'HangQuy' | 'HangNam';

export interface NganSach {
  maNganSach: number;
  maDanhMuc: number;
  soTien: number;
  chuKy: ChuKyNganSach;
  thangApDung: number;
  namApDung: number;
  nguongCanhBao: number; // % cảnh báo, mặc định 80
}

// Ngân sách trả về từ GET /ngan-sach có kèm thông tin danh mục
// và tổng đã chi thực tế trong tháng (tính sẵn ở backend).
export interface NganSachChiTiet extends NganSach {
  tenDanhMuc: string;
  bieuTuong: string;
  daChi: number;
}
