import { useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useGiaoDich, useXoaGiaoDich } from '../../../src/hooks/useGiaoDich';
import { formatCurrency } from '../../../src/utils/formatCurrency';
import { formatDate } from '../../../src/utils/formatDate';
import { GiaoDichChiTiet } from '../../../src/types/giaoDich';

const TEN_THANG = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

export default function DanhSachGiaoDichScreen() {
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);

  const homNay = new Date();
  const [thang, setThang] = useState(homNay.getMonth() + 1);
  const [nam, setNam] = useState(homNay.getFullYear());

  const { data: danhSach, isLoading, isError } = useGiaoDich(maSoChiTieu, thang, nam);
  const xoaGiaoDich = useXoaGiaoDich(maSoChiTieu);

  const doiThang = (buoc: number) => {
    let thangMoi = thang + buoc;
    let namMoi = nam;
    if (thangMoi > 12) { thangMoi = 1; namMoi += 1; }
    if (thangMoi < 1) { thangMoi = 12; namMoi -= 1; }
    setThang(thangMoi);
    setNam(namMoi);
  };

  const { tongThu, tongChi } = useMemo(() => {
    const list = danhSach ?? [];
    return {
      tongThu: list.filter((g) => g.loai === 'Thu').reduce((t, g) => t + g.soTien, 0),
      tongChi: list.filter((g) => g.loai === 'Chi').reduce((t, g) => t + g.soTien, 0),
    };
  }, [danhSach]);

  const xuLyTuyChon = (item: GiaoDichChiTiet) => {
    Alert.alert(
      'Tùy chọn giao dịch',
      `Bạn muốn làm gì với giao dịch "${item.tenDanhMuc || 'Chuyển khoản'}"?`,
      [
        {
          text: 'Sửa',
          onPress: () => router.push({
            pathname: '/giao-dich/sua',
            params: { id: item.maGiaoDich, thang, nam }
          })
        },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: () => {
            xoaGiaoDich.mutate(item.maGiaoDich, {
              onError: () => Alert.alert('Lỗi', 'Không xoá được giao dịch, thử lại sau'),
            });
          },
        },
        { text: 'Huỷ', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.thangHeader}>
        <TouchableOpacity onPress={() => doiThang(-1)} style={styles.nutThang}>
          <Text style={styles.nutThangChu}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.thangText}>{TEN_THANG[thang - 1]} {nam}</Text>
        <TouchableOpacity onPress={() => doiThang(1)} style={styles.nutThang}>
          <Text style={styles.nutThangChu}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tongQuanRow}>
        <View style={styles.tongQuanO}>
          <Text style={styles.tongQuanLabel}>Thu</Text>
          <Text style={[styles.tongQuanSoTien, { color: '#16a34a' }]}>{formatCurrency(tongThu)}</Text>
        </View>
        <View style={styles.tongQuanO}>
          <Text style={styles.tongQuanLabel}>Chi</Text>
          <Text style={[styles.tongQuanSoTien, { color: '#dc2626' }]}>{formatCurrency(tongChi)}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.trangThai}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : isError ? (
        <View style={styles.trangThai}>
          <Text>Không tải được giao dịch. Kiểm tra kết nối mạng.</Text>
        </View>
      ) : (
        <FlatList
          data={danhSach ?? []}
          keyExtractor={(item) => String(item.maGiaoDich)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.rongText}>Chưa có giao dịch nào trong tháng này.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.giaoDichCard}
              onLongPress={() => xuLyTuyChon(item)}
            >
              <Text style={styles.icon}>
                {item.loai === 'ChuyenKhoan' ? '🔁' : item.bieuTuongDanhMuc ?? '📌'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tenDanhMuc} numberOfLines={1}>
                  {item.loai === 'ChuyenKhoan' ? 'Chuyển khoản' : item.tenDanhMuc ?? 'Khác'}
                </Text>
                <Text style={styles.chiTietPhu}>
                  {item.tenVi} · {formatDate(item.ngayGiaoDich)}
                  {item.ghiChu ? ` · ${item.ghiChu}` : ''}
                </Text>
              </View>
              <Text
                style={[
                  styles.soTien,
                  {
                    color: item.loai === 'Thu' ? '#16a34a'
                      : item.loai === 'Chi' ? '#dc2626' : '#374151',
                  },
                ]}
              >
                {item.loai === 'Thu' ? '+' : item.loai === 'Chi' ? '-' : ''}{formatCurrency(item.soTien)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/giao-dich/them')}>
        <Text style={styles.fabChu}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thangHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 20,
  },
  nutThang: { padding: 8 },
  nutThangChu: { fontSize: 22, color: '#2563eb', fontWeight: '600' },
  thangText: { fontSize: 16, fontWeight: '600', minWidth: 120, textAlign: 'center' },
  tongQuanRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8,
  },
  tongQuanO: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  tongQuanLabel: { fontSize: 12, color: '#9ca3af' },
  tongQuanSoTien: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  rongText: { color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  giaoDichCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb',
  },
  icon: { fontSize: 24, marginRight: 12 },
  tenDanhMuc: { fontSize: 15, fontWeight: '600' },
  chiTietPhu: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  soTien: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  fabChu: { color: '#fff', fontSize: 30, fontWeight: '400', marginTop: -2 },
});
