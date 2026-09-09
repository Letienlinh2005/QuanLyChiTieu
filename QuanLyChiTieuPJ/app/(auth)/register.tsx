import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useDangKy } from '../../src/hooks/useAuth';

export default function RegisterScreen() {
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const dangKy = useDangKy();

  const xuLyDangKy = () => {
    if (!hoTen || !email || !matKhau) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường');
      return;
    }

    dangKy.mutate(
      { hoTen, email, matKhau },
      {
        onSuccess: () => router.replace('/(tabs)'),
        onError: () => Alert.alert('Lỗi', 'Đăng ký thất bại, email có thể đã tồn tại'),
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo tài khoản</Text>

      <TextInput
        style={styles.input}
        placeholder="Họ tên"
        value={hoTen}
        onChangeText={setHoTen}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={matKhau}
        onChangeText={setMatKhau}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={xuLyDangKy}
        disabled={dangKy.isPending}
      >
        <Text style={styles.buttonText}>
          {dangKy.isPending ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#2563eb', textAlign: 'center', marginTop: 20 },
});