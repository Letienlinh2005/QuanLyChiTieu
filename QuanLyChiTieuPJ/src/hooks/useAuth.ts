import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { DangNhapPayload, DangKyPayload } from '../types/nguoiDung';

export function useDangNhap() {
  const dangNhapThanhCong = useAuthStore((s) => s.dangNhapThanhCong);

  return useMutation({
    mutationFn: (payload: DangNhapPayload) => authApi.dangNhap(payload),
    onSuccess: (data) => {
      dangNhapThanhCong(data.token, data.nguoiDung);
    },
  });
}

export function useDangKy() {
  const dangNhapThanhCong = useAuthStore((s) => s.dangNhapThanhCong);

  return useMutation({
    mutationFn: (payload: DangKyPayload) => authApi.dangKy(payload),
    onSuccess: (data) => {
      dangNhapThanhCong(data.token, data.nguoiDung);
    },
  });
}