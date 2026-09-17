import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useNganSach, useXoaNganSach } from '../../../src/hooks/useNganSach';
import { formatCurrency } from '../../../src/utils/formatCurrency';
import { NganSachChiTiet } from '../../../src/types/nganSach';
import { useAppTheme } from '../../../src/store/themeStore';

const TEN_THANG = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function mauThanhTienDo(phanTram: number, nguong: number): string {
  if (phanTram >= 100) return '#ef4444';
  if (phanTram >= nguong) return '#f59e0b';
  return '#10b981';
}

export default function DanhSachNganSachScreen() {
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { isDark, colors } = useAppTheme();

  const homNay = new Date();
  const [thang, setThang] = useState(homNay.getMonth() + 1);
  const [nam, setNam] = useState(homNay.getFullYear());

  const { data: danhSach, isLoading, isError, refetch } = useNganSach(maSoChiTieu, thang, nam);
  const xoaNganSach = useXoaNganSach(maSoChiTieu);

  useFocusEffect(
    useCallback(() => {
      if (maSoChiTieu) {
        refetch();
      }
    }, [maSoChiTieu, refetch])
  );

  const doiThang = (buoc: number) => {
    let thangMoi = thang + buoc;
    let namMoi = nam;
    if (thangMoi > 12) { thangMoi = 1; namMoi += 1; }
    if (thangMoi < 1) { thangMoi = 12; namMoi -= 1; }
    setThang(thangMoi);
    setNam(namMoi);
  };

  const xuLyTuyChon = (item: NganSachChiTiet) => {
    Alert.alert(
      'Tuỳ chọn ngân sách',
      `Bạn muốn làm gì với ngân sách "${item.tenDanhMuc}"?`,
      [
        {
          text: 'Sửa',
          onPress: () => router.push({
            pathname: '/ngan-sach/sua',
            params: { id: item.maNganSach, thang, nam }
          })
        },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: () => {
            xoaNganSach.mutate(item.maNganSach, {
              onError: () => Alert.alert('Lỗi', 'Không xoá được ngân sách, thử lại sau'),
            });
          },
        },
        { text: 'Huỷ', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.thangHeader, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => doiThang(-1)} style={styles.nutThang}>
          <Text style={[styles.nutThangChu, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.thangText, { color: colors.text }]}>{TEN_THANG[thang - 1]} {nam}</Text>
        <TouchableOpacity onPress={() => doiThang(1)} style={styles.nutThang}>
          <Text style={[styles.nutThangChu, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.trangThai}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.trangThai}>
          <Text style={{ color: colors.textMuted }}>Không tải được ngân sách. Kiểm tra kết nối mạng.</Text>
        </View>
      ) : (
        <FlatList
          data={danhSach ?? []}
          keyExtractor={(item) => String(item.maNganSach)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={[styles.rongText, { color: colors.textMuted }]}>
              Chưa có ngân sách nào cho tháng này. Bấm nút + để thêm.
            </Text>
          }
          renderItem={({ item }) => {
            const phanTram = item.soTien > 0 ? Math.round((item.daChi / item.soTien) * 100) : 0;
            const conLai = item.soTien - item.daChi;
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onLongPress={() => xuLyTuyChon(item)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.icon}>{item.bieuTuong}</Text>
                  <Text style={[styles.tenDanhMuc, { color: colors.text }]} numberOfLines={1}>{item.tenDanhMuc}</Text>
                  <Text style={[styles.phanTram, { color: colors.textSecondary }]}>{phanTram}%</Text>
                </View>

                <View style={[styles.thanhNen, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]}>
                  <View
                    style={[
                      styles.thanhTienDo,
                      {
                        width: `${Math.min(phanTram, 100)}%`,
                        backgroundColor: mauThanhTienDo(phanTram, item.nguongCanhBao),
                      },
                    ]}
                  />
                </View>

                <View style={styles.cardFooter}>
                  <Text style={[styles.daChiText, { color: colors.textMuted }]}>
                    Đã chi {formatCurrency(item.daChi)} / {formatCurrency(item.soTien)}
                  </Text>
                  <Text style={[styles.conLaiText, { color: conLai >= 0 ? '#10b981' : '#ef4444' }]}>
                    {conLai >= 0 ? `Còn ${formatCurrency(conLai)}` : `Vượt ${formatCurrency(-conLai)}`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push({ pathname: '/ngan-sach/them', params: { thang: String(thang), nam: String(nam) } })}
      >
        <Text style={styles.fabChu}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thangHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 20,
  },
  nutThang: { padding: 8 },
  nutThangChu: { fontSize: 24, fontWeight: '600' },
  thangText: { fontSize: 16, fontWeight: '600', minWidth: 120, textAlign: 'center' },
  rongText: { fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  card: {
    borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  icon: { fontSize: 20, marginRight: 8 },
  tenDanhMuc: { flex: 1, fontSize: 15, fontWeight: '600' },
  phanTram: { fontSize: 13, fontWeight: '700' },
  thanhNen: { height: 8, borderRadius: 4, overflow: 'hidden' },
  thanhTienDo: { height: 8, borderRadius: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  daChiText: { fontSize: 12 },
  conLaiText: { fontSize: 12, fontWeight: '600' },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  fabChu: { color: '#fff', fontSize: 30, fontWeight: '400', marginTop: -2 },
});
