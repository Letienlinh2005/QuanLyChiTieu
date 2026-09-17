import { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useDanhMuc } from '../../../src/hooks/useDanhMuc';
import { useNganSach, useTaoNganSach } from '../../../src/hooks/useNganSach';
import { useAppTheme } from '../../../src/store/themeStore';

const NGUONG_KHA_DUNG = [50, 70, 80, 90, 100];

export default function ThemNganSachScreen() {
  const params = useLocalSearchParams<{ thang?: string; nam?: string }>();
  const homNay = new Date();
  const thangApDung = Number(params.thang) || homNay.getMonth() + 1;
  const namApDung = Number(params.nam) || homNay.getFullYear();

  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { data: danhSachDanhMucChi } = useDanhMuc(maSoChiTieu, 'Chi');
  const { data: nganSachHienTai } = useNganSach(maSoChiTieu, thangApDung, namApDung);
  const taoNganSach = useTaoNganSach();
  const { isDark, colors } = useAppTheme();

  const [maDanhMuc, setMaDanhMuc] = useState<number | null>(null);
  const [soTien, setSoTien] = useState('');
  const [nguongCanhBao, setNguongCanhBao] = useState(80);

  const danhMucChuaCoNganSach = useMemo(() => {
    const daCoNganSach = new Set((nganSachHienTai ?? []).map((n) => n.maDanhMuc));
    return (danhSachDanhMucChi ?? []).filter((dm) => !daCoNganSach.has(dm.maDanhMuc));
  }, [danhSachDanhMucChi, nganSachHienTai]);

  const xuLyLuu = () => {
    if (!maSoChiTieu) {
      Alert.alert('Lỗi', 'Chưa xác định được sổ chi tiêu');
      return;
    }
    if (!maDanhMuc) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn danh mục');
      return;
    }
    const soTienSo = Number(soTien.replace(/\D/g, ''));
    if (!soTienSo || soTienSo <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    taoNganSach.mutate(
      {
        maSoChiTieu,
        maDanhMuc,
        soTien: soTienSo,
        thangApDung,
        namApDung,
        nguongCanhBao,
      },
      {
        onSuccess: () => router.back(),
        onError: (err: any) => {
          const thongBao = err?.response?.data?.message ?? 'Không tạo được ngân sách, thử lại sau';
          Alert.alert('Lỗi', thongBao);
        },
      }
    );
  };

  const chipSelectedStyle = {
    backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
    borderColor: colors.primary,
  };
  const chipSelectedTextStyle = {
    color: isDark ? '#93c5fd' : '#2563eb',
    fontWeight: '600' as const,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
          <Text style={[styles.chuBack, { color: colors.primary }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Thêm ngân sách</Text>
        <View style={styles.nutBack} />
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.tieuDePhu, { color: colors.textMuted }]}>
          Ngân sách cho tháng {thangApDung}/{namApDung}
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Danh mục</Text>
        <View style={styles.chonRow}>
          {danhMucChuaCoNganSach.map((dm) => {
            const isSelected = maDanhMuc === dm.maDanhMuc;
            return (
              <TouchableOpacity
                key={dm.maDanhMuc}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && chipSelectedStyle,
                ]}
                onPress={() => setMaDanhMuc(dm.maDanhMuc)}
              >
                <Text style={styles.chipIcon}>{dm.bieuTuong}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    { color: colors.text },
                    isSelected && chipSelectedTextStyle,
                  ]}
                >
                  {dm.tenDanhMuc}
                </Text>
              </TouchableOpacity>
            );
          })}
          {danhMucChuaCoNganSach.length === 0 && (
            <Text style={[styles.goiY, { color: colors.textMuted }]}>
              Tất cả danh mục chi đã có ngân sách cho tháng này.
            </Text>
          )}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Hạn mức (đ)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          value={soTien}
          onChangeText={setSoTien}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Ngưỡng cảnh báo</Text>
        <View style={styles.chonRow}>
          {NGUONG_KHA_DUNG.map((n) => {
            const isSelected = nguongCanhBao === n;
            return (
              <TouchableOpacity
                key={n}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && chipSelectedStyle,
                ]}
                onPress={() => setNguongCanhBao(n)}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: colors.text },
                    isSelected && chipSelectedTextStyle,
                  ]}
                >
                  {n}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.nutLuu, { backgroundColor: colors.primary }]}
          onPress={xuLyLuu}
          disabled={taoNganSach.isPending}
        >
          <Text style={styles.nutLuuChu}>
            {taoNganSach.isPending ? 'Đang lưu...' : 'Lưu ngân sách'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  nutBack: { minWidth: 70 },
  chuBack: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: 'bold' },
  container: { flex: 1, padding: 20 },
  tieuDePhu: { fontSize: 13, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16,
  },
  chonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1,
  },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 13 },
  goiY: { fontStyle: 'italic', fontSize: 13 },
  nutLuu: {
    borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40,
  },
  nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
