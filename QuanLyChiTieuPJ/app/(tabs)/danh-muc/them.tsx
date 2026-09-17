import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useTaoDanhMuc } from '../../../src/hooks/useDanhMuc';
import { LoaiDanhMuc } from '../../../src/types/danhMuc';

export default function ThemDanhMucScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const taoDanhMuc = useTaoDanhMuc();

    const [tenDanhMuc, setTenDanhMuc] = useState('');
    const [loai, setLoai] = useState<LoaiDanhMuc>('Chi');
    const [bieuTuong, setBieuTuong] = useState('📌');

    const xuLyLuu = () => {
        if (!tenDanhMuc.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên danh mục');
            return;
        }

        taoDanhMuc.mutate(
            {
                maSoChiTieu: maSoChiTieu!,
                tenDanhMuc: tenDanhMuc.trim(),
                bieuTuong,
                loai,
            },
            {
                onSuccess: () => router.back(),
                onError: () => Alert.alert('Lỗi', 'Không tạo được danh mục, thử lại sau'),
            }
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
                    <Text style={styles.chuBack}>‹ Hủy</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Thêm danh mục</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Tên danh mục</Text>
                <TextInput
                    style={styles.input}
                    placeholder="VD: Ăn sáng, Cà phê..."
                    value={tenDanhMuc}
                    onChangeText={setTenDanhMuc}
                />

                <Text style={styles.label}>Biểu tượng (Emoji)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="VD: 🍔"
                    value={bieuTuong}
                    onChangeText={setBieuTuong}
                    maxLength={2}
                />

                <Text style={styles.label}>Loại</Text>
                <View style={styles.loaiRow}>
                    <TouchableOpacity
                        style={[styles.loaiChip, loai === 'Chi' && styles.loaiChipChi]}
                        onPress={() => setLoai('Chi')}
                    >
                        <Text style={[styles.loaiLabel, loai === 'Chi' && { color: '#dc2626' }]}>Khoản chi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.loaiChip, loai === 'Thu' && styles.loaiChipThu]}
                        onPress={() => setLoai('Thu')}
                    >
                        <Text style={[styles.loaiLabel, loai === 'Thu' && { color: '#16a34a' }]}>Khoản thu</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.nutLuu}
                    onPress={xuLyLuu}
                    disabled={taoDanhMuc.isPending}
                >
                    <Text style={styles.nutLuuChu}>
                        {taoDanhMuc.isPending ? 'Đang lưu...' : 'Lưu danh mục'}
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
    nutBack: { width: 60 },
    chuBack: { color: '#2563eb', fontSize: 16 },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16, color: '#374151' },
    input: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16, backgroundColor: '#fff'
    },
    loaiRow: { flexDirection: 'row', gap: 10 },
    loaiChip: {
        flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8,
        borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff'
    },
    loaiChipChi: { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
    loaiChipThu: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
    loaiLabel: { fontSize: 15, fontWeight: '500', color: '#6b7280' },
    nutLuu: {
        backgroundColor: '#2563eb', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32,
    },
    nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
