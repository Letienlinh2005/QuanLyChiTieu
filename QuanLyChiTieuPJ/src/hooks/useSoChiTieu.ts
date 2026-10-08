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
      queryClient.invalidateQueries({ queryKey: ['loi-moi-da-gui', maSoChiTieu] });
    },
  });
}

export function useXoaThanhVien(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (maNguoiDung: number) => soChiTieuApi.xoaThanhVien(maSoChiTieu as number, maNguoiDung),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thanh-vien', maSoChiTieu] });
      queryClient.invalidateQueries({ queryKey: ['so-chi-tieu', 'cua-toi'] });
    },
  });
}

// Lời mời gửi đến tôi
export function useLoiMoiDen() {
  return useQuery({
    queryKey: ['loi-moi-den'],
    queryFn: soChiTieuApi.layDanhSachLoiMoiDen,
    refetchInterval: 10000, // Tự động làm mới mỗi 10 giây để nhận lời mời mới nhất
  });
}

// Lời mời đã gửi của 1 sổ
export function useLoiMoiDaGui(maSoChiTieu: number | null) {
  return useQuery({
    queryKey: ['loi-moi-da-gui', maSoChiTieu],
    queryFn: () => soChiTieuApi.layDanhSachLoiMoiDaGui(maSoChiTieu as number),
    enabled: !!maSoChiTieu,
  });
}

// Chấp nhận lời mời
export function useChapNhanLoiMoi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (maLoiMoi: number) => soChiTieuApi.chapNhanLoiMoi(maLoiMoi),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loi-moi-den'] });
      queryClient.invalidateQueries({ queryKey: ['so-chi-tieu', 'cua-toi'] });
    },
  });
}

// Từ chối lời mời
export function useTuChoiLoiMoi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (maLoiMoi: number) => soChiTieuApi.tuChoiLoiMoi(maLoiMoi),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loi-moi-den'] });
    },
  });
}

// Hủy lời mời đã gửi
export function useHuyLoiMoi(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (maLoiMoi: number) => soChiTieuApi.huyLoiMoi(maLoiMoi),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loi-moi-da-gui', maSoChiTieu] });
    },
  });
}

// Tạo sổ mới
export function useTaoSoChiTieu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenSo, loaiSo }: { tenSo: string; loaiSo?: 'CaNhan' | 'GiaDinh' }) =>
      soChiTieuApi.taoSoChiTieu(tenSo, loaiSo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['so-chi-tieu', 'cua-toi'] });
    },
  });
}

// Cập nhật vai trò thành viên
export function useCapNhatVaiTro(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ maNguoiDung, vaiTro }: { maNguoiDung: number; vaiTro: 'QuanTri' | 'ThanhVien' }) =>
      soChiTieuApi.capNhatVaiTro(maSoChiTieu as number, maNguoiDung, vaiTro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thanh-vien', maSoChiTieu] });
    },
  });
}
