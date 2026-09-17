import { apiClient } from './client';

export interface SoChiTieu {
  MaSoChiTieu: number;
  TenSo: string;
  LoaiSo: 'CaNhan' | 'GiaDinh';
  DonViTienTe: string;
  VaiTro: 'ChuSo' | 'QuanTri' | 'ThanhVien';
}

export interface ThanhVienSo {
  maNguoiDung: number;
  email: string;
  hoTen: string;
  vaiTro: 'ChuSo' | 'QuanTri' | 'ThanhVien';
  ngayThamGia: string;
}

export const soChiTieuApi = {
  layDanhSachCuaToi: async (): Promise<SoChiTieu[]> => {
    const { data } = await apiClient.get('/so-chi-tieu/cua-toi');
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

  moiThanhVien: async (maSoChiTieu: number, email: string): Promise<void> => {
    await apiClient.post(`/so-chi-tieu/${maSoChiTieu}/thanh-vien`, { email });
  },

  xoaThanhVien: async (maSoChiTieu: number, maNguoiDung: number): Promise<void> => {
    await apiClient.delete(`/so-chi-tieu/${maSoChiTieu}/thanh-vien/${maNguoiDung}`);
  }
};