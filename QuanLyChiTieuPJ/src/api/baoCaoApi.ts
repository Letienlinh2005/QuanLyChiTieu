import { apiClient } from './client';
import { TongQuanThang, XuHuongThang, BaoCaoNgay, NgayTrongThang } from '../types/baoCao';

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

  layBaoCaoNgay: async (maSoChiTieu: number, ngay: string): Promise<BaoCaoNgay> => {
    const { data } = await apiClient.get('/bao-cao/bao-cao-ngay', {
      params: { maSoChiTieu, ngay },
    });
    return data;
  },

  layCacNgayTrongThang: async (maSoChiTieu: number, thang: number, nam: number): Promise<NgayTrongThang[]> => {
    const { data } = await apiClient.get('/bao-cao/cac-ngay-trong-thang', {
      params: { maSoChiTieu, thang, nam },
    });
    return data;
  },
};
