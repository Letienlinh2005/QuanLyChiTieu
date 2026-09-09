import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { NguoiDung } from '../types/nguoiDung';

interface AuthState {
  nguoiDung: NguoiDung | null;
  token: string | null;
  dangTai: boolean;
  daKhoiTao: boolean;

  dangNhapThanhCong: (token: string, nguoiDung: NguoiDung) => Promise<void>;
  dangXuat: () => Promise<void>;
  khoiTaoTuBoNho: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  nguoiDung: null,
  token: null,
  dangTai: false,
  daKhoiTao: false,

  dangNhapThanhCong: async (token, nguoiDung) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ token, nguoiDung });
  },

  dangXuat: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ token: null, nguoiDung: null });
  },

  // Gọi 1 lần khi app khởi động để tự đăng nhập lại nếu còn token
  khoiTaoTuBoNho: async () => {
    set({ dangTai: true });
    const token = await SecureStore.getItemAsync('auth_token');
    // Ở đây có thể gọi thêm API /auth/me để lấy lại thông tin NguoiDung
    // Tạm thời chỉ khôi phục token, để đơn giản cho bước đầu
    set({ token, dangTai: false, daKhoiTao: true });
  },
}));