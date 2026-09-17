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
      // Làm mới danh sách giao dịch, số dư ví, báo cáo và ngân sách liên quan
      const maSo = variables.maSoChiTieu;
      queryClient.invalidateQueries({ queryKey: ['giao-dich', maSo] });
      queryClient.invalidateQueries({ queryKey: ['vi', maSo] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-tong-quan', maSo] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-xu-huong', maSo] });
      queryClient.invalidateQueries({ queryKey: ['ngan-sach', maSo] });
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
      queryClient.invalidateQueries({ queryKey: ['bao-cao-tong-quan', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-xu-huong', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['ngan-sach', maSoChiTieu] });
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
      queryClient.invalidateQueries({ queryKey: ['bao-cao-tong-quan', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-xu-huong', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['ngan-sach', maSoChiTieu] });
    },
  });
}
