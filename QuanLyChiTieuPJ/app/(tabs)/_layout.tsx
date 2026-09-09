import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../src/store/authStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const khoiTaoTuBoNho = useAuthStore((s) => s.khoiTaoTuBoNho);

  useEffect(() => {
    khoiTaoTuBoNho();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}