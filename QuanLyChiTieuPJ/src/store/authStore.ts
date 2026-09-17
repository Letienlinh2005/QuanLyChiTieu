import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { NguoiDung } from '../types/nguoiDung';

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
    } catch {
      set({ token: null, nguoiDung: null, daKhoiTao: true });
    }
  },
}));