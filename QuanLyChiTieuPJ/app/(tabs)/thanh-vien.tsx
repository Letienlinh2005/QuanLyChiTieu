import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/appStore';
import { useThanhVienSo, useMoiThanhVien, useXoaThanhVien } from '../../src/hooks/useSoChiTieu';

export default function ThanhVienScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const thongTinUser = useAppStore((s) => s.thongTinUser);
    
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
            <View style={styles.loadingContainer}>
                <Text>Đang tải danh sách thành viên...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
                    <Text style={styles.chuBack}>‹ Quay lại</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Thành viên sổ</Text>
                <View style={{ width: 80 }} />
            </View>

            <View style={styles.formMoi}>
                <TextInput
                    style={styles.inputMoi}
                    placeholder="Nhập email người dùng..."
                    value={emailMoi}
                    onChangeText={setEmailMoi}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TouchableOpacity 
                    style={styles.nutMoi} 
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
                    <View style={styles.card}>
                        <View style={styles.thongTin}>
                            <Text style={styles.email}>{item.hoTen} ({item.email})</Text>
                            <Text style={styles.vaiTro}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb',
    },
    nutBack: { width: 80 },
    chuBack: { color: '#2563eb', fontSize: 16 },
    title: { fontSize: 18, fontWeight: 'bold' },
    
    formMoi: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
        gap: 8,
    },
    inputMoi: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
    },
    nutMoi: {
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 8,
        height: 44,
    },
    chuNutMoi: { color: '#fff', fontWeight: '600' },
    
    list: { padding: 16, gap: 12 },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    thongTin: { flex: 1 },
    email: { fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 4 },
    vaiTro: { fontSize: 13, color: '#6b7280' },
    nutXoa: { padding: 8 },
    chuXoa: { color: '#ef4444', fontWeight: '600' },
});
