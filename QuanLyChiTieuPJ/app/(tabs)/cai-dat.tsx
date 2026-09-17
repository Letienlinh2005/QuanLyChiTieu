import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function CaiDatScreen() {
    const nguoiDung = useAuthStore((s) => s.nguoiDung);
    const dangXuat = useAuthStore((s) => s.dangXuat);

    const xuLyDangXuat = async () => {
        await dangXuat();
        router.replace('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.hoTen}>{nguoiDung?.hoTen}</Text>
            <Text style={styles.email}>{nguoiDung?.email}</Text>

            <TouchableOpacity style={styles.nutDanhMuc} onPress={() => router.push('/danh-muc')}>
                <Text style={styles.chuDanhMuc}>Quản lý danh mục cá nhân</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nutDanhMuc} onPress={() => router.push('/thanh-vien')}>
                <Text style={styles.chuDanhMuc}>Thành viên & Sổ gia đình</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.nutDanhMuc, { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }]} onPress={() => router.push('/doi-mat-khau')}>
                <Text style={[styles.chuDanhMuc, { color: '#4b5563' }]}>Đổi mật khẩu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nutDangXuat} onPress={xuLyDangXuat}>
                <Text style={styles.chuDangXuat}>Đăng xuất</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, paddingTop: 60 },
    hoTen: { fontSize: 20, fontWeight: 'bold' },
    email: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 40 },
    nutDanhMuc: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    chuDanhMuc: { color: '#2563eb', fontWeight: '600' },
    nutDangXuat: {
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    chuDangXuat: { color: '#dc2626', fontWeight: '600' },
});