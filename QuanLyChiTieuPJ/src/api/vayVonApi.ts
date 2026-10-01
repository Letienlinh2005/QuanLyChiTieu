import { apiClient } from './client';
import { KhoanVay, TaoKhoanVayDto, BaoCaoNam } from '../types/vayVon';

export const vayVonApi = {
  // Vay ngân hàng
  layDanhSachVay: async (maSoChiTieu: number): Promise<KhoanVay[]> => {
    const { data } = await apiClient.get('/vay-von/vay', { params: { maSoChiTieu } });
    return data;
  },
  themVay: async (dto: TaoKhoanVayDto): Promise<{ maVay: number }> => {
    const { data } = await apiClient.post('/vay-von/vay', dto);
    return data;
  },
  capNhatVay: async ({ id, ...body }: { id: number } & Partial<TaoKhoanVayDto> & { trangThai?: string }): Promise<void> => {
    await apiClient.put(`/vay-von/vay/${id}`, body);
  },
  xoaVay: async (id: number): Promise<void> => {
    await apiClient.delete(`/vay-von/vay/${id}`);
  },

  // Cho vay
  layDanhSachChoVay: async (maSoChiTieu: number): Promise<KhoanVay[]> => {
    const { data } = await apiClient.get('/vay-von/cho-vay', { params: { maSoChiTieu } });
    return data;
  },
  themChoVay: async (dto: TaoKhoanVayDto): Promise<{ maVay: number }> => {
    const { data } = await apiClient.post('/vay-von/cho-vay', dto);
    return data;
  },
  capNhatChoVay: async ({ id, ...body }: { id: number } & Partial<TaoKhoanVayDto> & { trangThai?: string }): Promise<void> => {
    await apiClient.put(`/vay-von/cho-vay/${id}`, body);
  },
  xoaChoVay: async (id: number): Promise<void> => {
    await apiClient.delete(`/vay-von/cho-vay/${id}`);
  },
};

export const baoCaoNamApi = {
  layBaoCaoNam: async (maSoChiTieu: number, nam: number): Promise<BaoCaoNam> => {
    const { data } = await apiClient.get('/bao-cao/bao-cao-nam', { params: { maSoChiTieu, nam } });
    return data;
  },
};
