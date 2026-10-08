/**
 * notificationService.ts
 * Quản lý local notifications nhắc trả lãi hàng tháng.
 *
 * ⚠️ expo-notifications không hoạt động trong Expo Go (SDK 53+).
 *    Khi chạy Expo Go, toàn bộ hàm sẽ silent-skip (không báo lỗi).
 *    Muốn test thật: build Development Build (npx expo run:android).
 */
import { Platform } from 'react-native';
import { KhoanVay } from '../types/vayVon';
import { formatCurrency } from './formatCurrency';

// Lazy-load expo-notifications để tránh crash khi chạy trong Expo Go
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
  // Cấu hình cách hiện notification khi app đang mở
  if (Notifications) Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Expo Go không hỗ trợ expo-notifications từ SDK 53 — bỏ qua
  console.log('[notificationService] expo-notifications không khả dụng (Expo Go). Build Development Build để dùng tính năng này.');
}

/** Yêu cầu quyền notification. Trả về true nếu được cấp. */
export async function xinQuyenNotification(): Promise<boolean> {
  if (Platform.OS === 'web' || !Notifications) return false;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Lên lịch notification nhắc trả lãi cho danh sách khoản vay và nhắc đòi tiền cho khoản cho vay.
 * Silent-skip nếu đang chạy trong Expo Go.
 */
export async function datLichNhacTraLai(
  danhSachVay: KhoanVay[] = [],
  danhSachChoVay: KhoanVay[] = []
): Promise<void> {
  if (!Notifications) return; // Expo Go — skip

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const daCoQuyen = await xinQuyenNotification();
    if (!daCoQuyen) return;

    const lenLichItem = async (khoan: KhoanVay, loai: 'vay' | 'cho-vay') => {
      if (khoan.trangThai !== 'DangVay' || !khoan.ngayTraLaiHangThang) return;

      const ngayTrongThang = khoan.ngayTraLaiHangThang;
      const emoji = loai === 'vay' ? '🏦' : '💸';
      const tieuDe = loai === 'vay'
        ? `${emoji} Đến hạn trả lãi: ${khoan.tenKhoanVay}`
        : `${emoji} Nhắc đòi tiền: ${khoan.tenKhoanVay}`;
      const noiDung = loai === 'vay'
        ? `Hôm nay là ngày ${ngayTrongThang} — kỳ trả lãi hàng tháng. Gốc: ${formatCurrency(khoan.soTienGoc)}.`
        : `Hôm nay là ngày ${ngayTrongThang} — nhớ liên hệ người vay. Gốc: ${formatCurrency(khoan.soTienGoc)}.`;

      await Notifications!.scheduleNotificationAsync({
        identifier: `${loai}-${khoan.maVay}`,
        content: { title: tieuDe, body: noiDung, sound: true, data: { maVay: khoan.maVay, loai } },
        trigger: {
          type: Notifications!.SchedulableTriggerInputTypes.CALENDAR,
          day: ngayTrongThang,
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });
    };

    for (const khoan of danhSachVay) {
      await lenLichItem(khoan, 'vay');
    }

    for (const khoan of danhSachChoVay) {
      await lenLichItem(khoan, 'cho-vay');
    }
  } catch (err) {
    console.warn('[notificationService] Lỗi lên lịch notification:', err);
  }
}

/** Huỷ tất cả notification đã lên lịch (dùng khi đăng xuất). */
export async function huyTatCaNhac(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch { /* ignore */ }
}
