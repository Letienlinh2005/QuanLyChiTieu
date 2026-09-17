import { apiClient } from './client';
import { Vi, LoaiVi } from '../types/vi';

interface TaoViPayload {
  maSoChiTieu: number;
  tenVi: string;
  bieuTuong?: string;
  loaiVi: LoaiVi;
  soDuBanDau: number;
}

export const viApi = {
  layDanhSach: async (maSoChiTieu: number): Promise<Vi[]> => {
    const { data } = await apiClient.get('/vi', { params: { maSoChiTieu } });
    return data.map((row: any) => ({
      maVi: row.MaVi,
      tenVi: row.TenVi,
      bieuTuong: row.BieuTuong,
      loaiVi: row.LoaiVi,
      soDuBanDau: Number(row.SoDuHienTai ?? row.SoDuBanDau), // dùng SoDuHienTai làm số dư thực tế
      daLuuTru: !!row.DaLuuTru,
    }));
  },

  taoMoi: async (payload: TaoViPayload): Promise<{ maVi: number }> => {
    const { data } = await apiClient.post('/vi', payload);
    return data;
  },

  capNhat: async (payload: { maVi: number; tenVi: string; bieuTuong?: string; loaiVi: LoaiVi; soDuBanDau: number }): Promise<void> => {
    const { maVi, ...rest } = payload;
    await apiClient.patch(`/vi/${maVi}`, rest);
  },

  xoa: async (maVi: number): Promise<void> => {
    await apiClient.delete(`/vi/${maVi}`);
  },
};