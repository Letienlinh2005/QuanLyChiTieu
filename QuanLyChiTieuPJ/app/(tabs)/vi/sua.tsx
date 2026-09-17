import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useCapNhatVi, useVi } from '../../../src/hooks/useVi';
import { LoaiVi } from '../../../src/types/vi';

const CAC_LOAI_VI: { value: LoaiVi; label: string; icon: string }[] = [
    { value: 'TienMat', label: 'Tiền mặt', icon: '💵' },
    { value: 'NganHang', label: 'Ngân hàng', icon: '🏦' },
    { value: 'ViDienTu', label: 'Ví điện tử', icon: '📱' },
    { value: 'TheTinDung', label: 'Thẻ tín dụng', icon: '💳' },
    { value: 'Khac', label: 'Khác', icon: '📦' },
];

export default function SuaViScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const params = useLocalSearchParams();
    const maVi = Number(params.id);
    const { data: danhSachVi } = useVi(maSoChiTieu);
    const capNhatVi = useCapNhatVi(maSoChiTieu);

    const [tenVi, setTenVi] = useState('');
    const [loaiVi, setLoaiVi] = useState<LoaiVi>('TienMat');
    const [soDuBanDau, setSoDuBanDau] = useState('');

    useEffect(() => {
        if (danhSachVi && maVi) {
            const vi = danhSachVi.find((v) => v.maVi === maVi);
            if (vi) {
                setTenVi(vi.tenVi);
                setLoaiVi(vi.loaiVi);
                setSoDuBanDau(String(vi.soDuBanDau));
            }
        }
    }, [danhSachVi, maVi]);

    const xuLyLuu = () => {
        if (!tenVi.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên ví');
            return;
        }

        const loaiDaChon = CAC_LOAI_VI.find((l) => l.value === loaiVi)!;

        capNhatVi.mutate(
            {
                maVi,
                tenVi: tenVi.trim(),
                bieuTuong: loaiDaChon.icon,
                loaiVi,
                soDuBanDau: Number(soDuBanDau.replace(/\D/g, '')) || 0,
            },
            {
                onSuccess: () => router.back(),
                onError: () => Alert.alert('Lỗi', 'Không cập nhật được ví, thử lại sau'),
            }
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Tên ví</Text>
            <TextInput
                style={styles.input}
                placeholder="VD: Tiền mặt, Vietcombank..."
                value={tenVi}
                onChangeText={setTenVi}
            />

            <Text style={styles.label}>Loại ví</Text>
            <View style={styles.loaiViRow}>
                {CAC_LOAI_VI.map((loai) => (
                    <TouchableOpacity
                        key={loai.value}
                        style={[styles.loaiViChip, loaiVi === loai.value && styles.loaiViChipChon]}
                        onPress={() => setLoaiVi(loai.value)}
                    >
                        <Text style={styles.loaiViIcon}>{loai.icon}</Text>
                        <Text style={[styles.loaiViLabel, loaiVi === loai.value && styles.loaiViLabelChon]}>
                            {loai.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Số dư ban đầu</Text>
            <TextInput
                style={styles.input}
                placeholder="0"
                value={soDuBanDau}
                onChangeText={setSoDuBanDau}
                keyboardType="numeric"
            />

            <TouchableOpacity
                style={styles.nutLuu}
                onPress={xuLyLuu}
                disabled={capNhatVi.isPending}
            >
                <Text style={styles.nutLuuChu}>
                    {capNhatVi.isPending ? 'Đang lưu...' : 'Lưu ví'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16, color: '#374151' },
    input: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16,
    },
    loaiViRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    loaiViChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb',
    },
    loaiViChipChon: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
    loaiViIcon: { fontSize: 16 },
    loaiViLabel: { fontSize: 13, color: '#374151' },
    loaiViLabelChon: { color: '#2563eb', fontWeight: '600' },
    nutLuu: {
        backgroundColor: '#2563eb', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32,
    },
    nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});