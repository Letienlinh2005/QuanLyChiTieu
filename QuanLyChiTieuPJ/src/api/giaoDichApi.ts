import { apiClient } from './client';
import { GiaoDich, GiaoDichChiTiet, LoaiGiaoDich } from '../types/giaoDich';

interface LayDanhSachParams {
  maSoChiTieu: number;
  thang?: number;
  nam?: number;
}

interface TaoGiaoDichPayload {
  maSoChiTieu: number;
  maVi: number;
  maViDoi?: number | null;
  maDanhMuc?: number | null;
  loai: LoaiGiaoDich;
  soTien: number;
  ghiChu?: string | null;
  ngayGiaoDich: string; // 'yyyy-MM-dd'
}

export const giaoDichApi = {
  layDanhSach: async ({ maSoChiTieu, thang, nam }: LayDanhSachParams): Promise<GiaoDichChiTiet[]> => {
    const params: Record<string, number> = { maSoChiTieu };
    if (thang) params.thang = thang;
    if (nam) params.nam = nam;

    const { data } = await apiClient.get('/giao-dich', { params });
    return data.map((row: any) => ({
      maGiaoDich: row.MaGiaoDich,
      maVi: row.MaVi,
      maViDoi: row.MaViDoi,
      maDanhMuc: row.MaDanhMuc,
      loai: row.Loai,
      soTien: Number(row.SoTien),
      ghiChu: row.GhiChu,
      ngayGiaoDich: row.NgayGiaoDich,
      tenDanhMuc: row.TenDanhMuc,
      bieuTuongDanhMuc: row.BieuTuongDanhMuc,
      tenVi: row.TenVi,
    }));
  },

  taoMoi: async (payload: TaoGiaoDichPayload): Promise<{ maGiaoDich: number }> => {
    const { data } = await apiClient.post('/giao-dich', payload);
    return data;
  },

  capNhat: async (payload: { maGiaoDich: number } & Omit<TaoGiaoDichPayload, 'maSoChiTieu'>): Promise<void> => {
    const { maGiaoDich, ...rest } = payload;
    await apiClient.patch(`/giao-dich/${maGiaoDich}`, rest);
  },

  xoa: async (maGiaoDich: number): Promise<void> => {
    await apiClient.delete(`/giao-dich/${maGiaoDich}`);
  },
};
