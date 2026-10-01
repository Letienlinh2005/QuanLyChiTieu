import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useAppStore } from '../../src/store/appStore';
import { useTongQuanThang, useXuHuongThang } from '../../src/hooks/useBaoCao';
import { useBaoCaoNam } from '../../src/hooks/useVayVon';
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

// ======== Màn hình báo cáo theo THÁNG ========
function BaoCaoThang({ maSoChiTieu, isDark, colors }: { maSoChiTieu: number | null; isDark: boolean; colors: any }) {
  const homNay = new Date();
  const [thang, setThang] = useState(homNay.getMonth() + 1);
  const [nam, setNam] = useState(homNay.getFullYear());

  const { data: tongQuan, isLoading: dangTaiTongQuan, refetch: refetchTongQuan } = useTongQuanThang(maSoChiTieu, thang, nam);
  const { data: xuHuong, isLoading: dangTaiXuHuong, refetch: refetchXuHuong } = useXuHuongThang(maSoChiTieu, 6);

  useFocusEffect(
    useCallback(() => {
      if (maSoChiTieu) { refetchTongQuan(); refetchXuHuong(); }
    }, [maSoChiTieu])
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
    <>
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
        <View style={styles.trangThai}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.tongQuanRow}>
            <View style={[styles.tongQuanO, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.tongQuanLabel, { color: colors.textMuted }]}>Thu</Text>
              <Text style={[styles.tongQuanSoTien, { color: '#10b981' }]}>{formatCurrency(tongQuan?.tongThu ?? 0)}</Text>
            </View>
            <View style={[styles.tongQuanO, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.tongQuanLabel, { color: colors.textMuted }]}>Chi</Text>
              <Text style={[styles.tongQuanSoTien, { color: '#ef4444' }]}>{formatCurrency(tongQuan?.tongChi ?? 0)}</Text>
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
                color: (opacity = 1) => isDark ? `rgba(96, 165, 250, ${opacity})` : `rgba(37, 99, 235, ${opacity})`,
                labelColor: () => (isDark ? '#a1a1aa' : '#374151'),
                propsForBackgroundLines: { stroke: isDark ? '#27272a' : '#f3f4f6' },
              }}
              style={StyleSheet.flatten([styles.bieuDoCot, isDark ? { borderWidth: 1, borderColor: colors.border } : {}])}
            />
          )}
        </ScrollView>
      )}
    </>
  );
}

