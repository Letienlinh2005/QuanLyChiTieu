import { apiClient } from './client';
import { TongQuanThang, XuHuongThang } from '../types/baoCao';

export const baoCaoApi = {
  layTongQuan: async (maSoChiTieu: number, thang: number, nam: number): Promise<TongQuanThang> => {
    const { data } = await apiClient.get('/bao-cao/tong-quan', {
      params: { maSoChiTieu, thang, nam },
    });
    return data;
  },

  layXuHuong: async (maSoChiTieu: number, soThang = 6): Promise<XuHuongThang[]> => {
    const { data } = await apiClient.get('/bao-cao/xu-huong', {
      params: { maSoChiTieu, soThang },
    });
    return data;
  },
};
