import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { soChiTieuApi } from '../api/soChiTieuApi';

export function useSoChiTieuCuaToi() {
  return useQuery({
    queryKey: ['so-chi-tieu', 'cua-toi'],
    queryFn: soChiTieuApi.layDanhSachCuaToi,
  });
}

export function useThanhVienSo(maSoChiTieu: number | null) {
  return useQuery({
    queryKey: ['thanh-vien', maSoChiTieu],
    queryFn: () => soChiTieuApi.layDanhSachThanhVien(maSoChiTieu as number),
    enabled: !!maSoChiTieu,
  });
}

export function useMoiThanhVien(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => soChiTieuApi.moiThanhVien(maSoChiTieu as number, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thanh-vien', maSoChiTieu] });
    },
  });
}

export function useXoaThanhVien(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (maNguoiDung: number) => soChiTieuApi.xoaThanhVien(maSoChiTieu as number, maNguoiDung),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thanh-vien', maSoChiTieu] });
    },
  });
}
