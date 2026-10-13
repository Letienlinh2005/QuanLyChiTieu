import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions,
  Image, FlatList, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useAppStore } from '../../src/store/appStore';
import { useTongQuanThang, useXuHuongThang, useBaoCaoNgay, useCacNgayTrongThang } from '../../src/hooks/useBaoCao';
import { useBaoCaoNam } from '../../src/hooks/useVayVon';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { useAppTheme } from '../../src/store/themeStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GiaoDichNgay, NgayTrongThang } from '../../src/types/baoCao';

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

function formatNgayNgan(isoDate: string) {
  const d = new Date(isoDate);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ======== Màn hình báo cáo theo NGÀY ========
function BaoCaoNgay({ maSoChiTieu, isDark, colors }: { maSoChiTieu: number | null; isDark: boolean; colors: any }) {
  const homNay = new Date();
  const [ngayChon, setNgayChon] = useState(homNay);
  const [thang, setThang] = useState(homNay.getMonth() + 1);
  const [nam, setNam] = useState(homNay.getFullYear());
  const [anhXemChiTiet, setAnhXemChiTiet] = useState<string | null>(null);

  const ngayStr = toIsoDate(ngayChon);
  const { data: baoCao, isLoading: dangTaiBaoCao, refetch: refetchBaoCao } = useBaoCaoNgay(maSoChiTieu, ngayStr);
  const { data: cacNgay, isLoading: dangTaiNgay, refetch: refetchNgay } = useCacNgayTrongThang(maSoChiTieu, thang, nam);

  useFocusEffect(
    useCallback(() => {
      if (maSoChiTieu) { refetchBaoCao(); refetchNgay(); }
    }, [maSoChiTieu, ngayStr])
  );

  const doiThang = (buoc: number) => {
    let thangMoi = thang + buoc;
    let namMoi = nam;
    if (thangMoi > 12) { thangMoi = 1; namMoi++; }
    if (thangMoi < 1) { thangMoi = 12; namMoi--; }
    setThang(thangMoi);
    setNam(namMoi);
    // Reset ngày về ngày 1 của tháng mới
    const ngayMoi = new Date(namMoi, thangMoi - 1, 1);
    setNgayChon(ngayMoi);
  };

  // Tạo lưới lịch tháng
  const ngayDauThang = new Date(nam, thang - 1, 1);
  const ngayTrongThangMap: Record<string, NgayTrongThang> = {};
  (cacNgay ?? []).forEach(n => { ngayTrongThangMap[String(n.ngay).slice(0, 10)] = n; });

  const soNgayTrongThang = new Date(nam, thang, 0).getDate();
  const thuDauThang = ngayDauThang.getDay(); // 0=CN, 1=T2...
  const thuOffset = thuDauThang === 0 ? 6 : thuDauThang - 1; // Chuyển về T2=0

  const oLich: (number | null)[] = [];
  for (let i = 0; i < thuOffset; i++) oLich.push(null);
  for (let i = 1; i <= soNgayTrongThang; i++) oLich.push(i);

  const mauLoai = (loai: string) => {
    if (loai === 'Thu') return '#10b981';
    if (loai === 'Chi') return '#ef4444';
    return '#6366f1';
  };

  return (
    <>
      {/* Header chọn tháng */}
      <View style={[styles.thangHeader, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => doiThang(-1)} style={styles.nutThang}>
          <Text style={[styles.nutThangChu, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.thangText, { color: colors.text }]}>{TEN_THANG[thang - 1]} {nam}</Text>
        <TouchableOpacity onPress={() => doiThang(1)} style={styles.nutThang}>
          <Text style={[styles.nutThangChu, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header các ngày trong tuần */}
        <View style={styles.lichHeader}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(t => (
            <Text key={t} style={[styles.lichThu, { color: colors.textMuted }]}>{t}</Text>
          ))}
        </View>

        {/* Lưới lịch */}
        {dangTaiNgay ? (
          <View style={styles.trangThai}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <View style={styles.lichLuoi}>
            {oLich.map((ngay, idx) => {
              if (ngay === null) return <View key={`empty-${idx}`} style={styles.lichO} />;
              const key = `${nam}-${String(thang).padStart(2, '0')}-${String(ngay).padStart(2, '0')}`;
              const coGD = ngayTrongThangMap[key];
              const isChon = toIsoDate(ngayChon) === key;
              const isHomNay = key === toIsoDate(homNay);

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.lichO,
                    isChon && { backgroundColor: colors.primary, borderRadius: 8 },
                    !isChon && isHomNay && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 8 },
                  ]}
                  onPress={() => setNgayChon(new Date(nam, thang - 1, ngay))}
                >
                  <Text style={[
                    styles.lichNgay,
                    { color: isChon ? '#fff' : colors.text },
                    isHomNay && !isChon && { color: colors.primary, fontWeight: '700' },
                  ]}>{ngay}</Text>
                  {coGD && (
                    <View style={styles.lichDotRow}>
                      {(coGD.tongThu ?? 0) > 0 && <View style={[styles.lichDot, { backgroundColor: '#10b981' }]} />}
                      {(coGD.tongChi ?? 0) > 0 && <View style={[styles.lichDot, { backgroundColor: '#ef4444' }]} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Tóm tắt ngày đã chọn */}
        <View style={[styles.ngayTomTat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.ngayTieuDe, { color: colors.text }]}>
            📅 {ngayChon.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Text>
          {dangTaiBaoCao ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
          ) : (
            <>
              <View style={styles.tongQuanRow}>
                <View style={[styles.tongQuanO, { backgroundColor: isDark ? '#052e16' : '#f0fdf4', borderColor: '#10b981' }]}>
                  <Text style={[styles.tongQuanLabel, { color: '#059669' }]}>Thu</Text>
                  <Text style={[styles.tongQuanSoTien, { color: '#10b981' }]}>{formatCurrency(baoCao?.tongThu ?? 0)}</Text>
                </View>
                <View style={[styles.tongQuanO, { backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderColor: '#ef4444' }]}>
                  <Text style={[styles.tongQuanLabel, { color: '#dc2626' }]}>Chi</Text>
                  <Text style={[styles.tongQuanSoTien, { color: '#ef4444' }]}>{formatCurrency(baoCao?.tongChi ?? 0)}</Text>
                </View>
                <View style={[styles.tongQuanO, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.tongQuanLabel, { color: colors.textMuted }]}>Chênh</Text>
                  <Text style={[styles.tongQuanSoTien, {
                    color: (baoCao?.chenhLech ?? 0) >= 0 ? '#10b981' : '#ef4444',
                  }]}>{formatCurrency(baoCao?.chenhLech ?? 0)}</Text>
                </View>
              </View>

              {/* Danh sách giao dịch trong ngày */}
              {(baoCao?.chiTiet ?? []).length === 0 ? (
                <View style={styles.rongNgay}>
                  <Ionicons name="calendar-outline" size={36} color={colors.textMuted} />
                  <Text style={[styles.rongText, { color: colors.textMuted }]}>Không có giao dịch trong ngày này</Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Giao dịch trong ngày</Text>
                  {(baoCao?.chiTiet ?? []).map((gd: GiaoDichNgay) => (
                    <View key={gd.maGiaoDich} style={[styles.gdItem, { backgroundColor: isDark ? '#1e1e2e' : '#f8fafc', borderColor: colors.border }]}>
                      <View style={[styles.gdIconBg, { backgroundColor: mauLoai(gd.loai) + '22' }]}>
                        <Text style={{ fontSize: 16 }}>{gd.bieuTuongDanhMuc ?? (gd.loai === 'ChuyenKhoan' ? '🔄' : gd.loai === 'Thu' ? '💰' : '💸')}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.gdTenDM, { color: colors.text }]}>
                          {gd.tenDanhMuc ?? (gd.loai === 'ChuyenKhoan' ? 'Chuyển khoản' : gd.loai)}
                        </Text>
                        <Text style={[styles.gdVi, { color: colors.textMuted }]}>{gd.bieuTuongVi} {gd.tenVi}</Text>
                        {gd.ghiChu ? <Text style={[styles.gdGhiChu, { color: colors.textMuted }]} numberOfLines={1}>{gd.ghiChu}</Text> : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.gdSoTien, { color: mauLoai(gd.loai) }]}>
                          {gd.loai === 'Chi' ? '-' : '+'}{formatCurrency(gd.soTien)}
                        </Text>
                        {gd.anhBangChung ? (
                          <TouchableOpacity
                            style={styles.anhNho}
                            onPress={() => setAnhXemChiTiet(gd.anhBangChung!)}
                            activeOpacity={0.8}
                          >
                            <Image source={{ uri: gd.anhBangChung }} style={styles.anhNhoImg} />
                            <View style={styles.iconScanBadge}>
                              <Ionicons name="search" size={9} color="#fff" />
                            </View>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Phân bổ theo danh mục trong ngày */}
              {(baoCao?.theoDanhMuc ?? []).length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Chi theo danh mục</Text>
                  {(baoCao?.theoDanhMuc ?? []).map((dm, i) => {
                    const tongChi = baoCao?.tongChi ?? 1;
                    const phanTram = tongChi > 0 ? (dm.tongTien / tongChi) * 100 : 0;
                    return (
                      <View key={dm.maDanhMuc} style={styles.dmRow}>
                        <Text style={[styles.dmBieuTuong]}>{dm.bieuTuong}</Text>
                        <View style={{ flex: 1 }}>
                          <View style={styles.dmTenRow}>
                            <Text style={[styles.dmTen, { color: colors.text }]}>{dm.tenDanhMuc}</Text>
                            <Text style={[styles.dmSoTien, { color: '#ef4444' }]}>{formatCurrency(dm.tongTien)}</Text>
                          </View>
                          <View style={[styles.dmThanhBar, { backgroundColor: isDark ? '#27272a' : '#f1f5f9' }]}>
                            <View style={[styles.dmThanhFill, { width: `${phanTram}%`, backgroundColor: MAU_DANH_MUC[i % MAU_DANH_MUC.length] }]} />
                          </View>
                          <Text style={[styles.dmPhanTram, { color: colors.textMuted }]}>{phanTram.toFixed(1)}%</Text>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal phóng to xem ảnh bằng chứng giao dịch đối chiếu */}
      <Modal visible={!!anhXemChiTiet} transparent animationType="fade">
        <View style={styles.modalOverlayAnh}>
          <TouchableOpacity style={styles.modalDongAnh} onPress={() => setAnhXemChiTiet(null)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {anhXemChiTiet && (
            <Image source={{ uri: anhXemChiTiet }} style={styles.anhFullSize} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </>
  );
}

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
  const [tabHienTai, setTabHienTai] = useState<'ngay' | 'thang' | 'nam'>('ngay');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Tab chuyển ngày / tháng / năm */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabNut, tabHienTai === 'ngay' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTabHienTai('ngay')}
        >
          <Text style={[styles.tabText, { color: tabHienTai === 'ngay' ? colors.primary : colors.textMuted }]}>📅 Ngày</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabNut, tabHienTai === 'thang' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTabHienTai('thang')}
        >
          <Text style={[styles.tabText, { color: tabHienTai === 'thang' ? colors.primary : colors.textMuted }]}>📊 Tháng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabNut, tabHienTai === 'nam' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTabHienTai('nam')}
        >
          <Text style={[styles.tabText, { color: tabHienTai === 'nam' ? colors.primary : colors.textMuted }]}>📈 Năm</Text>
        </TouchableOpacity>
      </View>

      {tabHienTai === 'ngay' && <BaoCaoNgay maSoChiTieu={maSoChiTieu} isDark={isDark} colors={colors} />}
      {tabHienTai === 'thang' && <BaoCaoThang maSoChiTieu={maSoChiTieu} isDark={isDark} colors={colors} />}
      {tabHienTai === 'nam' && <BaoCaoNam maSoChiTieu={maSoChiTieu} isDark={isDark} colors={colors} />}
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
  tabText: { fontSize: 13, fontWeight: '600' },
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
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 12 },
  rongText: { fontStyle: 'italic', marginBottom: 20, fontSize: 13 },
  bieuDoCot: { borderRadius: 12, marginBottom: 20 },

  // Lịch ngày
  lichHeader: { flexDirection: 'row', marginBottom: 4 },
  lichThu: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', paddingVertical: 4 },
  lichLuoi: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  lichO: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  lichNgay: { fontSize: 13, fontWeight: '500' },
  lichDotRow: { flexDirection: 'row', gap: 2, marginTop: 1 },
  lichDot: { width: 4, height: 4, borderRadius: 2 },

  // Tóm tắt ngày
  ngayTomTat: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  ngayTieuDe: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  rongNgay: { alignItems: 'center', paddingVertical: 24, gap: 8 },

  // Giao dịch item
  gdItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  gdIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gdTenDM: { fontSize: 14, fontWeight: '600' },
  gdVi: { fontSize: 12, marginTop: 1 },
  gdGhiChu: { fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  gdSoTien: { fontSize: 14, fontWeight: '700' },
  anhNho: { marginTop: 4 },
  anhNhoImg: { width: 40, height: 40, borderRadius: 6 },

  // Danh mục bar
  dmRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  dmBieuTuong: { fontSize: 20, marginTop: 2 },
  dmTenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dmTen: { fontSize: 13, fontWeight: '600' },
  dmSoTien: { fontSize: 13, fontWeight: '700' },
  dmThanhBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  dmThanhFill: { height: 6, borderRadius: 3 },
  dmPhanTram: { fontSize: 11, marginTop: 2 },

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
  iconScanBadge: {
    position: 'absolute', bottom: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4, padding: 2,
  },
  modalOverlayAnh: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  modalDongAnh: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
  },
  anhFullSize: {
    width: '100%', height: '80%', borderRadius: 12,
  },
});
