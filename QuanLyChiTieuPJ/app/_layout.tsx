import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

const queryClient = new QueryClient();

function RootNavigation() {
  const daKhoiTao = useAuthStore((s) => s.daKhoiTao);
  const khoiTaoTuBoNho = useAuthStore((s) => s.khoiTaoTuBoNho);

  useEffect(() => {
    khoiTaoTuBoNho();
  }, []);

  if (!daKhoiTao) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigation />
    </QueryClientProvider>
  );
}