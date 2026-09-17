import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { giaoDichApi } from '../api/giaoDichApi';

export function useGiaoDich(maSoChiTieu: number | null, thang?: number, nam?: number) {
  return useQuery({
    queryKey: ['giao-dich', maSoChiTieu, thang, nam],
    queryFn: () =>
      giaoDichApi.layDanhSach({ maSoChiTieu: maSoChiTieu as number, thang, nam }),
    enabled: !!maSoChiTieu,
  });
}

export function useTaoGiaoDich() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: giaoDichApi.taoMoi,
    onSuccess: (_, variables) => {
      // Làm mới danh sách giao dịch và số dư ví liên quan
      queryClient.invalidateQueries({ queryKey: ['giao-dich', variables.maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['vi', variables.maSoChiTieu] });
    },
  });
}

export function useCapNhatGiaoDich(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: giaoDichApi.capNhat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giao-dich', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['vi', maSoChiTieu] });
    },
  });
}

export function useXoaGiaoDich(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: giaoDichApi.xoa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giao-dich', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['vi', maSoChiTieu] });
    },
  });
}
