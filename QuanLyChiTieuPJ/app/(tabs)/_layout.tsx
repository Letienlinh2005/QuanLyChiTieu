import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '../../src/store/themeStore';

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="trang-chu"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vi/index"
        options={{
          title: 'Ví',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="vi/them" options={{ href: null }} />
      <Tabs.Screen
        name="giao-dich/index"
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="giao-dich/them" options={{ href: null }} />
      <Tabs.Screen
        name="ngan-sach/index"
        options={{
          title: 'Ngân sách',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'pie-chart' : 'pie-chart-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="ngan-sach/them" options={{ href: null }} />
      <Tabs.Screen
        name="bao-cao"
        options={{
          title: 'Báo cáo',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cai-dat"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
        }}
      />
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