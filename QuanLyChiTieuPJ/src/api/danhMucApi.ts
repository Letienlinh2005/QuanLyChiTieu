import { apiClient } from './client';
import { DanhMuc, LoaiDanhMuc } from '../types/danhMuc';

export const danhMucApi = {
  layDanhSach: async (maSoChiTieu: number, loai?: LoaiDanhMuc): Promise<DanhMuc[]> => {
    const params: any = { maSoChiTieu };
    if (loai) params.loai = loai;

    const { data } = await apiClient.get('/danh-muc', { params });
    return data.map((row: any) => ({
      maDanhMuc: row.MaDanhMuc,
      tenDanhMuc: row.TenDanhMuc,
      bieuTuong: row.BieuTuong,
      loai: row.Loai,
      laMacDinh: !!row.LaMacDinh,
    }));
  },

  taoMoi: async (payload: { maSoChiTieu: number; tenDanhMuc: string; bieuTuong?: string; loai: LoaiDanhMuc }): Promise<{ maDanhMuc: number }> => {
    const { data } = await apiClient.post('/danh-muc', payload);
    return data;
  },

  capNhat: async (payload: { maDanhMuc: number; tenDanhMuc: string; bieuTuong?: string; loai: LoaiDanhMuc }): Promise<void> => {
    const { maDanhMuc, ...rest } = payload;
    await apiClient.patch(`/danh-muc/${maDanhMuc}`, rest);
  },

  xoa: async (maDanhMuc: number): Promise<void> => {
    await apiClient.delete(`/danh-muc/${maDanhMuc}`);
  },
};