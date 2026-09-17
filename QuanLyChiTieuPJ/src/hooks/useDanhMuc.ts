import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { danhMucApi } from '../api/danhMucApi';
import { LoaiDanhMuc } from '../types/danhMuc';

export function useDanhMuc(maSoChiTieu: number | null, loai?: LoaiDanhMuc) {
  return useQuery({
    queryKey: ['danh-muc', maSoChiTieu, loai],
    queryFn: () => danhMucApi.layDanhSach(maSoChiTieu as number, loai),
    enabled: !!maSoChiTieu, // chỉ gọi API khi đã có maSoChiTieu
  });
}

export function useTaoDanhMuc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: danhMucApi.taoMoi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['danh-muc', variables.maSoChiTieu] });
    },
  });
}

export function useCapNhatDanhMuc(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: danhMucApi.capNhat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['danh-muc', maSoChiTieu] });
    },
  });
}

export function useXoaDanhMuc(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: danhMucApi.xoa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['danh-muc', maSoChiTieu] });
    },
  });
}