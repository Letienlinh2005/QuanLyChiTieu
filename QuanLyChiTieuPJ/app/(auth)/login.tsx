import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useDangNhap } from '../../src/hooks/useAuth';
import { useAppTheme } from '../../src/store/themeStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const dangNhap = useDangNhap();
  const { isDark, colors } = useAppTheme();

  const xuLyDangNhap = () => {
    if (!email.trim() || !matKhau.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    dangNhap.mutate(
      { email: email.trim(), matKhau },
      {
        onSuccess: () => router.replace('/(tabs)/trang-chu'),
        onError: (err: any) => {
          const thongBao = err?.response?.data?.message ?? 'Email hoặc mật khẩu không đúng';
          Alert.alert('Đăng nhập thất bại', thongBao);
        },
      }
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Brand Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                  borderColor: isDark ? '#334155' : '#dbeafe',
                },
              ]}
            >
              <Text style={styles.logoEmoji}>💰</Text>
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>Quản Lý Chi Tiêu</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
              Đăng nhập để theo dõi tài chính cá nhân
            </Text>
          </View>

          {/* Form Box */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1a1a1a' : '#f9fafb',
                    borderColor: isDark ? '#333338' : '#d1d5db',
                    color: colors.text,
                  },
                ]}
                placeholder="vidu@email.com"
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Mật khẩu</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1a1a1a' : '#f9fafb',
                    borderColor: isDark ? '#333338' : '#d1d5db',
                    color: colors.text,
                  },
                ]}
                placeholder="Nhập mật khẩu của bạn"
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                value={matKhau}
                onChangeText={setMatKhau}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={xuLyDangNhap}
              disabled={dangNhap.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {dangNhap.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Chưa có tài khoản?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.link, { color: colors.primary }]}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  logoEmoji: {
    fontSize: 34,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
});