import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../../src/api/client';

export default function DoiMatKhauScreen() {
    const [matKhauCu, setMatKhauCu] = useState('');
    const [matKhauMoi, setMatKhauMoi] = useState('');
    const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
    const [isPending, setIsPending] = useState(false);

    const xuLyDoiMatKhau = async () => {
        if (!matKhauCu || !matKhauMoi || !xacNhanMatKhau) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ các trường');
            return;
        }

        if (matKhauMoi !== xacNhanMatKhau) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }

        if (matKhauMoi.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setIsPending(true);
            await apiClient.patch('/auth/doi-mat-khau', {
                matKhauCu,
                matKhauMoi
            });
            Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (err: any) {
            const thongBao = err?.response?.data?.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại sau';
            Alert.alert('Lỗi', thongBao);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
                    <Text style={styles.chuBack}>‹ Quay lại</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Đổi mật khẩu</Text>
                <View style={{ width: 80 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Mật khẩu cũ</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu hiện tại"
                    secureTextEntry
                    value={matKhauCu}
                    onChangeText={setMatKhauCu}
                />

                <Text style={styles.label}>Mật khẩu mới</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ít nhất 6 ký tự"
                    secureTextEntry
                    value={matKhauMoi}
                    onChangeText={setMatKhauMoi}
                />

                <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu mới"
                    secureTextEntry
                    value={xacNhanMatKhau}
                    onChangeText={setXacNhanMatKhau}
                />

                <TouchableOpacity
                    style={styles.nutLuu}
                    onPress={xuLyDoiMatKhau}
                    disabled={isPending}
                >
                    <Text style={styles.nutLuuChu}>
                        {isPending ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb',
    },
    nutBack: { width: 80 },
    chuBack: { color: '#2563eb', fontSize: 16 },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16, color: '#374151' },
    input: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16, backgroundColor: '#fff'
    },
    nutLuu: {
        backgroundColor: '#2563eb', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32,
    },
    nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
