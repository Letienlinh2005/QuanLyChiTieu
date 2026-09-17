import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { viApi } from '../api/viApi';

export function useVi(maSoChiTieu: number | null) {
  return useQuery({
    queryKey: ['vi', maSoChiTieu],
    queryFn: () => viApi.layDanhSach(maSoChiTieu as number),
    enabled: !!maSoChiTieu,
  });
}

export function useTaoVi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: viApi.taoMoi,
    onSuccess: (_, variables) => {
      // Tự động làm mới danh sách ví sau khi tạo thành công
      queryClient.invalidateQueries({ queryKey: ['vi', variables.maSoChiTieu] });
    },
  });
}

export function useCapNhatVi(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: viApi.capNhat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vi', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['giao-dich', maSoChiTieu] });
    },
  });
}

export function useXoaVi(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: viApi.xoa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vi', maSoChiTieu] });
    },
  });
}