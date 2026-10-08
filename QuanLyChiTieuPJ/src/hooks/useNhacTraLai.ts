/**
 * useNhacTraLai.ts
 * Hook tự động lên lịch notification nhắc trả lãi mỗi khi
 * danh sách khoản vay/cho vay thay đổi hoặc khi app được focus.
 */
import { useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { datLichNhacTraLai } from '../utils/notificationService';
import { useDanhSachVay, useDanhSachChoVay } from './useVayVon';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';

export function useNhacTraLai() {
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const token = useAuthStore((s) => s.token);

  const { data: dsVay } = useDanhSachVay(maSoChiTieu ?? 0);
  const { data: dsCho } = useDanhSachChoVay(maSoChiTieu ?? 0);

  useEffect(() => {
    if (!token || !maSoChiTieu) return;

    // Lên lịch lại mỗi khi danh sách thay đổi (phân biệt khoản vay và cho vay)
    datLichNhacTraLai(dsVay ?? [], dsCho ?? []).catch(console.warn);
  }, [dsVay, dsCho, token, maSoChiTieu]);
}
