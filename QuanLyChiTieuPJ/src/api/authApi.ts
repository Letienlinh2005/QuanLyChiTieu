import { apiClient } from './client';
import { DangNhapPayload, DangKyPayload, DangNhapResponse } from '../types/nguoiDung';

export const authApi = {
  dangNhap: async (payload: DangNhapPayload): Promise<DangNhapResponse> => {
    const { data } = await apiClient.post('/auth/dang-nhap', payload);
    return data;
  },

  dangKy: async (payload: DangKyPayload): Promise<DangNhapResponse> => {
    const { data } = await apiClient.post('/auth/dang-ky', payload);
    return data;
  },
};