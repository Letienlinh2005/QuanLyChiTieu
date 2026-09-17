import { apiClient } from './client';
import { NganSachChiTiet } from '../types/nganSach';

interface LayDanhSachParams {
  maSoChiTieu: number;
  thang: number;
  nam: number;
}

interface TaoNganSachPayload {
  maSoChiTieu: number;
  maDanhMuc: number;
  soTien: number;
  thangApDung: number;
  namApDung: number;
  nguongCanhBao?: number;
}

interface CapNhatNganSachPayload {
  maNganSach: number;
  soTien: number;
  nguongCanhBao?: number;
}

export const nganSachApi = {
  layDanhSach: async ({ maSoChiTieu, thang, nam }: LayDanhSachParams): Promise<NganSachChiTiet[]> => {
    const { data } = await apiClient.get('/ngan-sach', {
      params: { maSoChiTieu, thang, nam },
    });
    return data.map((row: any) => ({
      maNganSach: row.MaNganSach,
      maDanhMuc: row.MaDanhMuc,
      soTien: Number(row.SoTien),
      chuKy: row.ChuKy,
      thangApDung: row.ThangApDung,
      namApDung: row.NamApDung,
      nguongCanhBao: row.NguongCanhBao,
      tenDanhMuc: row.TenDanhMuc,
      bieuTuong: row.BieuTuong,
      daChi: Number(row.DaChi),
    }));
  },

  taoMoi: async (payload: TaoNganSachPayload): Promise<{ maNganSach: number }> => {
    const { data } = await apiClient.post('/ngan-sach', payload);
    return data;
  },

  capNhat: async ({ maNganSach, ...payload }: CapNhatNganSachPayload): Promise<void> => {
    await apiClient.put(`/ngan-sach/${maNganSach}`, payload);
  },

  xoa: async (maNganSach: number): Promise<void> => {
    await apiClient.delete(`/ngan-sach/${maNganSach}`);
  },
};
