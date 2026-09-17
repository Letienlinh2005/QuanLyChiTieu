import { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useVi, useXoaVi } from '../../../src/hooks/useVi';
import { useAppTheme } from '../../../src/store/themeStore';
import { formatCurrency } from '../../../src/utils/formatCurrency';

export default function DanhSachViScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const { data: danhSachVi, isLoading, refetch } = useVi(maSoChiTieu);
    const xoaVi = useXoaVi(maSoChiTieu);
    const { colors } = useAppTheme();

    useFocusEffect(
        useCallback(() => {
            if (maSoChiTieu) {
                refetch();
            }
        }, [maSoChiTieu, refetch])
    );

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
            <SafeAreaView style={[styles.trangThai, { backgroundColor: colors.bg }]} edges={['top']}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
            <FlatList
                data={danhSachVi ?? []}
                keyExtractor={(item) => String(item.maVi)}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <Text style={[styles.rongText, { color: colors.textMuted }]}>Chưa có ví nào, bấm nút + để thêm ví mới.</Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.viCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onLongPress={() => xuLyTuyChon(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.icon}>{item.bieuTuong}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.tenVi, { color: colors.text }]}>{item.tenVi}</Text>
                            <Text style={[styles.loaiVi, { color: colors.textMuted }]}>{item.loaiVi}</Text>
                        </View>
                        <Text style={[styles.soDu, { color: colors.text }]}>{formatCurrency(item.soDuBanDau)}</Text>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/vi/them')}
            >
                <Text style={styles.fabChu}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    rongText: { fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
    viCard: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1,
    },
    icon: { fontSize: 26, marginRight: 14 },
    tenVi: { fontSize: 16, fontWeight: '600' },
    loaiVi: { fontSize: 12, marginTop: 2 },
    soDu: { fontSize: 15, fontWeight: '600' },
    fab: {
        position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
        elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    fabChu: { color: '#fff', fontSize: 30, fontWeight: '400', marginTop: -2 },
});