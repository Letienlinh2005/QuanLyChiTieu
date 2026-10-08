import { apiClient } from './client';

export interface SoChiTieu {
  MaSoChiTieu: number;
  TenSo: string;
  LoaiSo: 'CaNhan' | 'GiaDinh';
  DonViTienTe: string;
  VaiTro: 'ChuSo' | 'QuanTri' | 'ThanhVien';
  SoThanhVien?: number;
}

export interface ThanhVienSo {
  maNguoiDung: number;
  email: string;
  hoTen: string;
  vaiTro: 'ChuSo' | 'QuanTri' | 'ThanhVien';
  ngayThamGia: string;
}

export interface LoiMoiDen {
  maLoiMoi: number;
  maSoChiTieu: number;
  tenSo: string;
  loaiSo: 'CaNhan' | 'GiaDinh';
  donViTienTe: string;
  hoTenNguoiMoi: string;
  emailNguoiMoi: string;
  ngayTao: string;
}

export interface LoiMoiDaGui {
  maLoiMoi: number;
  maNguoiDung: number;
  hoTen: string;
  email: string;
  ngayTao: string;
  trangThai: 'DangCho' | 'DaChapNhan' | 'DaTuChoi';
}

export const soChiTieuApi = {
  layDanhSachCuaToi: async (): Promise<SoChiTieu[]> => {
    const { data } = await apiClient.get('/so-chi-tieu/cua-toi');
    return data;
  },

  taoSoChiTieu: async (tenSo: string, loaiSo: 'CaNhan' | 'GiaDinh' = 'GiaDinh'): Promise<{ message: string; maSoChiTieu: number }> => {
    const { data } = await apiClient.post('/so-chi-tieu', { tenSo, loaiSo });
    return data;
  },
  
  layDanhSachThanhVien: async (maSoChiTieu: number): Promise<ThanhVienSo[]> => {
    const { data } = await apiClient.get(`/so-chi-tieu/${maSoChiTieu}/thanh-vien`);
    return data.map((item: any) => ({
      maNguoiDung: item.MaNguoiDung,
      email: item.Email,
      hoTen: item.HoTen,
      vaiTro: item.VaiTro,
      ngayThamGia: item.NgayThamGia
    }));
  },

  moiThanhVien: async (maSoChiTieu: number, email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/so-chi-tieu/${maSoChiTieu}/thanh-vien`, { email });
    return data;
  },

  xoaThanhVien: async (maSoChiTieu: number, maNguoiDung: number): Promise<void> => {
    await apiClient.delete(`/so-chi-tieu/${maSoChiTieu}/thanh-vien/${maNguoiDung}`);
  },

  // Lời mời gửi đến tôi
  layDanhSachLoiMoiDen: async (): Promise<LoiMoiDen[]> => {
    const { data } = await apiClient.get('/so-chi-tieu/loi-moi-den');
    return data;
  },

  // Lời mời của 1 sổ mà tôi đã gửi đi
  layDanhSachLoiMoiDaGui: async (maSoChiTieu: number): Promise<LoiMoiDaGui[]> => {
    const { data } = await apiClient.get(`/so-chi-tieu/${maSoChiTieu}/loi-moi-da-gui`);
    return data;
  },

  // Chấp nhận lời mời
  chapNhanLoiMoi: async (maLoiMoi: number): Promise<{ message: string; maSoChiTieu: number }> => {
    const { data } = await apiClient.post(`/so-chi-tieu/loi-moi/${maLoiMoi}/chap-nhan`);
    return data;
  },

  // Từ chối lời mời
  tuChoiLoiMoi: async (maLoiMoi: number): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/so-chi-tieu/loi-moi/${maLoiMoi}/tu-choi`);
    return data;
  },

  // Hủy lời mời đã gửi
  huyLoiMoi: async (maLoiMoi: number): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/so-chi-tieu/loi-moi/${maLoiMoi}`);
    return data;
  },

  // Cập nhật vai trò thành viên (chỉ Chủ sổ)
  capNhatVaiTro: async (maSoChiTieu: number, maNguoiDung: number, vaiTro: 'QuanTri' | 'ThanhVien'): Promise<{ message: string }> => {
    const { data } = await apiClient.put(`/so-chi-tieu/${maSoChiTieu}/thanh-vien/${maNguoiDung}/vai-tro`, { vaiTro });
    return data;
  },
};