import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { soChiTieuApi } from '../api/soChiTieuApi';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { DangNhapPayload, DangKyPayload } from '../types/nguoiDung';

function useSauKhiDangNhap() {
  const dangNhapThanhCong = useAuthStore((s) => s.dangNhapThanhCong);
  const chonSoChiTieu = useAppStore((s) => s.chonSoChiTieu);

  return async (token: string, nguoiDung: any) => {
    await dangNhapThanhCong(token, nguoiDung);

    // Lấy sổ chi tiêu đầu tiên của người dùng, đặt làm sổ đang dùng
    try {
      const danhSachSo = await soChiTieuApi.layDanhSachCuaToi();
      if (danhSachSo.length > 0) {
        chonSoChiTieu(danhSachSo[0].MaSoChiTieu);
      }
    } catch (err) {
      console.warn('Không lấy được danh sách sổ chi tiêu', err);
    }
  };
}

export function useDangNhap() {
  const sauKhiDangNhap = useSauKhiDangNhap();

  return useMutation({
    mutationFn: (payload: DangNhapPayload) => authApi.dangNhap(payload),
    onSuccess: (data) => sauKhiDangNhap(data.token, data.nguoiDung),
  });
}

export function useDangKy() {
  const sauKhiDangNhap = useSauKhiDangNhap();

  return useMutation({
    mutationFn: (payload: DangKyPayload) => authApi.dangKy(payload),
    onSuccess: (data) => sauKhiDangNhap(data.token, data.nguoiDung),
  });
}