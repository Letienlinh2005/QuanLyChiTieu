import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore, useAppTheme } from '../src/store/themeStore';

const queryClient = new QueryClient();

function RootNavigation() {
  const daKhoiTao = useAuthStore((s) => s.daKhoiTao);
  const khoiTaoTuBoNho = useAuthStore((s) => s.khoiTaoTuBoNho);
  const khoiTaoTheme = useThemeStore((s) => s.khoiTaoTheme);
  const { isDark, colors } = useAppTheme();

  useEffect(() => {
    khoiTaoTuBoNho();
    khoiTaoTheme();
  }, []);

  if (!daKhoiTao) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigation />
    </QueryClientProvider>
  );
}