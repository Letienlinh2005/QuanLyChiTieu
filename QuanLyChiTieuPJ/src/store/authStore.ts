import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { NguoiDung } from '../types/nguoiDung';
import { soChiTieuApi } from '../api/soChiTieuApi';
import { useAppStore } from './appStore';

interface AuthState {
  nguoiDung: NguoiDung | null;
  token: string | null;
  daKhoiTao: boolean; // đã đọc xong bộ nhớ lúc mở app hay chưa

  dangNhapThanhCong: (token: string, nguoiDung: NguoiDung) => Promise<void>;
  dangXuat: () => Promise<void>;
  khoiTaoTuBoNho: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  nguoiDung: null,
  token: null,
  daKhoiTao: false,

  dangNhapThanhCong: async (token, nguoiDung) => {
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_nguoiDung', JSON.stringify(nguoiDung));
    set({ token, nguoiDung });
  },

  dangXuat: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_nguoiDung');
    set({ token: null, nguoiDung: null });
  },

  khoiTaoTuBoNho: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const nguoiDungJson = await SecureStore.getItemAsync('auth_nguoiDung');
      const nguoiDung = nguoiDungJson ? JSON.parse(nguoiDungJson) : null;
      set({ token, nguoiDung, daKhoiTao: true });

      // Sau khi có token, tự động lấy lại sổ chi tiêu để restore maSoChiTieu
      // (maSoChiTieu không được persist — phải fetch lại mỗi lần mở app)
      if (token) {
        try {
          const danhSachSo = await soChiTieuApi.layDanhSachCuaToi();
          if (danhSachSo.length > 0) {
            useAppStore.getState().chonSoChiTieu(danhSachSo[0].MaSoChiTieu);
          }
        } catch (err) {
          // Offline hoặc token hết hạn — bỏ qua, app vẫn mở được
          console.warn('[authStore] Không lấy được sổ chi tiêu khi khởi động:', err);
        }
      }
    } catch {
      set({ token: null, nguoiDung: null, daKhoiTao: true });
    }
  },
}));