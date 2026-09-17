import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/appStore';
import { useAuthStore } from '../../src/store/authStore';
import { useThanhVienSo, useMoiThanhVien, useXoaThanhVien } from '../../src/hooks/useSoChiTieu';
import { useAppTheme } from '../../src/store/themeStore';

export default function ThanhVienScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const thongTinUser = useAuthStore((s) => s.nguoiDung);
    const { colors } = useAppTheme();
    
    const { data: thanhVien, isLoading } = useThanhVienSo(maSoChiTieu);
    const moiThanhVien = useMoiThanhVien(maSoChiTieu);
    const xoaThanhVien = useXoaThanhVien(maSoChiTieu);

    const [emailMoi, setEmailMoi] = useState('');

    const xuLyMoi = () => {
        if (!emailMoi) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập email');
            return;
        }
        if (emailMoi === thongTinUser?.email) {
            Alert.alert('Lỗi', 'Bạn không thể mời chính mình');
            return;
        }
        
        moiThanhVien.mutate(emailMoi, {
            onSuccess: () => {
                Alert.alert('Thành công', 'Đã mời thành viên tham gia sổ');
                setEmailMoi('');
            },
            onError: (err: any) => {
                const thongBao = err?.response?.data?.message ?? 'Đã có lỗi xảy ra';
                Alert.alert('Lỗi', thongBao);
            }
        });
    };

    const xuLyXoa = (maNguoiDung: number, email: string) => {
        Alert.alert(
            'Xóa thành viên',
            `Bạn có chắc muốn xóa ${email} khỏi sổ chi tiêu?`,
            [
                { text: 'Hủy', style: 'cancel' },
                { 
                    text: 'Xóa', 
                    style: 'destructive',
                    onPress: () => {
                        xoaThanhVien.mutate(maNguoiDung, {
                            onError: (err: any) => {
                                const thongBao = err?.response?.data?.message ?? 'Đã có lỗi xảy ra';
                                Alert.alert('Lỗi', thongBao);
                            }
                        });
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
                <Text style={{ color: colors.textMuted }}>Đang tải danh sách thành viên...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
                    <Text style={[styles.chuBack, { color: colors.primary }]}>‹ Quay lại</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Thành viên sổ</Text>
                <View style={{ width: 80 }} />
            </View>

            <View style={[styles.formMoi, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                    style={[styles.inputMoi, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="Nhập email người dùng..."
                    placeholderTextColor={colors.textMuted}
                    value={emailMoi}
                    onChangeText={setEmailMoi}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TouchableOpacity 
                    style={[styles.nutMoi, { backgroundColor: colors.primary }]} 
                    onPress={xuLyMoi}
                    disabled={moiThanhVien.isPending}
                >
                    <Text style={styles.chuNutMoi}>
                        {moiThanhVien.isPending ? 'Đang mời...' : 'Mời'}
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={thanhVien}
                keyExtractor={(item) => String(item.maNguoiDung)}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.thongTin}>
                            <Text style={[styles.email, { color: colors.text }]}>{item.hoTen} ({item.email})</Text>
                            <Text style={[styles.vaiTro, { color: colors.textMuted }]}>
                                Vai trò: {item.vaiTro === 'ChuSo' ? 'Chủ sổ' : item.vaiTro === 'QuanTri' ? 'Quản trị' : 'Thành viên'}
                            </Text>
                        </View>
                        {item.vaiTro !== 'ChuSo' && thongTinUser?.email !== item.email && (
                            <TouchableOpacity 
                                style={styles.nutXoa} 
                                onPress={() => xuLyXoa(item.maNguoiDung, item.email)}
                            >
                                <Text style={styles.chuXoa}>Xóa</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderBottomWidth: 1,
    },
    nutBack: { width: 80 },
    chuBack: { fontSize: 16, fontWeight: '600' },
    title: { fontSize: 18, fontWeight: 'bold' },
    
    formMoi: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        gap: 8,
    },
    inputMoi: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 15,
    },
    nutMoi: {
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 8,
        height: 44,
    },
    chuNutMoi: { color: '#fff', fontWeight: '600' },
    
    list: { padding: 16, gap: 12 },
    card: {
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    thongTin: { flex: 1 },
    email: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
    vaiTro: { fontSize: 13 },
    nutXoa: { padding: 8 },
    chuXoa: { color: '#ef4444', fontWeight: '600' },
});
