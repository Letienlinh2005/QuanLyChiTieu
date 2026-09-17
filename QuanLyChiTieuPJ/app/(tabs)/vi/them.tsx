import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useTaoVi } from '../../../src/hooks/useVi';
import { useAppTheme } from '../../../src/store/themeStore';
import { LoaiVi } from '../../../src/types/vi';

const CAC_LOAI_VI: { value: LoaiVi; label: string; icon: string }[] = [
    { value: 'TienMat', label: 'Tiền mặt', icon: '💵' },
    { value: 'NganHang', label: 'Ngân hàng', icon: '🏦' },
    { value: 'ViDienTu', label: 'Ví điện tử', icon: '📱' },
    { value: 'TheTinDung', label: 'Thẻ tín dụng', icon: '💳' },
    { value: 'Khac', label: 'Khác', icon: '📦' },
];

export default function ThemViScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const taoVi = useTaoVi();
    const { colors } = useAppTheme();

    const [tenVi, setTenVi] = useState('');
    const [loaiVi, setLoaiVi] = useState<LoaiVi>('TienMat');
    const [soDuBanDau, setSoDuBanDau] = useState('');

    const xuLyLuu = () => {
        if (!tenVi.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên ví');
            return;
        }
        if (!maSoChiTieu) {
            Alert.alert('Lỗi', 'Chưa xác định được sổ chi tiêu');
            return;
        }

        const loaiDaChon = CAC_LOAI_VI.find((l) => l.value === loaiVi)!;

        taoVi.mutate(
            {
                maSoChiTieu,
                tenVi: tenVi.trim(),
                bieuTuong: loaiDaChon.icon,
                loaiVi,
                soDuBanDau: Number(soDuBanDau.replace(/\D/g, '')) || 0,
            },
            {
                onSuccess: () => router.back(),
                onError: () => Alert.alert('Lỗi', 'Không tạo được ví, thử lại sau'),
            }
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
                    <Text style={[styles.chuBack, { color: colors.primary }]}>‹ Quay lại</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Thêm ví mới</Text>
                <View style={{ width: 80 }} />
            </View>
            <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
                <Text style={[styles.label, { color: colors.text }]}>Tên ví</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="VD: Tiền mặt, Vietcombank..."
                    placeholderTextColor={colors.textMuted}
                    value={tenVi}
                    onChangeText={setTenVi}
                />

                <Text style={[styles.label, { color: colors.text }]}>Loại ví</Text>
                <View style={styles.loaiViRow}>
                    {CAC_LOAI_VI.map((loai) => {
                        const chon = loaiVi === loai.value;
                        return (
                            <TouchableOpacity
                                key={loai.value}
                                style={[
                                    styles.loaiViChip,
                                    {
                                        backgroundColor: chon ? colors.primarySubtle : colors.card,
                                        borderColor: chon ? colors.primary : colors.border,
                                    },
                                ]}
                                onPress={() => setLoaiVi(loai.value)}
                            >
                                <Text style={styles.loaiViIcon}>{loai.icon}</Text>
                                <Text style={[styles.loaiViLabel, { color: chon ? colors.primary : colors.text }]}>
                                    {loai.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Số dư ban đầu</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={soDuBanDau}
                    onChangeText={setSoDuBanDau}
                    keyboardType="numeric"
                />

                <TouchableOpacity
                    style={[styles.nutLuu, { backgroundColor: colors.primary }]}
                    onPress={xuLyLuu}
                    disabled={taoVi.isPending}
                >
                    <Text style={styles.nutLuuChu}>
                        {taoVi.isPending ? 'Đang lưu...' : 'Lưu ví'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    nutBack: { width: 80 },
    chuBack: { fontSize: 16, fontWeight: '500' },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    container: { flex: 1, padding: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    input: { borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16 },
    loaiViRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    loaiViChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 20, borderWidth: 1,
    },
    loaiViIcon: { fontSize: 16 },
    loaiViLabel: { fontSize: 13, fontWeight: '500' },
    nutLuu: { borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32 },
    nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});