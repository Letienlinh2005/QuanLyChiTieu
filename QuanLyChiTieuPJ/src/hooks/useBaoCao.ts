import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baoCaoApi } from '../api/baoCaoApi';

export function useTongQuanThang(maSoChiTieu: number | null, thang: number, nam: number) {
  return useQuery({
    queryKey: ['bao-cao-tong-quan', maSoChiTieu, thang, nam],
    queryFn: () => baoCaoApi.layTongQuan(maSoChiTieu as number, thang, nam),
    enabled: !!maSoChiTieu,
  });
}

export function useXuHuongThang(maSoChiTieu: number | null, soThang = 6) {
  return useQuery({
    queryKey: ['bao-cao-xu-huong', maSoChiTieu, soThang],
    queryFn: () => baoCaoApi.layXuHuong(maSoChiTieu as number, soThang),
    enabled: !!maSoChiTieu,
  });
}

export function useBaoCaoNgay(maSoChiTieu: number | null, ngay: string) {
  return useQuery({
    queryKey: ['bao-cao-ngay', maSoChiTieu, ngay],
    queryFn: () => baoCaoApi.layBaoCaoNgay(maSoChiTieu as number, ngay),
    enabled: !!maSoChiTieu && !!ngay,
  });
}

export function useCacNgayTrongThang(maSoChiTieu: number | null, thang: number, nam: number) {
  return useQuery({
    queryKey: ['cac-ngay-trong-thang', maSoChiTieu, thang, nam],
    queryFn: () => baoCaoApi.layCacNgayTrongThang(maSoChiTieu as number, thang, nam),
    enabled: !!maSoChiTieu,
  });
}
