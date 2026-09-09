export interface NguoiDung {
  maNguoiDung: number;
  email: string;
  hoTen: string;
  duongDanAnhDaiDien: string | null;
  soDienThoai: string | null;
  dangHoatDong: boolean;
}

export interface DangNhapPayload {
  email: string;
  matKhau: string;
}

export interface DangKyPayload {
  email: string;
  matKhau: string;
  hoTen: string;
}

export interface DangNhapResponse {
  token: string;
  nguoiDung: NguoiDung;
}