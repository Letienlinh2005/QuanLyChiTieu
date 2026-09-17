import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useDanhMuc, useXoaDanhMuc } from '../../../src/hooks/useDanhMuc';
import { useAppTheme } from '../../../src/store/themeStore';

export default function QuanLyDanhMucScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const { data: danhSach, isLoading } = useDanhMuc(maSoChiTieu);
    const xoaDanhMuc = useXoaDanhMuc(maSoChiTieu);
    const { isDark, colors } = useAppTheme();

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
            <View style={[styles.trangThai, { backgroundColor: colors.bg }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
                    <Text style={[styles.chuBack, { color: colors.primary }]}>‹ Quay lại</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Quản lý Danh mục</Text>
                <View style={{ width: 80 }} />
            </View>

            <FlatList
                data={danhSach ?? []}
                keyExtractor={(item) => String(item.maDanhMuc)}
                contentContainerStyle={{ padding: 16 }}
                ListHeaderComponent={
                    <TouchableOpacity 
                        style={[
                            styles.nutThem, 
                            { 
                                backgroundColor: isDark ? '#18181b' : '#eff6ff', 
                                borderColor: isDark ? '#3f3f46' : '#bfdbfe' 
                            }
                        ]} 
                        onPress={() => router.push('/danh-muc/them')}
                    >
                        <Text style={[styles.nutThemChu, { color: colors.primary }]}>+ Thêm danh mục mới</Text>
                    </TouchableOpacity>
                }
                ListEmptyComponent={
                    <Text style={[styles.rongText, { color: colors.textMuted }]}>Chưa có danh mục nào.</Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onLongPress={() => xuLyTuyChon(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.icon}>{item.bieuTuong}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.ten, { color: colors.text }]}>{item.tenDanhMuc}</Text>
                        </View>
                        <Text style={[styles.loai, { color: item.loai === 'Thu' ? '#10b981' : '#ef4444' }]}>
                            {item.loai}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderBottomWidth: 1,
    },
    nutBack: { width: 80 },
    chuBack: { fontSize: 16, fontWeight: '600' },
    title: { fontSize: 18, fontWeight: 'bold' },
    nutThem: {
        borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16,
        borderWidth: 1, borderStyle: 'dashed',
    },
    nutThemChu: { fontWeight: '600', fontSize: 15 },
    rongText: { fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1,
    },
    icon: { fontSize: 24, marginRight: 12 },
    ten: { fontSize: 16, fontWeight: '500' },
    loai: { fontSize: 14, fontWeight: '600' },
});
