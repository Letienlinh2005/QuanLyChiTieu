import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppColors {
  bg: string;
  card: string;
  cardSubtle: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySubtle: string;
  inputBg: string;
  inputBorder: string;
  success: string;
  successSubtle: string;
  danger: string;
  dangerSubtle: string;
  warn: string;
  warnSubtle: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const lightColors: AppColors = {
  bg: '#f9fafb',
  card: '#ffffff',
  cardSubtle: '#f3f4f6',
  border: '#e5e7eb',
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  primary: '#2563eb',
  primarySubtle: '#eff6ff',
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  success: '#16a34a',
  successSubtle: '#dcfce7',
  danger: '#dc2626',
  dangerSubtle: '#fee2e2',
  warn: '#d97706',
  warnSubtle: '#fef3c7',
  tabBar: '#ffffff',
  tabBarBorder: '#e5e7eb',
  tabBarActive: '#2563eb',
  tabBarInactive: '#9ca3af',
};

// Chuẩn OLED True Black: Nền đen tuyệt đối #000000 giúp tắt diode điểm ảnh trên màn hình OLED
export const darkColors: AppColors = {
  bg: '#000000',
  card: '#121212',
  cardSubtle: '#1a1a1a',
  border: '#27272a',
  text: '#ffffff',
  textSecondary: '#d4d4d8',
  textMuted: '#a1a1aa',
  primary: '#3b82f6',
  primarySubtle: 'rgba(59, 130, 246, 0.18)',
  inputBg: '#141414',
  inputBorder: '#2e2e33',
  success: '#22c55e',
  successSubtle: 'rgba(34, 197, 94, 0.18)',
  danger: '#ef4444',
  dangerSubtle: 'rgba(239, 68, 68, 0.18)',
  warn: '#f59e0b',
  warnSubtle: 'rgba(245, 158, 11, 0.18)',
  tabBar: '#000000',
  tabBarBorder: '#1c1c1f',
  tabBarActive: '#3b82f6',
  tabBarInactive: '#71717a',
};

interface ThemeState {
  themeMode: ThemeMode;
  daKhoiTaoTheme: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  khoiTaoTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'system',
  daKhoiTaoTheme: false,

  setThemeMode: async (mode: ThemeMode) => {
    try {
      await SecureStore.setItemAsync('app_theme_mode', mode);
    } catch {
      // Bỏ qua lỗi lưu bộ nhớ nếu có
    }
    set({ themeMode: mode });
  },

  khoiTaoTheme: async () => {
    try {
      const savedMode = (await SecureStore.getItemAsync('app_theme_mode')) as ThemeMode | null;
      if (savedMode && ['system', 'light', 'dark'].includes(savedMode)) {
        set({ themeMode: savedMode, daKhoiTaoTheme: true });
        return;
      }
    } catch {
      // Bỏ qua lỗi đọc bộ nhớ
    }
    set({ themeMode: 'system', daKhoiTaoTheme: true });
  },
}));

export function useAppTheme() {
  const themeMode = useThemeStore((s) => s.themeMode);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const systemScheme = useColorScheme();

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  return {
    isDark,
    themeMode,
    setThemeMode,
    colors,
  };
}
