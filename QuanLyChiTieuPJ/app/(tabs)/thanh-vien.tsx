import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '../../src/store/appStore';
import { useAuthStore } from '../../src/store/authStore';
import {
    useSoChiTieuCuaToi,
    useThanhVienSo,
    useMoiThanhVien,
    useXoaThanhVien,
    useLoiMoiDen,
    useLoiMoiDaGui,
    useChapNhanLoiMoi,
    useTuChoiLoiMoi,
    useHuyLoiMoi,
    useCapNhatVaiTro,
} from '../../src/hooks/useSoChiTieu';
import { useAppTheme } from '../../src/store/themeStore';

export default function ThanhVienScreen() {
    const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
    const chonSoChiTieu = useAppStore((s) => s.chonSoChiTieu);
    const thongTinUser = useAuthStore((s) => s.nguoiDung);
    const { colors, isDark } = useAppTheme();

    const [modalDoiSo, setModalDoiSo] = useState(false);
    const [emailMoi, setEmailMoi] = useState('');

    const { data: danhSachSo = [] } = useSoChiTieuCuaToi();
    const { data: thanhVien = [], isLoading: dangTaiThanhVien } = useThanhVienSo(maSoChiTieu);
    const { data: loiMoiDen = [] } = useLoiMoiDen();
    const { data: loiMoiDaGui = [] } = useLoiMoiDaGui(maSoChiTieu);

    // Mutations
    const moiThanhVien = useMoiThanhVien(maSoChiTieu);
    const xoaThanhVien = useXoaThanhVien(maSoChiTieu);
    const chapNhanLoiMoi = useChapNhanLoiMoi();
    const tuChoiLoiMoi = useTuChoiLoiMoi();
    const huyLoiMoi = useHuyLoiMoi(maSoChiTieu);
    const capNhatVaiTro = useCapNhatVaiTro(maSoChiTieu);

    // Thông tin sổ hiện tại
    const soHienTai = danhSachSo.find((s) => s.MaSoChiTieu === maSoChiTieu);
    const laChuSo = soHienTai?.VaiTro === 'ChuSo';
    const laQuanTri = soHienTai?.VaiTro === 'QuanTri' || laChuSo;
    const laSoGiaDinh = soHienTai?.LoaiSo === 'GiaDinh';

    const xuLyMoi = () => {
        const email = emailMoi.trim();
        if (!email) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập email người cần mời');
            return;
        }
        if (email.toLowerCase() === thongTinUser?.email.toLowerCase()) {
            Alert.alert('Lỗi', 'Bạn không thể mời chính mình');
            return;
        }

        moiThanhVien.mutate(email, {
            onSuccess: (data: any) => {
                Alert.alert(
                    'Đã gửi lời mời 🎉',
                    data?.message || 'Đã gửi lời mời thành công! Người nhận sẽ thấy lời mời khi mở ứng dụng.'
                );
                setEmailMoi('');
            },
            onError: (err: any) => {
                const thongBao = err?.response?.data?.message ?? 'Đã có lỗi xảy ra khi gửi lời mời';
                Alert.alert('Lỗi', thongBao);
            },
        });
    };

    const xuLyChapNhan = (maLoiMoi: number, tenSo: string) => {
        chapNhanLoiMoi.mutate(maLoiMoi, {
            onSuccess: (res) => {
                Alert.alert('Thành công', `Bạn đã tham gia sổ "${tenSo}"!`);
                if (res.maSoChiTieu) {
                    chonSoChiTieu(res.maSoChiTieu);
                }
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message || 'Không thể chấp nhận lời mời';
                Alert.alert('Lỗi', msg);
            },
        });
    };

    const xuLyTuChoi = (maLoiMoi: number) => {
        Alert.alert('Từ chối', 'Bạn có chắc muốn từ chối lời mời này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Từ chối',
                style: 'destructive',
                onPress: () => {
                    tuChoiLoiMoi.mutate(maLoiMoi, {
                        onError: (err: any) => {
                            const msg = err?.response?.data?.message || 'Không thể từ chối';
                            Alert.alert('Lỗi', msg);
                        },
                    });
                },
            },
        ]);
    };

    const xuLyHuyLoiMoi = (maLoiMoi: number, email: string) => {
        Alert.alert('Hủy lời mời', `Bạn có chắc muốn thu hồi lời mời gửi tới ${email}?`, [
            { text: 'Không', style: 'cancel' },
            {
                text: 'Hủy lời mời',
                style: 'destructive',
                onPress: () => {
                    huyLoiMoi.mutate(maLoiMoi);
                },
            },
        ]);
    };

    const xuLyXoaThanhVien = (maNguoiDung: number, email: string) => {
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
                            },
                        });
                    },
                },
            ]
        );
    };

    const xuLyRoiSo = (maNguoiDung: number) => {
        Alert.alert(
            'Rời sổ chi tiêu',
            'Bạn có chắc muốn rời khỏi sổ chi tiêu này? Bạn sẽ không còn quyền truy cập dữ liệu sổ này nữa.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Rời sổ',
                    style: 'destructive',
                    onPress: () => {
                        xoaThanhVien.mutate(maNguoiDung, {
                            onSuccess: () => {
                                Alert.alert('Thành công', 'Bạn đã rời sổ thành công.');
                                const soConLai = danhSachSo.filter((s) => s.MaSoChiTieu !== maSoChiTieu);
                                if (soConLai.length > 0) {
                                    chonSoChiTieu(soConLai[0].MaSoChiTieu);
                                }
                            },
                            onError: (err: any) => {
                                const thongBao = err?.response?.data?.message ?? 'Đã có lỗi xảy ra khi rời sổ';
                                Alert.alert('Lỗi', thongBao);
                            },
                        });
                    },
                },
            ]
        );
    };

    const xuLyDoiVaiTro = (maNguoiDung: number, hoTen: string, vaiTroHienTai: string) => {
        const vaiTroMoi = vaiTroHienTai === 'QuanTri' ? 'ThanhVien' : 'QuanTri';
        const tenVaiTroMoi = vaiTroMoi === 'QuanTri' ? 'Quản trị viên' : 'Thành viên thường';
        Alert.alert(
            'Phân quyền thành viên',
            `Bạn có muốn đặt vai trò của "${hoTen}" thành "${tenVaiTroMoi}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: () => {
                        capNhatVaiTro.mutate(
                            { maNguoiDung, vaiTro: vaiTroMoi },
                            {
                                onSuccess: (data: any) => {
                                    Alert.alert('Thành công', data?.message || 'Đã cập nhật vai trò!');
                                },
                                onError: (err: any) => {
                                    const msg = err?.response?.data?.message || 'Không thể đổi vai trò';
                                    Alert.alert('Lỗi', msg);
                                },
                            }
                        );
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
                    <Text style={[styles.chuBack, { color: colors.primary }]}>‹ Quay lại</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Quản lý Sổ & Thành viên</Text>
                <View style={{ width: 80 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* 1. Phần Lời Mời Nhận Được (Nếu có) */}
                {loiMoiDen.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Ionicons name="mail-unread" size={20} color="#f59e0b" />
                            <Text style={[styles.sectionTitle, { color: '#f59e0b', marginBottom: 0 }]}>
                                LỜI MỜI THAM GIA GIA ĐÌNH ({loiMoiDen.length})
                            </Text>
                        </View>
                        {loiMoiDen.map((item) => (
                            <View
                                key={item.maLoiMoi}
                                style={[
                                    styles.loiMoiCard,
                                    { backgroundColor: isDark ? '#292524' : '#fef3c7', borderColor: '#f59e0b' },
                                ]}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.tenSoLoiMoi, { color: colors.text }]}>
                                        👨‍👩‍👧‍👦 {item.tenSo}
                                    </Text>
                                    <Text style={[styles.nguoiMoiText, { color: colors.textMuted }]}>
                                        Từ: <Text style={{ fontWeight: '600', color: colors.text }}>{item.hoTenNguoiMoi}</Text> ({item.emailNguoiMoi})
                                    </Text>
                                </View>
                                <View style={styles.loiMoiButtons}>
                                    <TouchableOpacity
                                        style={[styles.btnLoiMoi, { backgroundColor: '#10b981' }]}
                                        onPress={() => xuLyChapNhan(item.maLoiMoi, item.tenSo)}
                                        disabled={chapNhanLoiMoi.isPending}
                                    >
                                        <Text style={styles.btnLoiMoiText}>Đồng ý</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.btnLoiMoi, { backgroundColor: '#ef4444' }]}
                                        onPress={() => xuLyTuChoi(item.maLoiMoi)}
                                        disabled={tuChoiLoiMoi.isPending}
                                    >
                                        <Text style={styles.btnLoiMoiText}>Từ chối</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* 2. Sổ Chi Tiêu Hiện Tại & Chuyển Sổ */}
                <View style={[styles.cardSoHienTai, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.labelSo, { color: colors.textMuted }]}>SỔ CHI TIÊU ĐANG CHỌN</Text>
                        <Text style={[styles.tenSoHienTai, { color: colors.text }]}>
                            {soHienTai?.LoaiSo === 'GiaDinh' ? '👨‍👩‍👧‍👦' : '👤'} {soHienTai?.TenSo || 'Chưa chọn sổ'}
                        </Text>
                        <Text style={[styles.loaiSoBadge, { color: colors.primary }]}>
                            {soHienTai?.LoaiSo === 'GiaDinh' ? 'Sổ Gia Đình / Nhóm' : 'Sổ Cá Nhân'} • Vai trò: {soHienTai?.VaiTro === 'ChuSo' ? 'Chủ Sổ' : soHienTai?.VaiTro === 'QuanTri' ? 'Quản Trị Viên' : 'Thành Viên'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.btnDoiSo, { backgroundColor: colors.primarySubtle }]}
                        onPress={() => setModalDoiSo(true)}
                    >
                        <Text style={[styles.btnDoiSoText, { color: colors.primary }]}>Đổi sổ ▾</Text>
                    </TouchableOpacity>
                </View>

                {/* 3. Form Gửi Lời Mời hoặc Thông báo quyền */}
                {!laSoGiaDinh ? (
                    <View style={[styles.boxMoi, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
                            <Text style={[styles.titleBox, { color: colors.text, marginBottom: 0 }]}>
                                Sổ Cá Nhân
                            </Text>
                        </View>
                        <Text style={[styles.subTitleBox, { color: colors.textMuted }]}>
                            Đây là sổ chi tiêu cá nhân riêng tư. Để chia sẻ chi tiêu cùng người thân hoặc nhóm bạn bè, bạn hãy chuyển sang Sổ Gia Đình hoặc tạo thêm Sổ mới.
                        </Text>
                    </View>
                ) : !laQuanTri ? (
                    <View style={[styles.boxMoi, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Ionicons name="shield-checkmark" size={18} color="#3b82f6" />
                            <Text style={[styles.titleBox, { color: colors.text, marginBottom: 0 }]}>
                                Quyền Hạn Thành Viên
                            </Text>
                        </View>
                        <Text style={[styles.subTitleBox, { color: colors.textMuted }]}>
                            Chỉ Chủ sổ hoặc Quản trị viên mới có quyền mời người mới vào sổ gia đình này. Bạn đang tham gia với tư cách Thành viên.
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.boxMoi, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.titleBox, { color: colors.text }]}>
                            💌 Mời người thân vào sổ
                        </Text>
                        <Text style={[styles.subTitleBox, { color: colors.textMuted }]}>
                            Nhập email tài khoản người thân để mời vào sổ gia đình này. Khi họ bấm đồng ý, cả hai có thể quản lý chi tiêu chung.
                        </Text>
                        <View style={styles.formRow}>
                            <TextInput
                                style={[
                                    styles.inputMoi,
                                    {
                                        backgroundColor: colors.inputBg,
                                        borderColor: colors.inputBorder,
                                        color: colors.text,
                                    },
                                ]}
                                placeholder="Nhập email người thân..."
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
                                    {moiThanhVien.isPending ? 'Đang gửi...' : 'Gửi lời mời'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* 4. Danh Sách Lời Mời Đang Chờ Phản Hồi */}
                {loiMoiDaGui.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                            ⏳ ĐANG CHỜ PHẢN HỒI ({loiMoiDaGui.length})
                        </Text>
                        {loiMoiDaGui.map((item) => (
                            <View
                                key={item.maLoiMoi}
                                style={[styles.cardThanhVien, { backgroundColor: colors.card, borderColor: colors.border }]}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.tenThanhVien, { color: colors.text }]}>
                                        {item.hoTen} ({item.email})
                                    </Text>
                                    <Text style={[styles.vaiTroText, { color: '#f59e0b' }]}>
                                        ⏳ Đã gửi lời mời • Chờ người nhận đồng ý
                                    </Text>
                                </View>
                                {laQuanTri && (
                                    <TouchableOpacity
                                        style={styles.nutXoa}
                                        onPress={() => xuLyHuyLoiMoi(item.maLoiMoi, item.email)}
                                    >
                                        <Text style={[styles.chuXoa, { color: colors.textMuted }]}>Thu hồi</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* 5. Danh Sách Thành Viên Hiện Tại */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                        👥 THÀNH VIÊN HIỆN TẠI ({thanhVien.length})
                    </Text>
                    {dangTaiThanhVien ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        thanhVien.map((item) => {
                            const laToi = thongTinUser?.email === item.email;
                            return (
                                <View
                                    key={item.maNguoiDung}
                                    style={[styles.cardThanhVien, { backgroundColor: colors.card, borderColor: colors.border }]}
                                >
                                    <View style={styles.avatarMini}>
                                        <Text style={styles.avatarMiniText}>
                                            {item.hoTen.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.tenThanhVien, { color: colors.text }]}>
                                            {item.hoTen} {laToi ? '(Bạn)' : ''}
                                        </Text>
                                        <Text style={[styles.emailMini, { color: colors.textMuted }]}>{item.email}</Text>
                                        <Text
                                            style={[
                                                styles.vaiTroText,
                                                {
                                                    color:
                                                        item.vaiTro === 'ChuSo'
                                                            ? colors.primary
                                                            : item.vaiTro === 'QuanTri'
                                                            ? '#3b82f6'
                                                            : colors.textMuted,
                                                },
                                            ]}
                                        >
                                            {item.vaiTro === 'ChuSo'
                                                ? '👑 Chủ sổ'
                                                : item.vaiTro === 'QuanTri'
                                                ? '🛡️ Quản trị viên'
                                                : 'Thành viên'}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        {/* Nút phân quyền (chỉ Chủ sổ đối với thành viên khác) */}
                                        {laChuSo && item.vaiTro !== 'ChuSo' && !laToi && (
                                            <TouchableOpacity
                                                style={[styles.nutVaiTro, { borderColor: colors.border }]}
                                                onPress={() => xuLyDoiVaiTro(item.maNguoiDung, item.hoTen, item.vaiTro)}
                                            >
                                                <Text style={[styles.chuVaiTro, { color: colors.primary }]}>
                                                    {item.vaiTro === 'QuanTri' ? 'Hạ quyền' : 'Phân quyền'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        {/* Nút xóa thành viên (Chủ sổ xóa thành viên khác) */}
                                        {laChuSo && item.vaiTro !== 'ChuSo' && !laToi && (
                                            <TouchableOpacity
                                                style={styles.nutXoa}
                                                onPress={() => xuLyXoaThanhVien(item.maNguoiDung, item.email)}
                                            >
                                                <Text style={styles.chuXoa}>Xóa</Text>
                                            </TouchableOpacity>
                                        )}
                                        {/* Nút rời sổ (dành cho chính mình nếu không phải Chủ sổ) */}
                                        {!laChuSo && laToi && (
                                            <TouchableOpacity
                                                style={[styles.nutRoiSo, { borderColor: '#ef4444' }]}
                                                onPress={() => xuLyRoiSo(item.maNguoiDung)}
                                            >
                                                <Text style={styles.chuRoiSo}>Rời sổ</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>


            <Modal
                visible={modalDoiSo}
                transparent
                animationType="fade"
                onRequestClose={() => setModalDoiSo(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Chọn Sổ Chi Tiêu</Text>
                            <TouchableOpacity onPress={() => setModalDoiSo(false)}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {danhSachSo.map((s) => {
                                const dangChon = s.MaSoChiTieu === maSoChiTieu;
                                return (
                                    <TouchableOpacity
                                        key={s.MaSoChiTieu}
                                        style={[
                                            styles.itemSo,
                                            {
                                                backgroundColor: dangChon ? colors.primarySubtle : colors.cardSubtle,
                                                borderColor: dangChon ? colors.primary : colors.border,
                                            },
                                        ]}
                                        onPress={() => {
                                            chonSoChiTieu(s.MaSoChiTieu);
                                            setModalDoiSo(false);
                                        }}
                                    >
                                        <Text style={{ fontSize: 24, marginRight: 12 }}>
                                            {s.LoaiSo === 'GiaDinh' ? '👨‍👩‍👧‍👦' : '👤'}
                                        </Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.itemTenSo, { color: colors.text }]}>{s.TenSo}</Text>
                                            <Text style={[styles.itemLoaiSo, { color: colors.textMuted }]}>
                                                {s.LoaiSo === 'GiaDinh' ? 'Gia đình' : 'Cá nhân'} • Vai trò: {s.VaiTro === 'ChuSo' ? 'Chủ sổ' : 'Thành viên'}
                                            </Text>
                                        </View>
                                        {dangChon && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    nutBack: { width: 80 },
    chuBack: { fontSize: 16, fontWeight: '600' },
    title: { fontSize: 18, fontWeight: 'bold' },

    section: { marginBottom: 20 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 8,
    },

    loiMoiCard: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        marginBottom: 10,
        gap: 10,
    },
    tenSoLoiMoi: { fontSize: 16, fontWeight: '700' },
    nguoiMoiText: { fontSize: 13, marginTop: 2 },
    loiMoiButtons: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
    btnLoiMoi: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    btnLoiMoiText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

    cardSoHienTai: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    labelSo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    tenSoHienTai: { fontSize: 17, fontWeight: 'bold', marginTop: 2 },
    loaiSoBadge: { fontSize: 12, marginTop: 4, fontWeight: '500' },
    btnDoiSo: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    btnDoiSoText: { fontSize: 13, fontWeight: '700' },

    boxMoi: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    titleBox: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    subTitleBox: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
    formRow: { flexDirection: 'row', gap: 8 },
    inputMoi: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 14,
    },
    nutMoi: {
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 10,
        height: 44,
    },
    chuNutMoi: { color: '#fff', fontWeight: '700', fontSize: 14 },

    cardThanhVien: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    avatarMini: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarMiniText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
    tenThanhVien: { fontSize: 15, fontWeight: '600' },
    emailMini: { fontSize: 12, marginTop: 1 },
    vaiTroText: { fontSize: 12, marginTop: 3, fontWeight: '500' },
    nutXoa: { paddingHorizontal: 10, paddingVertical: 6 },
    chuXoa: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
    nutVaiTro: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
    chuVaiTro: { fontSize: 12, fontWeight: '600' },
    nutRoiSo: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
    chuRoiSo: { color: '#ef4444', fontSize: 12, fontWeight: '600' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalBox: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    itemSo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    itemTenSo: { fontSize: 15, fontWeight: '700' },
    itemLoaiSo: { fontSize: 12, marginTop: 2 },
});
