import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nganSachApi } from '../api/nganSachApi';

export function useNganSach(maSoChiTieu: number | null, thang: number, nam: number) {
  return useQuery({
    queryKey: ['ngan-sach', maSoChiTieu, thang, nam],
    queryFn: () => nganSachApi.layDanhSach({ maSoChiTieu: maSoChiTieu as number, thang, nam }),
    enabled: !!maSoChiTieu,
  });
}

export function useTaoNganSach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: nganSachApi.taoMoi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ngan-sach', variables.maSoChiTieu] });
    },
  });
}

export function useCapNhatNganSach(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: nganSachApi.capNhat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngan-sach', maSoChiTieu] });
    },
  });
}

export function useXoaNganSach(maSoChiTieu: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: nganSachApi.xoa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngan-sach', maSoChiTieu] });
    },
  });
}
