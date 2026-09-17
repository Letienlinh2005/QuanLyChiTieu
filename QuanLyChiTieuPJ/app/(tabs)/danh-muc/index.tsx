import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useDanhMuc, useXoaDanhMuc } from '../../../src/hooks/useDanhMuc';

export default function QuanLyDanhMucScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const { data: danhSach, isLoading } = useDanhMuc(maSoChiTieu);
    const xoaDanhMuc = useXoaDanhMuc(maSoChiTieu);

    const xuLyTuyChon = (item: any) => {
        Alert.alert(
            'Tùy chọn danh mục',
            `Bạn muốn làm gì với danh mục "${item.tenDanhMuc}"?`,
            [
                { text: 'Sửa', onPress: () => router.push(`/danh-muc/sua?id=${item.maDanhMuc}`) },
                { 
                    text: 'Xóa', 
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Cảnh báo',
                            'Bạn có chắc muốn xóa danh mục này? Không thể xóa nếu đã có giao dịch.',
                            [
                                { text: 'Hủy', style: 'cancel' },
                                { 
                                    text: 'Xóa', 
                                    style: 'destructive', 
                                    onPress: () => xoaDanhMuc.mutate(item.maDanhMuc, {
                                        onError: (err: any) => Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xóa danh mục')
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
                    <Text style={styles.chuBack}>‹ Quay lại</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Quản lý Danh mục</Text>
                <View style={{ width: 80 }} />
            </View>

            <FlatList
                data={danhSach ?? []}
                keyExtractor={(item) => String(item.maDanhMuc)}
                contentContainerStyle={{ padding: 16 }}
                ListHeaderComponent={
                    <TouchableOpacity style={styles.nutThem} onPress={() => router.push('/danh-muc/them')}>
                        <Text style={styles.nutThemChu}>+ Thêm danh mục mới</Text>
                    </TouchableOpacity>
                }
                ListEmptyComponent={
                    <Text style={styles.rongText}>Chưa có danh mục nào.</Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.card}
                        onLongPress={() => xuLyTuyChon(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.icon}>{item.bieuTuong}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.ten}>{item.tenDanhMuc}</Text>
                        </View>
                        <Text style={[styles.loai, { color: item.loai === 'Thu' ? '#16a34a' : '#dc2626' }]}>
                            {item.loai}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb',
    },
    nutBack: { width: 80 },
    chuBack: { color: '#2563eb', fontSize: 16 },
    title: { fontSize: 18, fontWeight: 'bold' },
    nutThem: {
        backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16,
        borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'dashed',
    },
    nutThemChu: { color: '#2563eb', fontWeight: '600', fontSize: 15 },
    rongText: { color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb',
    },
    icon: { fontSize: 24, marginRight: 12 },
    ten: { fontSize: 16, fontWeight: '500' },
    loai: { fontSize: 14, fontWeight: '600' },
});
