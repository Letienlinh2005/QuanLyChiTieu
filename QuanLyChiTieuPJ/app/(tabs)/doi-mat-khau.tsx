import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { apiClient } from '../../src/api/client';
import { useAppTheme } from '../../src/store/themeStore';

export default function DoiMatKhauScreen() {
    const { colors } = useAppTheme();
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
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
                    <Text style={[styles.chuBack, { color: colors.primary }]}>‹ Quay lại</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Đổi mật khẩu</Text>
                <View style={{ width: 80 }} />
            </View>

            <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
                <View style={styles.content}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Mật khẩu cũ</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                        placeholder="Nhập mật khẩu hiện tại"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        value={matKhauCu}
                        onChangeText={setMatKhauCu}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Mật khẩu mới</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                        placeholder="Ít nhất 6 ký tự"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        value={matKhauMoi}
                        onChangeText={setMatKhauMoi}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Xác nhận mật khẩu mới</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                        placeholder="Nhập lại mật khẩu mới"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        value={xacNhanMatKhau}
                        onChangeText={setXacNhanMatKhau}
                    />

                    <TouchableOpacity
                        style={[styles.nutLuu, { backgroundColor: colors.primary }]}
                        onPress={xuLyDoiMatKhau}
                        disabled={isPending}
                    >
                        <Text style={styles.nutLuuChu}>
                            {isPending ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderBottomWidth: 1,
    },
    nutBack: { width: 80 },
    chuBack: { fontSize: 16, fontWeight: '600' },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    input: {
        borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16,
    },
    nutLuu: {
        borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32,
    },
    nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