// ======== Màn hình báo cáo theo NĂM ========
function BaoCaoNam({ maSoChiTieu, isDark, colors }: { maSoChiTieu: number | null; isDark: boolean; colors: any }) {
  const [nam, setNam] = useState(new Date().getFullYear());
  const { data, isLoading, refetch } = useBaoCaoNam(maSoChiTieu, nam);

  useFocusEffect(useCallback(() => { if (maSoChiTieu) refetch(); }, [maSoChiTieu]));

  const loiNhuan = data?.loiNhuan ?? 0;
  const loiNhuanNT = data?.namTruoc?.loiNhuan ?? 0;
  const coNamTruoc = (data?.namTruoc?.tongThu ?? 0) > 0 || (data?.namTruoc?.tongChi ?? 0) > 0;
  const chenhLechLN = loiNhuan - loiNhuanNT;
  const phanTramChenhLech = loiNhuanNT !== 0 ? ((chenhLechLN / Math.abs(loiNhuanNT)) * 100).toFixed(1) : null;

  // Build 12 tháng đầy đủ
  const muoiHaiThang = Array.from({ length: 12 }, (_, i) => {
    const t = data?.theoThang?.find((x) => x.thang === i + 1);
    return { thang: i + 1, tongThu: t?.tongThu ?? 0, tongChi: t?.tongChi ?? 0, loiNhuan: t?.loiNhuan ?? 0 };
  });

  const duLieuBieuDo = {
    labels: TEN_THANG_NGAN,
    datasets: [
      { data: muoiHaiThang.map((t) => t.tongThu), color: (o = 1) => `rgba(16,185,129,${o})` },
      { data: muoiHaiThang.map((t) => t.tongChi), color: (o = 1) => `rgba(239,68,68,${o})` },
    ],
    legend: ['Thu', 'Chi'],
  };

  const chartConfig = {
    backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
    backgroundGradientFrom: isDark ? '#1a1a2e' : '#f8fafc',
    backgroundGradientTo: isDark ? '#16213e' : '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(148,163,184,${opacity})` : `rgba(51,65,85,${opacity})`,
    labelColor: () => (isDark ? '#94a3b8' : '#475569'),
    propsForBackgroundLines: { stroke: isDark ? '#1e3a5f' : '#e2e8f0' },
  };

  if (isLoading) {
    return <View style={styles.trangThai}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Chọn năm */}
      <View style={[styles.thangHeader, { backgroundColor: colors.card, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => setNam(n => n - 1)} style={styles.nutThang}>
          <Text style={[styles.nutThangChu, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.thangText, { color: colors.text }]}>Năm {nam}</Text>
        <TouchableOpacity onPress={() => setNam(n => n + 1)} style={styles.nutThang}>
          <Text style={[styles.nutThangChu, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Tổng quan năm */}
      <View style={styles.tongQuanRow}>
        <View style={[styles.tongQuanO, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tongQuanLabel, { color: colors.textMuted }]}>Tổng thu</Text>
          <Text style={[styles.tongQuanSoTien, { color: '#10b981' }]}>{formatCurrency(data?.tongThu ?? 0)}</Text>
        </View>
        <View style={[styles.tongQuanO, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tongQuanLabel, { color: colors.textMuted }]}>Tổng chi</Text>
          <Text style={[styles.tongQuanSoTien, { color: '#ef4444' }]}>{formatCurrency(data?.tongChi ?? 0)}</Text>
        </View>
      </View>

      {/* Lợi nhuận */}
      <View style={[styles.loiNhuanCard, {
        backgroundColor: loiNhuan >= 0 ? (isDark ? '#052e16' : '#f0fdf4') : (isDark ? '#450a0a' : '#fef2f2'),
        borderColor: loiNhuan >= 0 ? '#10b981' : '#ef4444',
      }]}>
        <Text style={[styles.loiNhuanLabel, { color: colors.textMuted }]}>Lợi nhuận năm {nam}</Text>
        <Text style={[styles.loiNhuanSoTien, { color: loiNhuan >= 0 ? '#10b981' : '#ef4444' }]}>
          {loiNhuan >= 0 ? '+' : ''}{formatCurrency(loiNhuan)}
        </Text>
        <Text style={[styles.loiNhuanPhanTich, { color: loiNhuan >= 0 ? '#059669' : '#dc2626' }]}>
          {loiNhuan >= 0 ? '✅ Có lợi nhuận trong năm này' : '⚠️ Chi tiêu vượt thu nhập'}
        </Text>
      </View>

      {/* So sánh với năm trước */}
      {coNamTruoc && (
        <View style={[styles.soSanhCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.soSanhTieuDe, { color: colors.text }]}>So với năm {nam - 1}</Text>
          <View style={styles.soSanhRow}>
            <View style={styles.soSanhCot}>
              <Text style={[styles.soSanhNhan, { color: colors.textMuted }]}>Lợi nhuận {nam - 1}</Text>
              <Text style={[styles.soSanhGiaTri, { color: loiNhuanNT >= 0 ? '#10b981' : '#ef4444' }]}>
                {formatCurrency(loiNhuanNT)}
              </Text>
            </View>
            <View style={[styles.soSanhMui, { backgroundColor: chenhLechLN >= 0 ? '#d1fae5' : '#fee2e2' }]}>
              <Text style={{ color: chenhLechLN >= 0 ? '#059669' : '#dc2626', fontWeight: '700', fontSize: 12 }}>
                {chenhLechLN >= 0 ? '▲' : '▼'} {phanTramChenhLech ? `${Math.abs(Number(phanTramChenhLech))}%` : '—'}
              </Text>
            </View>
            <View style={styles.soSanhCot}>
              <Text style={[styles.soSanhNhan, { color: colors.textMuted }]}>Lợi nhuận {nam}</Text>
              <Text style={[styles.soSanhGiaTri, { color: loiNhuan >= 0 ? '#10b981' : '#ef4444' }]}>
                {formatCurrency(loiNhuan)}
              </Text>
            </View>
          </View>
          <View style={styles.soSanhChenhLech}>
            <Text style={[styles.soSanhNhan, { color: colors.textMuted }]}>Chênh lệch: </Text>
            <Text style={{ color: chenhLechLN >= 0 ? '#10b981' : '#ef4444', fontWeight: '700' }}>
              {chenhLechLN >= 0 ? '+' : ''}{formatCurrency(chenhLechLN)}
            </Text>
          </View>
        </View>
      )}

      {/* Biểu đồ 12 tháng */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Thu & Chi từng tháng</Text>
      <BarChart
        data={duLieuBieuDo}
        width={chieuRongManHinh - 32}
        height={240}
        yAxisLabel=""
        yAxisSuffix=""
        fromZero
        chartConfig={chartConfig}
        style={StyleSheet.flatten([styles.bieuDoCot, isDark ? { borderWidth: 1, borderColor: colors.border } : {}])}
      />

      {/* Bảng chi tiết từng tháng */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Chi tiết từng tháng</Text>
      <View style={[styles.bang, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.bangHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.bangHeaderText, { color: colors.textMuted, flex: 1.2 }]}>Tháng</Text>
          <Text style={[styles.bangHeaderText, { color: '#10b981', flex: 1.5, textAlign: 'right' }]}>Thu</Text>
          <Text style={[styles.bangHeaderText, { color: '#ef4444', flex: 1.5, textAlign: 'right' }]}>Chi</Text>
          <Text style={[styles.bangHeaderText, { color: colors.textMuted, flex: 1.5, textAlign: 'right' }]}>L/N</Text>
        </View>
        {muoiHaiThang.map((t) => (
          <View key={t.thang} style={[styles.bangRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.bangRowText, { color: colors.text, flex: 1.2 }]}>{TEN_THANG_NGAN[t.thang - 1]}</Text>
            <Text style={[styles.bangRowText, { color: '#10b981', flex: 1.5, textAlign: 'right' }]}>
              {t.tongThu > 0 ? formatCurrency(t.tongThu) : '—'}
            </Text>
            <Text style={[styles.bangRowText, { color: '#ef4444', flex: 1.5, textAlign: 'right' }]}>
              {t.tongChi > 0 ? formatCurrency(t.tongChi) : '—'}
            </Text>
            <Text style={[styles.bangRowText, {
              flex: 1.5, textAlign: 'right',
              color: t.loiNhuan > 0 ? '#10b981' : t.loiNhuan < 0 ? '#ef4444' : colors.textMuted,
            }]}>
              {t.tongThu === 0 && t.tongChi === 0 ? '—' : (t.loiNhuan >= 0 ? '+' : '') + formatCurrency(t.loiNhuan)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ======== Màn hình chính ========
export default function BaoCaoScreen() {
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { isDark, colors } = useAppTheme();
  const [tabHienTai, setTabHienTai] = useState<'thang' | 'nam'>('thang');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Tab chuyển tháng / năm */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabNut, tabHienTai === 'thang' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTabHienTai('thang')}
        >
          <Text style={[styles.tabText, { color: tabHienTai === 'thang' ? colors.primary : colors.textMuted }]}>Theo tháng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabNut, tabHienTai === 'nam' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTabHienTai('nam')}
        >
          <Text style={[styles.tabText, { color: tabHienTai === 'nam' ? colors.primary : colors.textMuted }]}>Theo năm</Text>
        </TouchableOpacity>
      </View>

      {tabHienTai === 'thang'
        ? <BaoCaoThang maSoChiTieu={maSoChiTieu} isDark={isDark} colors={colors} />
        : <BaoCaoNam maSoChiTieu={maSoChiTieu} isDark={isDark} colors={colors} />
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  tabNut: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  thangHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 20,
  },
  nutThang: { padding: 8 },
  nutThangChu: { fontSize: 24, fontWeight: '600' },
  thangText: { fontSize: 16, fontWeight: '600', minWidth: 120, textAlign: 'center' },
  tongQuanRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tongQuanO: {
    flex: 1, borderRadius: 12, padding: 10, borderWidth: 1,
  },
  tongQuanLabel: { fontSize: 11 },
  tongQuanSoTien: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  rongText: { fontStyle: 'italic', marginBottom: 20 },
  bieuDoCot: { borderRadius: 12, marginBottom: 20 },

  // Lợi nhuận card
  loiNhuanCard: {
    borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5,
    alignItems: 'center',
  },
  loiNhuanLabel: { fontSize: 13, marginBottom: 4 },
  loiNhuanSoTien: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  loiNhuanPhanTich: { fontSize: 13, fontWeight: '600' },

  // So sánh năm
  soSanhCard: {
    borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1,
  },
  soSanhTieuDe: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  soSanhRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  soSanhCot: { flex: 1 },
  soSanhNhan: { fontSize: 11, marginBottom: 2 },
  soSanhGiaTri: { fontSize: 13, fontWeight: '700' },
  soSanhMui: { borderRadius: 8, padding: 6, alignItems: 'center', minWidth: 54 },
  soSanhChenhLech: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

  // Bảng
  bang: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  bangHeader: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1,
  },
  bangHeaderText: { fontSize: 11, fontWeight: '700' },
  bangRow: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1,
  },
  bangRowText: { fontSize: 12 },
});
