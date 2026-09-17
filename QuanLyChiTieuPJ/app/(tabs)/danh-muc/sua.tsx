import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useCapNhatDanhMuc, useDanhMuc } from '../../../src/hooks/useDanhMuc';
import { LoaiDanhMuc } from '../../../src/types/danhMuc';
import { useAppTheme } from '../../../src/store/themeStore';

export default function SuaDanhMucScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const params = useLocalSearchParams();
    const maDanhMuc = Number(params.id);
    const { isDark, colors } = useAppTheme();
    
    const { data: danhSach } = useDanhMuc(maSoChiTieu);
    const capNhatDanhMuc = useCapNhatDanhMuc(maSoChiTieu);

    const [tenDanhMuc, setTenDanhMuc] = useState('');
    const [loai, setLoai] = useState<LoaiDanhMuc>('Chi');
    const [bieuTuong, setBieuTuong] = useState('📌');

    useEffect(() => {
        if (danhSach && maDanhMuc) {
            const dm = danhSach.find(d => d.maDanhMuc === maDanhMuc);
            if (dm) {
                setTenDanhMuc(dm.tenDanhMuc);
                setLoai(dm.loai);
                setBieuTuong(dm.bieuTuong || '📌');
            }
        }
    }, [danhSach, maDanhMuc]);

    const xuLyLuu = () => {
        if (!tenDanhMuc.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên danh mục');
            return;
        }

        capNhatDanhMuc.mutate(
            {
                maDanhMuc,
                tenDanhMuc: tenDanhMuc.trim(),
                bieuTuong,
                loai,
            },
            {
                onSuccess: () => router.back(),
                onError: () => Alert.alert('Lỗi', 'Không cập nhật được danh mục, thử lại sau'),
            }
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
                    <Text style={[styles.chuBack, { color: colors.primary }]}>‹ Hủy</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Sửa danh mục</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
                <View style={styles.content}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Tên danh mục</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                        placeholder="VD: Ăn sáng, Cà phê..."
                        placeholderTextColor={colors.textMuted}
                        value={tenDanhMuc}
                        onChangeText={setTenDanhMuc}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Biểu tượng (Emoji)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                        placeholder="VD: 🍔"
                        placeholderTextColor={colors.textMuted}
                        value={bieuTuong}
                        onChangeText={setBieuTuong}
                        maxLength={2}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Loại</Text>
                    <View style={styles.loaiRow}>
                        <TouchableOpacity
                            style={[
                                styles.loaiChip,
                                { backgroundColor: colors.card, borderColor: colors.border },
                                loai === 'Chi' && {
                                    borderColor: '#ef4444',
                                    backgroundColor: isDark ? '#450a0a' : '#fef2f2',
                                },
                            ]}
                            onPress={() => setLoai('Chi')}
                        >
                            <Text style={[styles.loaiLabel, { color: colors.textSecondary }, loai === 'Chi' && { color: '#ef4444', fontWeight: '600' }]}>
                                Khoản chi
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.loaiChip,
                                { backgroundColor: colors.card, borderColor: colors.border },
                                loai === 'Thu' && {
                                    borderColor: '#10b981',
                                    backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                                },
                            ]}
                            onPress={() => setLoai('Thu')}
                        >
                            <Text style={[styles.loaiLabel, { color: colors.textSecondary }, loai === 'Thu' && { color: '#10b981', fontWeight: '600' }]}>
                                Khoản thu
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.nutLuu, { backgroundColor: colors.primary }]}
                        onPress={xuLyLuu}
                        disabled={capNhatDanhMuc.isPending}
                    >
                        <Text style={styles.nutLuuChu}>
                            {capNhatDanhMuc.isPending ? 'Đang lưu...' : 'Lưu danh mục'}
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
    nutBack: { width: 60 },
    chuBack: { fontSize: 16, fontWeight: '600' },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    input: {
        borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16,
    },
    loaiRow: { flexDirection: 'row', gap: 10 },
    loaiChip: {
        flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8,
        borderWidth: 1,
    },
    loaiLabel: { fontSize: 15, fontWeight: '500' },
    nutLuu: {
        borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32,
    },
    nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
