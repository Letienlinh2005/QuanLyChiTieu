import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useAppStore } from '../../src/store/appStore';
import { useTongQuanThang, useXuHuongThang } from '../../src/hooks/useBaoCao';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { useAppTheme } from '../../src/store/themeStore';

const TEN_THANG = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const TEN_THANG_NGAN = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const MAU_DANH_MUC = [
  '#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5',
];

const chieuRongManHinh = Dimensions.get('window').width;

export default function BaoCaoScreen() {
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { isDark, colors } = useAppTheme();

  const homNay = new Date();
  const [thang, setThang] = useState(homNay.getMonth() + 1);
  const [nam, setNam] = useState(homNay.getFullYear());

  const { data: tongQuan, isLoading: dangTaiTongQuan, refetch: refetchTongQuan } = useTongQuanThang(maSoChiTieu, thang, nam);
  const { data: xuHuong, isLoading: dangTaiXuHuong, refetch: refetchXuHuong } = useXuHuongThang(maSoChiTieu, 6);

  useFocusEffect(
    useCallback(() => {
      if (maSoChiTieu) {
        refetchTongQuan();
        refetchXuHuong();
      }
    }, [maSoChiTieu, refetchTongQuan, refetchXuHuong])
  );

  const doiThang = (buoc: number) => {
    let thangMoi = thang + buoc;
    let namMoi = nam;
    if (thangMoi > 12) { thangMoi = 1; namMoi += 1; }
    if (thangMoi < 1) { thangMoi = 12; namMoi -= 1; }
    setThang(thangMoi);
    setNam(namMoi);
  };

  const duLieuBieuDoTron = (tongQuan?.theoDanhMuc ?? []).map((dm, i) => ({
    name: dm.tenDanhMuc,
    population: dm.tongTien,
    color: MAU_DANH_MUC[i % MAU_DANH_MUC.length],
    legendFontColor: isDark ? '#d4d4d8' : '#374151',
    legendFontSize: 12,
  }));

  const duLieuBieuDoCot = {
    labels: (xuHuong ?? []).map((x) => TEN_THANG_NGAN[x.thang - 1]),
    datasets: [{ data: (xuHuong ?? []).map((x) => x.tongChi) }],
  };

  const dangTai = dangTaiTongQuan || dangTaiXuHuong;

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

      {dangTai ? (
        <View style={styles.trangThai}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.tongQuanRow}>
            <View style={[styles.tongQuanO, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.tongQuanLabel, { color: colors.textMuted }]}>Thu</Text>
              <Text style={[styles.tongQuanSoTien, { color: '#10b981' }]}>
                {formatCurrency(tongQuan?.tongThu ?? 0)}
              </Text>
            </View>
            <View style={[styles.tongQuanO, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.tongQuanLabel, { color: colors.textMuted }]}>Chi</Text>
              <Text style={[styles.tongQuanSoTien, { color: '#ef4444' }]}>
                {formatCurrency(tongQuan?.tongChi ?? 0)}
              </Text>
            </View>
            <View style={[styles.tongQuanO, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.tongQuanLabel, { color: colors.textMuted }]}>Chênh lệch</Text>
              <Text style={[styles.tongQuanSoTien, { color: colors.text }]}>
                {formatCurrency((tongQuan?.tongThu ?? 0) - (tongQuan?.tongChi ?? 0))}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Chi tiêu theo danh mục</Text>
          {duLieuBieuDoTron.length === 0 ? (
            <Text style={[styles.rongText, { color: colors.textMuted }]}>Chưa có chi tiêu nào trong tháng này.</Text>
          ) : (
            <PieChart
              data={duLieuBieuDoTron}
              width={chieuRongManHinh - 32}
              height={200}
              chartConfig={{ color: () => (isDark ? '#d4d4d8' : '#374151') }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="8"
            />
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Chi tiêu 6 tháng gần nhất</Text>
          {(xuHuong ?? []).length === 0 ? (
            <Text style={[styles.rongText, { color: colors.textMuted }]}>Chưa có dữ liệu.</Text>
          ) : (
            <BarChart
              data={duLieuBieuDoCot}
              width={chieuRongManHinh - 32}
              height={220}
              yAxisLabel=""
              yAxisSuffix="đ"
              fromZero
              chartConfig={{
                backgroundColor: isDark ? '#121212' : '#ffffff',
                backgroundGradientFrom: isDark ? '#121212' : '#ffffff',
                backgroundGradientTo: isDark ? '#121212' : '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) =>
                  isDark ? `rgba(96, 165, 250, ${opacity})` : `rgba(37, 99, 235, ${opacity})`,
                labelColor: () => (isDark ? '#a1a1aa' : '#374151'),
                propsForBackgroundLines: { stroke: isDark ? '#27272a' : '#f3f4f6' },
              }}
              style={StyleSheet.flatten([
                styles.bieuDoCot,
                isDark ? { borderWidth: 1, borderColor: colors.border } : {},
              ])}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thangHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 20,
  },
  nutThang: { padding: 8 },
  nutThangChu: { fontSize: 24, fontWeight: '600' },
  thangText: { fontSize: 16, fontWeight: '600', minWidth: 120, textAlign: 'center' },
  tongQuanRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tongQuanO: {
    flex: 1, borderRadius: 12, padding: 10,
    borderWidth: 1,
  },
  tongQuanLabel: { fontSize: 11 },
  tongQuanSoTien: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  rongText: { fontStyle: 'italic', marginBottom: 20 },
  bieuDoCot: { borderRadius: 12, marginBottom: 20 },
});
