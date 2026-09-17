import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useVi, useXoaVi } from '../../../src/hooks/useVi';
import { formatCurrency } from '../../../src/utils/formatCurrency';

export default function DanhSachViScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const { data: danhSachVi, isLoading } = useVi(maSoChiTieu);
    const xoaVi = useXoaVi(maSoChiTieu);

    const xuLyTuyChon = (item: any) => {
        Alert.alert(
            'Tùy chọn ví',
            `Bạn muốn làm gì với ví "${item.tenVi}"?`,
            [
                { text: 'Sửa', onPress: () => router.push(`/vi/sua?id=${item.maVi}`) },
                { 
                    text: 'Xóa', 
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Cảnh báo',
                            'Bạn có chắc muốn xóa ví này? Tất cả giao dịch liên quan sẽ bị mất nếu ví chứa dữ liệu.',
                            [
                                { text: 'Hủy', style: 'cancel' },
                                { 
                                    text: 'Xóa', 
                                    style: 'destructive', 
                                    onPress: () => xoaVi.mutate(item.maVi, {
                                        onError: (err: any) => Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xóa ví')
                                    }) 
                                }
                            ]
                        );
                    }
                },
                { text: 'Hủy', style: 'cancel' }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.trangThai}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={danhSachVi ?? []}
                keyExtractor={(item) => String(item.maVi)}
                contentContainerStyle={{ padding: 16 }}
                ListHeaderComponent={
                    <TouchableOpacity style={styles.nutThem} onPress={() => router.push('/vi/them')}>
                        <Text style={styles.nutThemChu}>+ Thêm ví mới</Text>
                    </TouchableOpacity>
                }
                ListEmptyComponent={
                    <Text style={styles.rongText}>Chưa có ví nào, bấm &quot;Thêm ví mới&quot; để bắt đầu.</Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.viCard}
                        onLongPress={() => xuLyTuyChon(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.icon}>{item.bieuTuong}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.tenVi}>{item.tenVi}</Text>
                            <Text style={styles.loaiVi}>{item.loaiVi}</Text>
                        </View>
                        <Text style={styles.soDu}>{formatCurrency(item.soDuBanDau)}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    rongText: { color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
    nutThem: {
        backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, alignItems: 'center',
        marginBottom: 16, borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'dashed',
    },
    nutThemChu: { color: '#2563eb', fontWeight: '600' },
    viCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb',
    },
    icon: { fontSize: 26, marginRight: 14 },
    tenVi: { fontSize: 16, fontWeight: '600' },
    loaiVi: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    soDu: { fontSize: 15, fontWeight: '600' },
});