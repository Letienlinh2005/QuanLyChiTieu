import { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '../../../src/store/appStore';
import { useVi, useXoaVi } from '../../../src/hooks/useVi';
import { useAppTheme } from '../../../src/store/themeStore';
import { formatCurrency } from '../../../src/utils/formatCurrency';

export default function DanhSachViScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const { data: danhSachVi, isLoading, refetch } = useVi(maSoChiTieu);
    const xoaVi = useXoaVi(maSoChiTieu);
    const { colors, isDark } = useAppTheme();

    useFocusEffect(
        useCallback(() => {
            if (maSoChiTieu) {
                refetch();
            }
        }, [maSoChiTieu, refetch])
    );

    const xuLyTuyChon = (item: any) => {
        Alert.alert(
            `Ví "${item.tenVi}"`,
            `Số dư: ${formatCurrency(item.soDuBanDau)}\nBạn muốn thực hiện thao tác nào?`,
            [
                {
                    text: '🔁 Chuyển tiền từ ví này',
                    onPress: () => router.push(`/(tabs)/giao-dich/them?loai=ChuyenKhoan&viNguon=${item.maVi}`),
                },
                {
                    text: '✏️ Sửa ví',
                    onPress: () => router.push(`/vi/sua?id=${item.maVi}`),
                },
                { 
                    text: '🗑️ Xóa ví', 
                    style: 'destructive', 
                    onPress: () => {
                        Alert.alert(
                            'Cảnh báo xóa ví',
                            'Bạn có chắc muốn xóa ví này? Lưu ý: Không thể xóa ví đang chứa giao dịch.',
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

    const danhSach = danhSachVi ?? [];
    const coDu2Vi = danhSach.length >= 2;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Quản lý ví tiền</Text>
            </View>

            {/* Nút Chuyển Tiền Nhanh */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
                <TouchableOpacity
                    style={[
                        styles.btnChuyenTien,
                        {
                            backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                            borderColor: isDark ? '#334155' : '#bfdbfe',
                        },
                    ]}
                    onPress={() => {
                        if (!coDu2Vi) {
                            Alert.alert('Chưa thể chuyển tiền', 'Bạn cần có ít nhất 2 ví tiền để thực hiện chuyển khoản.');
                            return;
                        }
                        router.push('/(tabs)/giao-dich/them?loai=ChuyenKhoan');
                    }}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconChuyenTien, { backgroundColor: colors.primary }]}>
                        <Ionicons name="swap-horizontal" size={20} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.btnChuyenTienTitle, { color: colors.text }]}>
                            Chuyển tiền giữa các ví
                        </Text>
                        <Text style={[styles.btnChuyenTienSub, { color: colors.textMuted }]}>
                            Luân chuyển dòng tiền nội bộ (rút ATM, chuyển ví...)
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={danhSach}
                keyExtractor={(item) => String(item.maVi)}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <Text style={[styles.rongText, { color: colors.textMuted }]}>
                        Chưa có ví nào, bấm nút + để thêm ví mới.
                    </Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.viCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => xuLyTuyChon(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.icon}>{item.bieuTuong}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.tenVi, { color: colors.text }]}>{item.tenVi}</Text>
                            <Text style={[styles.loaiVi, { color: colors.textMuted }]}>
                                {item.loaiVi === 'TienMat' ? 'Tiền mặt' : item.loaiVi === 'NganHang' ? 'Tài khoản ngân hàng' : 'Ví điện tử'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.soDu, { color: colors.text }]}>{formatCurrency(item.soDuBanDau)}</Text>
                            <Text style={[styles.chamTuyChon, { color: colors.primary }]}>Chạm để tùy chọn ▾</Text>
                        </View>
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
    header: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    btnChuyenTien: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 6,
        gap: 12,
    },
    iconChuyenTien: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnChuyenTienTitle: { fontSize: 15, fontWeight: '700' },
    btnChuyenTienSub: { fontSize: 12, marginTop: 2 },
    rongText: { fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
    viCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    icon: { fontSize: 28, marginRight: 14 },
    tenVi: { fontSize: 16, fontWeight: '600' },
    loaiVi: { fontSize: 12, marginTop: 2 },
    soDu: { fontSize: 16, fontWeight: '700' },
    chamTuyChon: { fontSize: 11, marginTop: 4, fontWeight: '500' },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    fabChu: { color: '#fff', fontSize: 30, fontWeight: '400', marginTop: -2 },
});