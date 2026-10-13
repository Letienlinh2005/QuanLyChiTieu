import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vayVonApi, baoCaoNamApi } from '../api/vayVonApi';
import { TaoKhoanVayDto } from '../types/vayVon';

// ===== Báo cáo năm =====
export function useBaoCaoNam(maSoChiTieu: number | null, nam: number) {
  return useQuery({
    queryKey: ['bao-cao-nam', maSoChiTieu, nam],
    queryFn: () => baoCaoNamApi.layBaoCaoNam(maSoChiTieu as number, nam),
    enabled: !!maSoChiTieu,
  });
}

// ===== Vay ngân hàng =====
export function useDanhSachVay(maSoChiTieu: number | null) {
  return useQuery({
    queryKey: ['vay-von-vay', maSoChiTieu],
    queryFn: () => vayVonApi.layDanhSachVay(maSoChiTieu as number),
    enabled: !!maSoChiTieu,
  });
}

export function useThemVay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vayVonApi.themVay,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['vay-von-vay', vars.maSoChiTieu] });
      // Refresh ví vì có thể đã tạo giao dịch Thu
      queryClient.invalidateQueries({ queryKey: ['vi', vars.maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['giao-dich', vars.maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-tong-quan', vars.maSoChiTieu] });
    },
  });
}

export function useCapNhatVay(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vayVonApi.capNhatVay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vay-von-vay', maSoChiTieu] });
      // Refresh ví vì tất toán có thể tạo giao dịch Chi
      queryClient.invalidateQueries({ queryKey: ['vi', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['giao-dich', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-tong-quan', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-ngay', maSoChiTieu] });
    },
  });
}

export function useXoaVay(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vayVonApi.xoaVay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vay-von-vay', maSoChiTieu] });
    },
  });
}

// ===== Cho vay =====
export function useDanhSachChoVay(maSoChiTieu: number | null) {
  return useQuery({
    queryKey: ['vay-von-cho-vay', maSoChiTieu],
    queryFn: () => vayVonApi.layDanhSachChoVay(maSoChiTieu as number),
    enabled: !!maSoChiTieu,
  });
}

export function useThemChoVay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vayVonApi.themChoVay,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['vay-von-cho-vay', vars.maSoChiTieu] });
      // Refresh ví vì có thể đã tạo giao dịch Chi
      queryClient.invalidateQueries({ queryKey: ['vi', vars.maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['giao-dich', vars.maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-tong-quan', vars.maSoChiTieu] });
    },
  });
}

export function useCapNhatChoVay(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vayVonApi.capNhatChoVay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vay-von-cho-vay', maSoChiTieu] });
      // Refresh ví vì tất toán có thể tạo giao dịch Thu (thu hồi)
      queryClient.invalidateQueries({ queryKey: ['vi', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['giao-dich', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-tong-quan', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-ngay', maSoChiTieu] });
    },
  });
}

export function useXoaChoVay(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vayVonApi.xoaChoVay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vay-von-cho-vay', maSoChiTieu] });
    },
  });
}
