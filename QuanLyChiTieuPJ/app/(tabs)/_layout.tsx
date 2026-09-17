import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="trang-chu" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="vi/index" options={{ title: 'Ví' }} />
      <Tabs.Screen name="vi/them" options={{ href: null }} />
      <Tabs.Screen name="giao-dich/index" options={{ title: 'Giao dịch' }} />
      <Tabs.Screen name="giao-dich/them" options={{ href: null }} />
      <Tabs.Screen name="ngan-sach/index" options={{ title: 'Ngân sách' }} />
      <Tabs.Screen name="ngan-sach/them" options={{ href: null }} />
      <Tabs.Screen name="bao-cao" options={{ title: 'Báo cáo' }} />
      <Tabs.Screen name="cai-dat" options={{ title: 'Cài đặt' }} />
      <Tabs.Screen name="vi/sua" options={{ href: null }} />
      <Tabs.Screen name="giao-dich/sua" options={{ href: null }} />
      <Tabs.Screen name="ngan-sach/sua" options={{ href: null }} />
      <Tabs.Screen name="danh-muc/index" options={{ href: null }} />
      <Tabs.Screen name="danh-muc/them" options={{ href: null }} />
      <Tabs.Screen name="danh-muc/sua" options={{ href: null }} />
      <Tabs.Screen name="doi-mat-khau" options={{ href: null }} />
      <Tabs.Screen name="thanh-vien" options={{ href: null }} />
    </Tabs>
  );
}