import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/appStore';
import { useVi } from '../../src/hooks/useVi';
import { formatCurrency } from '../../src/utils/formatCurrency';

export default function TrangChuScreen() {
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { data: danhSachVi, isLoading, isError } = useVi(maSoChiTieu);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.trangThai}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.trangThai}>
        <Text>Không tải được dữ liệu. Kiểm tra kết nối mạng.</Text>
      </SafeAreaView>
    );
  }

  const danhSach = danhSachVi ?? [];
  const tongSoDu = danhSach.reduce((tong, vi) => tong + vi.soDuBanDau, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        <View style={styles.tongQuanCard}>
          <Text style={styles.tongQuanLabel}>Tổng số dư</Text>
          <Text style={styles.tongQuanSoTien}>{formatCurrency(tongSoDu)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Ví của bạn</Text>
        {danhSach.length === 0 ? (
          <Text style={styles.rongText}>Chưa có ví nào. Vào tab Ví để thêm mới.</Text>
        ) : (
          <View style={styles.viRow}>
            {danhSach.map((vi) => (
              <View key={vi.maVi} style={styles.viCard}>
                <Text style={styles.viIcon}>{vi.bieuTuong}</Text>
                <Text style={styles.viTen} numberOfLines={1}>{vi.tenVi}</Text>
                <Text style={styles.viSoDu}>{formatCurrency(vi.soDuBanDau)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tongQuanCard: { backgroundColor: '#2563eb', borderRadius: 16, padding: 20, marginBottom: 20 },
  tongQuanLabel: { color: '#dbeafe', fontSize: 14 },
  tongQuanSoTien: { color: '#fff', fontSize: 30, fontWeight: 'bold', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  rongText: { color: '#9ca3af', fontStyle: 'italic' },
  viRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  viCard: {
    flexBasis: '30%', backgroundColor: '#fff', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  viIcon: { fontSize: 22 },
  viTen: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  viSoDu: { fontSize: 14, fontWeight: '600', marginTop: 2 },
});