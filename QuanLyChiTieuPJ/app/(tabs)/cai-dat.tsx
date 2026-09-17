import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../../src/store/authStore';
import { useAppTheme, ThemeMode } from '../../src/store/themeStore';

export default function CaiDatScreen() {
    const nguoiDung = useAuthStore((s) => s.nguoiDung);
    const dangXuat = useAuthStore((s) => s.dangXuat);
    const { isDark, themeMode, setThemeMode, colors } = useAppTheme();

    const xuLyDangXuat = async () => {
        await dangXuat();
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
            <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* User Info Card */}
                <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.avatarBox, { backgroundColor: colors.primarySubtle }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {(nguoiDung?.hoTen || 'U').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.hoTen, { color: colors.text }]}>{nguoiDung?.hoTen || 'Người dùng'}</Text>
                        <Text style={[styles.email, { color: colors.textMuted }]}>{nguoiDung?.email}</Text>
                    </View>
                </View>

                {/* Theme Selector Section */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>GIAO DIỆN HIỂN THỊ</Text>
                <View style={[styles.themeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.themeOptionsRow}>
                        {[
                            { mode: 'light' as ThemeMode, label: 'Sáng', icon: 'sunny-outline' },
                            { mode: 'dark' as ThemeMode, label: 'Tối OLED', icon: 'moon' },
                            { mode: 'system' as ThemeMode, label: 'Hệ thống', icon: 'phone-portrait-outline' },
                        ].map((item) => {
                            const active = themeMode === item.mode;
                            return (
                                <TouchableOpacity
                                    key={item.mode}
                                    style={[
                                        styles.themeOption,
                                        { backgroundColor: active ? colors.primary : colors.cardSubtle },
                                    ]}
                                    onPress={() => setThemeMode(item.mode)}
                                >
                                    <Ionicons
                                        name={item.icon as any}
                                        size={20}
                                        color={active ? '#ffffff' : colors.textMuted}
                                    />
                                    <Text
                                        style={[
                                            styles.themeOptionText,
                                            { color: active ? '#ffffff' : colors.text },
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {isDark && (
                        <Text style={[styles.oledNote, { color: colors.textMuted }]}>
                            ⚡ Đang kích hoạt OLED True Black (#000000) giúp tắt điểm ảnh tiết kiệm pin.
                        </Text>
                    )}
                </View>

                {/* Features List */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TÍNH NĂNG & QUẢN LÝ</Text>
                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push('/danh-muc')}
                >
                    <Ionicons name="pricetags-outline" size={20} color={colors.primary} style={styles.menuIcon} />
                    <Text style={[styles.menuText, { color: colors.text }]}>Quản lý danh mục cá nhân</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push('/thanh-vien')}
                >
                    <Ionicons name="people-outline" size={20} color={colors.primary} style={styles.menuIcon} />
                    <Text style={[styles.menuText, { color: colors.text }]}>Thành viên & Sổ gia đình</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push('/doi-mat-khau')}
                >
                    <Ionicons name="key-outline" size={20} color={colors.textMuted} style={styles.menuIcon} />
                    <Text style={[styles.menuText, { color: colors.text }]}>Đổi mật khẩu</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.nutDangXuat, { backgroundColor: colors.dangerSubtle, borderColor: colors.danger }]}
                    onPress={xuLyDangXuat}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.danger} style={{ marginRight: 8 }} />
                    <Text style={[styles.chuDangXuat, { color: colors.danger }]}>Đăng xuất</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1, padding: 16 },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    avatarBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: { fontSize: 20, fontWeight: 'bold' },
    hoTen: { fontSize: 18, fontWeight: '700' },
    email: { fontSize: 13, marginTop: 2 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginLeft: 4,
    },
    themeBox: {
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        marginBottom: 24,
    },
    themeOptionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    themeOptionText: { fontSize: 13, fontWeight: '600' },
    oledNote: { fontSize: 12, marginTop: 10, textAlign: 'center', fontStyle: 'italic' },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    menuIcon: { marginRight: 12 },
    menuText: { flex: 1, fontSize: 15, fontWeight: '500' },
    nutDangXuat: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
    },
    chuDangXuat: { fontSize: 15, fontWeight: '600' },
});