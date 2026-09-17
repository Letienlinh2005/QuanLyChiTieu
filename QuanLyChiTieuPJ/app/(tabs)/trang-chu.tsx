import { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAppStore } from '../../src/store/appStore';
import { useVi } from '../../src/hooks/useVi';
import { useAppTheme } from '../../src/store/themeStore';
import { formatCurrency } from '../../src/utils/formatCurrency';

export default function TrangChuScreen() {
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { data: danhSachVi, isLoading, isError, refetch } = useVi(maSoChiTieu);
  const { isDark, colors } = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      if (maSoChiTieu) {
        refetch();
      }
    }, [maSoChiTieu, refetch])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.trangThai, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.trangThai, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textMuted }}>Không tải được dữ liệu. Kiểm tra kết nối mạng.</Text>
      </SafeAreaView>
    );
  }

  const danhSach = danhSachVi ?? [];
  const tongSoDu = danhSach.reduce((tong, vi) => tong + vi.soDuBanDau, 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.tongQuanCard, { backgroundColor: isDark ? '#1e3a8a' : '#2563eb', borderColor: isDark ? '#2563eb' : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
          <Text style={styles.tongQuanLabel}>Tổng số dư</Text>
          <Text style={styles.tongQuanSoTien}>{formatCurrency(tongSoDu)}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ví của bạn</Text>
        {danhSach.length === 0 ? (
          <Text style={[styles.rongText, { color: colors.textMuted }]}>Chưa có ví nào. Vào tab Ví để thêm mới.</Text>
        ) : (
          <View style={styles.viRow}>
            {danhSach.map((vi) => (
              <View
                key={vi.maVi}
                style={[
                  styles.viCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={styles.viIcon}>{vi.bieuTuong}</Text>
                <Text style={[styles.viTen, { color: colors.textMuted }]} numberOfLines={1}>{vi.tenVi}</Text>
                <Text style={[styles.viSoDu, { color: colors.text }]}>{formatCurrency(vi.soDuBanDau)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tongQuanCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  tongQuanLabel: { color: '#dbeafe', fontSize: 14 },
  tongQuanSoTien: { color: '#fff', fontSize: 30, fontWeight: 'bold', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  rongText: { fontStyle: 'italic' },
  viRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  viCard: {
    flexBasis: '30%', borderRadius: 12, padding: 12, borderWidth: 1,
  },
  viIcon: { fontSize: 22 },
  viTen: { fontSize: 13, marginTop: 6 },
  viSoDu: { fontSize: 14, fontWeight: '600', marginTop: 2 },
});